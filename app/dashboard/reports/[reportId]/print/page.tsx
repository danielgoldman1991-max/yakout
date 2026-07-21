import { notFound } from "next/navigation";
import { getReportDefinition } from "@/lib/reports/definitions";
import { getReportData } from "@/lib/reports/data";
import { canUseReportOutputs } from "@/lib/reports/certification";
import { getUserPermissions } from "@/lib/reports/permissions";
import { formatCurrency, formatPercent, formatReportDate } from "@/lib/reports/formatters";
import type { ReportTableColumn } from "@/lib/reports/data/types";

function formatCell(val: string | number | null | undefined, col: ReportTableColumn): string {
  if (val == null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (col.format === "currency") return formatCurrency(num);
  if (col.format === "percent") return formatPercent(num);
  if (col.format === "integer") return new Intl.NumberFormat("fr-FR").format(num);
  return String(val);
}

export default async function ReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { reportId } = await params;
  const sp = await searchParams;

  const def = getReportDefinition(reportId);
  if (!def) notFound();

  const permissions = await getUserPermissions();
  if (!permissions.includes(def.permission)) {
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Accès refusé - Yakout</title>
        </head>
        <body style={{ fontFamily: "Arial, sans-serif", padding: 32 }}>
          <h1>Accès refusé</h1><p>Vous ne disposez pas de la permission nécessaire.</p>
        </body>
      </html>
    );
  }

  const periodStart = (sp.period_start as string) ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = (sp.period_end as string) ?? new Date().toISOString().slice(0, 10);

  const data = await getReportData(reportId, {
    period_start: periodStart,
    period_end: periodEnd,
  });
  if (!canUseReportOutputs(data)) return <html><head><meta charSet="utf-8" /><title>Rapport indisponible - Yakout</title></head><body><h1>Rapport indisponible</h1><p>Aucune impression n’est générée tant que le loader du rapport échoue.</p></body></html>;

  const genDate = formatReportDate(data.metadata.generatedAt);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{def.title} — Yakout</title>
        <style>{`
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #1c1b1a; line-height: 1.5; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #c8a44e; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
          .header h1 { font-size: 18px; margin: 0; }
          .meta { font-size: 10px; color: #666; }
          .kpi-grid { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
          .kpi-box { flex: 1; min-width: 140px; border: 1px solid #ddd; border-radius: 3px; padding: 8px 10px; }
          .kpi-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
          .kpi-value { font-size: 18px; font-weight: 600; margin-top: 2px; }
          .kpi-desc { font-size: 9px; color: #888; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10px; }
          th { padding: 6px 8px; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; background: #1c1b1a; color: white; text-align: left; }
          th.right { text-align: right; }
          td { padding: 4px 8px; border-bottom: 1px solid #ddd; }
          td.right { text-align: right; }
          tr:nth-child(even) td { background: #f9f8f6; }
          .total td { font-weight: 700; border-top: 2px solid #1c1b1a; background: #f0ede8 !important; }
          h2 { font-size: 13px; margin: 16px 0 4px; }
          .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 8px; color: #999; text-align: center; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 8px; border-radius: 3px; font-size: 10px; margin: 8px 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div style={{ width: 32, height: 32, background: "#c8a44e", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 12 }}>Y</div>
          <div>
            <h1>{def.title}</h1>
            <div className="meta">{def.description} · {formatReportDate(periodStart)} → {formatReportDate(periodEnd)} · Généré le {genDate} · {data.metadata.availability === "available_with_warnings" ? "Disponible avec réserves" : "Disponible"}</div>
          </div>
        </div>

        {data.warnings.length > 0 && (
          <div className="warning">{data.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}</div>
        )}

        <div className="kpi-grid">
          {data.kpis.map((kpi, i) => (
            <div key={i} className="kpi-box">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              {kpi.description && <div className="kpi-desc">{kpi.description}</div>}
            </div>
          ))}
        </div>

        {data.tables.map((table, ti) => (
          <div key={ti} style={{ breakInside: "avoid" }}>
            <h2>{table.title}</h2>
            <table>
              <thead>
                <tr>
                  {table.columns.map((col, ci) => (
                    <th key={ci} className={col.align === "right" ? "right" : ""}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {table.columns.map((col, ci) => (
                      <td key={ci} className={col.align === "right" ? "right" : ""}>{formatCell(row[col.key], col)}</td>
                    ))}
                  </tr>
                ))}
                {table.totals && Object.keys(table.totals).length > 0 && (
                  <tr className="total">
                    {table.columns.map((col, ci) => {
                      const val = table.totals![col.key];
                      if (val == null) return <td key={ci} />;
                      return <td key={ci} className={col.align === "right" ? "right" : ""}>{formatCell(val, col)}</td>;
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}

        <div className="footer">
          Yakout Hospitality · Rapport : {def.title} · Période : {formatReportDate(periodStart)} → {formatReportDate(periodEnd)} · Généré le {genDate}
        </div>
      </body>
    </html>
  );
}
