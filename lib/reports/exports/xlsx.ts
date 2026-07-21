import "server-only";
import type { ReportData, ReportTableColumn } from "../data/types";
import { formatCurrency, formatReportDate } from "../formatters";
import { optionalInteger, optionalNumber } from "../safe-values";

function worksheetName(title: string, index: number): string {
  const clean = title.replace(/[\\/?*[\]:]/g, " ").trim() || `Données ${index + 1}`;
  return `${index + 1} - ${clean}`.slice(0, 31);
}

function excelValue(value: unknown, column: ReportTableColumn): string | number | Date | null {
  if (value == null || value === "") return null;
  if (column.format === "currency" || column.format === "percent" || column.format === "decimal") return optionalNumber(value);
  if (column.format === "integer") return optionalInteger(value);
  if (column.format === "date") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date;
  }
  return typeof value === "number" ? value : String(value);
}

export async function generateReportXlsx(report: ReportData): Promise<Uint8Array> {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Yakout Hospitality";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Résumé");
    summarySheet.columns = [
      { header: "Indicateur", key: "indicator", width: 34 },
      { header: "Valeur", key: "value", width: 42 },
    ];
    summarySheet.addRow(["Rapport", report.metadata.title]);
    summarySheet.addRow(["Disponibilité", report.metadata.availability ?? report.metadata.status]);
    summarySheet.addRow(["Période", report.metadata.periodStart && report.metadata.periodEnd
      ? `${formatReportDate(report.metadata.periodStart)} → ${formatReportDate(report.metadata.periodEnd)}` : "Non applicable"]);
    summarySheet.addRow(["Généré le", formatReportDate(report.metadata.generatedAt)]);
    summarySheet.addRow([]);
    for (const kpi of report.kpis) summarySheet.addRow([kpi.label, kpi.value]);
    if (Object.keys(report.totals ?? {}).length > 0) summarySheet.addRow([]);
    for (const [key, value] of Object.entries(report.totals ?? {})) {
      const label = { revenue: "CA total", expenses: "Dépenses", margin: "Marge", total: "Total", amount: "Montant" }[key] ?? key;
      summarySheet.addRow([`Total - ${label}`, formatCurrency(Number(value))]);
    }
    if (report.warnings.length > 0) {
      summarySheet.addRow([]);
      report.warnings.forEach((warning, index) => summarySheet.addRow([`Réserve ${index + 1}`, warning]));
    }
    summarySheet.views = [{ state: "frozen", ySplit: 1 }];
    summarySheet.getRow(1).font = { bold: true };

    let totalRows = 0;
    report.tables.forEach((table, tableIndex) => {
      const sheet = workbook.addWorksheet(worksheetName(table.title, tableIndex));
      sheet.columns = table.columns.map((column) => ({ header: column.label, key: column.key, width: 20 }));
      table.rows.forEach((row) => {
        const normalized: Record<string, string | number | Date | null> = {};
        table.columns.forEach((column) => { normalized[column.key] = excelValue(row[column.key], column); });
        sheet.addRow(normalized);
      });
      totalRows += table.rows.length;
      if (table.totals && Object.keys(table.totals).length > 0) {
        const totals: Record<string, string | number | null> = {};
        table.columns.forEach((column, columnIndex) => {
          const value = table.totals?.[column.key];
          totals[column.key] = value == null && columnIndex === 0 ? "Total" : value ?? null;
        });
        const row = sheet.addRow(totals);
        row.font = { bold: true };
      }
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      if (table.rows.length > 0) {
        sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(2, table.rows.length + 1), column: table.columns.length } };
      }
      table.columns.forEach((column, index) => {
        const excelColumn = sheet.getColumn(index + 1);
        if (column.format === "currency") excelColumn.numFmt = '#,##0.00 "MAD"';
        if (column.format === "percent") excelColumn.numFmt = "0.00";
        if (column.format === "integer") excelColumn.numFmt = "0";
        if (column.format === "date") excelColumn.numFmt = "dd/mm/yyyy";
      });
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1B1A" } };
    });

    const metaSheet = workbook.addWorksheet("Métadonnées");
    metaSheet.columns = [{ header: "Propriété", key: "prop", width: 30 }, { header: "Valeur", key: "val", width: 54 }];
    metaSheet.addRow(["Rapport", report.metadata.title]);
    metaSheet.addRow(["Généré le", report.metadata.generatedAt]);
    metaSheet.addRow(["Période début", report.metadata.periodStart ?? "Non applicable"]);
    metaSheet.addRow(["Période fin", report.metadata.periodEnd ?? "Non applicable"]);
    metaSheet.addRow(["Statut", report.metadata.status]);
    metaSheet.addRow(["Disponibilité", report.metadata.availability ?? "Indisponible"]);
    metaSheet.addRow(["Version de formule", report.metadata.formulaVersion ?? "Non renseignée"]);
    metaSheet.addRow(["Version des sources", report.metadata.dataSourceVersion ?? "Non renseignée"]);
    metaSheet.addRow(["Lignes de données", totalRows]);
    for (const [key, value] of Object.entries(report.metadata.filtersApplied ?? {})) metaSheet.addRow([`Filtre - ${key}`, value ?? ""]);
    for (const [key, count] of Object.entries(report.sourceCounts)) metaSheet.addRow([`Source - ${key}`, count]);
    metaSheet.views = [{ state: "frozen", ySplit: 1 }];
    metaSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer as ArrayBuffer);
  } catch (error) {
    throw new Error(`Export XLSX impossible : ${error instanceof Error ? error.message : "bibliothèque ExcelJS manquante"}`);
  }
}

export async function generateReportXlsxBlob(report: ReportData): Promise<Blob> {
  const uint8 = await generateReportXlsx(report);
  return new Blob([Buffer.from(uint8)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
