import "server-only";
import React from "react";
import { renderToBuffer, Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import type { ReportData, ReportTableColumn } from "../data/types";
import { formatCurrency, formatPercent, formatReportDate } from "../formatters";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1c1b1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottom: "2 solid #c8a44e",
    paddingBottom: 12,
    marginBottom: 16,
  },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: "#c8a44e",
    borderRadius: 3,
    textAlign: "center",
    lineHeight: 28,
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  title: { fontSize: 16, fontWeight: "bold" as const },
  meta: { fontSize: 8, color: "#8c8a86", marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  kpiBox: {
    minWidth: 120,
    border: "1 solid #e6e4e0",
    borderRadius: 3,
    padding: 6,
    flex: 1,
  },
  kpiLabel: { fontSize: 7, color: "#8c8a86", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  kpiValue: { fontSize: 14, fontWeight: "bold" as const, marginTop: 2 },
  kpiDesc: { fontSize: 7, color: "#8c8a86", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: "bold" as const, marginBottom: 6, marginTop: 12 },
  table: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1c1b1a",
    color: "white",
    fontSize: 7,
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  tableHeaderCell: { padding: 4, flex: 1 },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #e6e4e0" },
  tableCell: { padding: 3, flex: 1, fontSize: 8 },
  tableCellRight: { padding: 3, flex: 1, fontSize: 8, textAlign: "right" as const },
  totalRow: { flexDirection: "row", borderTop: "2 solid #1c1b1a", fontWeight: "bold" as const, backgroundColor: "#f0ede8" },
  warning: {
    backgroundColor: "#fef3c7",
    border: "1 solid #f59e0b",
    padding: 6,
    borderRadius: 3,
    fontSize: 8,
    marginBottom: 8,
    color: "#92400e",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#8c8a86",
    textAlign: "center" as const,
    borderTop: "1 solid #e6e4e0",
    paddingTop: 8,
  },
});

function formatCellValue(val: string | number | null | undefined, col: ReportTableColumn): string {
  if (val == null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (col.format === "currency") return formatCurrency(num);
  if (col.format === "percent") return formatPercent(num);
  if (col.format === "integer") return new Intl.NumberFormat("fr-FR").format(Math.round(num));
  return String(val);
}

function ReportDocument({ report }: { report: ReportData }) {
  const genDate = formatReportDate(report.metadata.generatedAt);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <Text style={styles.logo}>Y</Text>
          <View>
            <Text style={styles.title}>{report.metadata.title}</Text>
            <Text style={styles.meta}>
              {report.metadata.periodStart && report.metadata.periodEnd
                ? `${report.metadata.periodStart} → ${report.metadata.periodEnd} · `
                : ""}
              Généré le {genDate}
            </Text>
          </View>
        </View>

        {report.warnings.length > 0 && (
          <View style={styles.warning} wrap={false}>
            {report.warnings.map((w, i) => (
              <Text key={i}>⚠ {w}</Text>
            ))}
          </View>
        )}

        <View style={styles.kpiGrid} wrap={false}>
          {report.kpis.slice(0, 8).map((kpi, i) => (
            <View key={i} style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              {kpi.description && <Text style={styles.kpiDesc}>{kpi.description}</Text>}
            </View>
          ))}
        </View>

        {report.tables.map((table, ti) => (
          <View key={ti} style={styles.table} wrap={false}>
            <Text style={styles.sectionTitle}>{table.title}</Text>
            <View style={styles.tableHeader}>
              {table.columns.map((col, ci) => (
                <Text key={ci} style={[
                  styles.tableHeaderCell,
                  col.align === "right" ? { textAlign: "right" as const } : {},
                ]}>
                  {col.label}
                </Text>
              ))}
            </View>
            {table.rows.slice(0, 50).map((row, ri) => (
              <View key={ri} style={styles.tableRow}>
                {table.columns.map((col, ci) => (
                  <Text key={ci} style={col.align === "right" ? styles.tableCellRight : styles.tableCell}>
                    {formatCellValue(row[col.key], col)}
                  </Text>
                ))}
              </View>
            ))}
            {table.totals && Object.keys(table.totals).length > 0 && (
              <View style={styles.totalRow}>
                {table.columns.map((col, ci) => {
                  const val = table.totals![col.key];
                  if (val == null) return <Text key={ci} style={styles.tableCell} />;
                  return (
                    <Text key={ci} style={col.align === "right" ? styles.tableCellRight : styles.tableCell}>
                      {formatCellValue(val, col)}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Yakout Hospitality · ${report.metadata.title} · Page ${pageNumber}/${totalPages} · ${genDate}`
        )} fixed />
      </Page>
    </Document>
  );
}

export async function generateReportPdf(report: ReportData): Promise<Buffer> {
  return await renderToBuffer(<ReportDocument report={report} />);
}
