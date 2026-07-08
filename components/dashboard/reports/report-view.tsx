"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart, Download, FileSpreadsheet, Printer, RefreshCw } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatReportDate, formatCurrency, formatPercent } from "@/lib/reports/formatters";
import type { ReportData, ReportTable, ReportChart, ReportTableColumn } from "@/lib/reports/data/types";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useState } from "react";
import Link from "next/link";

const CHART_COLORS = ["#c8a44e", "#9c2a2a", "#3c2a1e", "#f5ede0", "#d4a574", "#6b5b4a", "#e8c86a", "#7a4a4a"];

function formatCellValue(val: string | number | null | undefined, col: ReportTableColumn): string {
  if (val == null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (col.format === "currency") return formatCurrency(num);
  if (col.format === "percent") return formatPercent(num);
  if (col.format === "integer") return new Intl.NumberFormat("fr-FR").format(num);
  return String(val);
}

function ReportTableComponent({ table }: { table: ReportTable }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            {table.columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 ${col.align === "right" ? "text-right" : "text-left"}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
              {table.columns.map((col) => (
                <td key={col.key} className={`px-3 py-2 text-foreground/80 ${col.align === "right" ? "text-right font-medium" : "text-left"}`}>
                  {formatCellValue(row[col.key], col)}
                </td>
              ))}
            </tr>
          ))}
          {table.totals && Object.keys(table.totals).length > 0 && (
            <tr className="border-t-2 border-foreground/20 font-semibold bg-accent/20">
              {table.columns.map((col) => {
                const tot = table.totals![col.key];
                if (tot == null) return <td key={col.key} className="px-3 py-2" />;
                return (
                  <td key={col.key} className={`px-3 py-2 text-foreground ${col.align === "right" ? "text-right" : "text-left"}`}>
                    {formatCellValue(tot, col)}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportChartComponent({ chart }: { chart: ReportChart }) {
  const data = chart.labels.map((label, i) => ({
    name: label,
    ...Object.fromEntries(chart.datasets.map((ds) => [ds.label, ds.values[i] ?? 0])),
  }));

  const renderChart = () => {
    switch (chart.type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e4e0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {chart.datasets.map((ds, i) => (
                <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={ds.color || CHART_COLORS[i]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e4e0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {chart.datasets.map((ds, i) => (
                <Bar key={ds.label} dataKey={ds.label} fill={ds.color || CHART_COLORS[i]} radius={[2, 2, 0, 0]} />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey={chart.datasets[0]?.label || "value"} nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <p className="text-sm text-muted-foreground/60 text-center py-8">Graphique non disponible</p>;
    }
  };

  return (
    <div className="rounded-sm border border-border/40 bg-background p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">{chart.title}</h4>
      {renderChart()}
    </div>
  );
}

type ReportViewProps = {
  report: ReportData;
  reportId: string;
};

export function ReportView({ report, reportId }: ReportViewProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const isCertified = report.metadata.certificationStatus === "certified";
  const canUseOutputs = isCertified || report.metadata.testingMode === true;

  const handleExport = async (format: "pdf" | "xlsx") => {
    setExporting(format);
    try {
      const res = await fetch(`/api/reports/${reportId}/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { period_start: report.metadata.periodStart, period_end: report.metadata.periodEnd },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        alert(err.error || "L'export n'a pas pu Ãªtre gÃ©nÃ©rÃ©.");
        return;
      }

      const blob = await res.blob();
      const ext = format === "pdf" ? "pdf" : "xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportId}-${report.metadata.periodStart || "all"}-${report.metadata.periodEnd || "all"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("L'export n'a pas pu Ãªtre gÃ©nÃ©rÃ©.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports" className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-gold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux rapports
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.refresh()} className="flex items-center gap-1.5 rounded-sm border border-border/40 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </button>
          <button onClick={() => handleExport("pdf")} disabled={!canUseOutputs || exporting === "pdf"} title={!isCertified ? "Export dÃ©sactivÃ© tant que le rapport n'est pas certifiÃ©." : undefined} className="flex items-center gap-1.5 rounded-sm border border-border/40 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50 transition-colors disabled:opacity-50">
            <Download className="h-3.5 w-3.5" />
            {exporting === "pdf" ? "GÃ©nÃ©ration..." : "PDF"}
          </button>
          <button onClick={() => handleExport("xlsx")} disabled={!canUseOutputs || exporting === "xlsx"} title={!isCertified ? "Export dÃ©sactivÃ© tant que le rapport n'est pas certifiÃ©." : undefined} className="flex items-center gap-1.5 rounded-sm border border-border/40 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50 transition-colors disabled:opacity-50">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {exporting === "xlsx" ? "GÃ©nÃ©ration..." : "XLSX"}
          </button>
          <button onClick={() => canUseOutputs && window.print()} disabled={!canUseOutputs} title={!isCertified ? "Impression dÃ©sactivÃ©e tant que le rapport n'est pas certifiÃ©." : undefined} className="flex items-center gap-1.5 rounded-sm border border-border/40 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/50 transition-colors disabled:opacity-50">
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </button>
        </div>
      </div>

      {!isCertified && (
        <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <div className="font-semibold">{report.metadata.testingMode ? "Mode test - données non certifiées" : "Données non certifiées"}</div>
          <p className="mt-1 text-xs leading-relaxed">
            {report.metadata.testingMode ? "Les exports PDF, XLSX, l'impression et les totaux sont actifs pour les tests uniquement. Ne pas utiliser ces données pour une décision." : "Les exports PDF, XLSX, l'impression et les totaux sont désactivés jusqu'à certification indépendante du rapport."}
          </p>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          {report.warnings.map((w, i) => (<div key={i} className="flex items-start gap-2"><span>âš </span><span>{w}</span></div>))}
        </div>
      )}

      {report.kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {report.kpis.map((kpi, i) => (
            <KpiCard key={i} title={kpi.label} value={kpi.value} description={kpi.description} icon={BarChart} trend={kpi.trend} />
          ))}
        </div>
      )}

      {report.charts && report.charts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {report.charts.map((chart, i) => (
            <ReportChartComponent key={i} chart={chart} />
          ))}
        </div>
      )}

      {report.tables.length > 0 && report.tables.map((table, i) => (
        <Card key={i} className="print:break-inside-avoid">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">{table.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ReportTableComponent table={table} />
          </CardContent>
        </Card>
      ))}

      {!canUseOutputs && report.tables.length === 0 && report.kpis.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            DonnÃ©es indisponibles ou non certifiÃ©es.
          </CardContent>
        </Card>
      )}

      <div className="text-center text-[9px] text-muted-foreground/40 print:block no-print:hidden">
        Yakout Hospitality Â· GÃ©nÃ©rÃ© le {formatReportDate(report.metadata.generatedAt)}
      </div>
    </div>
  );
}
