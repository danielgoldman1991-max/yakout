import "server-only";
import type { ReportData } from "../data/types";
import { formatCurrency, formatReportDate } from "../formatters";
import { optionalInteger, optionalNumber } from "../safe-values";

export async function generateReportXlsx(report: ReportData): Promise<Uint8Array> {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Yakout Hospitality";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Résumé");
    summarySheet.columns = [
      { header: "Indicateur", key: "indicator", width: 30 },
      { header: "Valeur", key: "value", width: 20 },
    ];

    summarySheet.addRow(["Rapport", report.metadata.title]);
    summarySheet.addRow(["Période", report.metadata.periodStart && report.metadata.periodEnd
      ? `${formatReportDate(report.metadata.periodStart)} → ${formatReportDate(report.metadata.periodEnd)}` : "N/A"]);
    summarySheet.addRow(["Généré le", formatReportDate(report.metadata.generatedAt)]);
    summarySheet.addRow(["Statut", report.metadata.status]);
    summarySheet.addRow([]);

    for (const kpi of report.kpis) {
      summarySheet.addRow([kpi.label, kpi.value]);
    }

    summarySheet.addRow([]);
    for (const [key, value] of Object.entries(report.totals ?? {})) {
      const label = { revenue: "CA total", expenses: "Dépenses", margin: "Marge", total: "Total", amount: "Montant" }[key] ?? key;
      summarySheet.addRow([`Total - ${label}`, formatCurrency(Number(value))]);
    }

    const dataSheet = workbook.addWorksheet("Données");
    const allColumns = new Set<string>();
    const tableRows: Record<string, unknown>[] = [];

    for (const table of report.tables) {
      for (const col of table.columns) allColumns.add(col.key);
      tableRows.push(...table.rows.map((row) => {
        const normalized: Record<string, unknown> = { _table: table.title };
        for (const col of table.columns) {
          const val = row[col.key];
          if (col.format === "currency") normalized[col.label] = optionalNumber(val);
          else if (col.format === "percent") normalized[col.label] = optionalNumber(val);
          else if (col.format === "integer") normalized[col.label] = optionalInteger(val);
          else normalized[col.label] = val ?? "-";
        }
        return normalized;
      }));
    }

    if (tableRows.length > 0) {
      const dataCols = report.tables.length > 1
        ? [{ header: "Table", key: "_table", width: 25 }, ...report.tables[0].columns.map((c) => ({ header: c.label, key: c.label, width: 20 }))]
        : report.tables[0].columns.map((c) => ({ header: c.label, key: c.label, width: 20 }));

      dataSheet.columns = dataCols;
      for (const row of tableRows) dataSheet.addRow(row);
      dataSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: tableRows.length + 1, column: dataCols.length } };
      dataSheet.views = [{ state: "frozen", ySplit: 1 }];

      for (let i = 0; i < dataCols.length; i++) {
        const col = dataCols[i];
        if (!("_table" in col)) {
          const formatMap: Record<string, string | undefined> = {};
          for (const table of report.tables) {
            for (const c of table.columns) if (c.format) formatMap[c.label] = c.format;
          }
          if (formatMap[col.header] === "currency") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dataSheet.getColumn(i + 1) as any).numFmt = '#,##0.00 "MAD"';
          } else if (formatMap[col.header] === "percent") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dataSheet.getColumn(i + 1) as any).numFmt = "0.0%";
          }
        }
      }
    }

    const metaSheet = workbook.addWorksheet("Métadonnées");
    metaSheet.columns = [{ header: "Propriété", key: "prop", width: 25 }, { header: "Valeur", key: "val", width: 40 }];
    metaSheet.addRow(["Rapport", report.metadata.title]);
    metaSheet.addRow(["Généré le", report.metadata.generatedAt]);
    metaSheet.addRow(["Période début", report.metadata.periodStart ?? "N/A"]);
    metaSheet.addRow(["Période fin", report.metadata.periodEnd ?? "N/A"]);
    metaSheet.addRow(["Statut", report.metadata.status]);
    metaSheet.addRow(["Version", "1.0"]);
    metaSheet.addRow(["Lignes de données", tableRows.length]);
    for (const [key, count] of Object.entries(report.sourceCounts)) {
      metaSheet.addRow([`Source - ${key}`, count]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer as ArrayBuffer);
  } catch (err) {
    throw new Error(`Export XLSX impossible : ${err instanceof Error ? err.message : "bibliothèque ExcelJS manquante"}`);
  }
}

export async function generateReportXlsxBlob(report: ReportData): Promise<Blob> {
  const uint8 = await generateReportXlsx(report);
  return new Blob([Buffer.from(uint8)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
