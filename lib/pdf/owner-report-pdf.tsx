import "server-only";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { OwnerReport, OwnerDashboardKPIs, OwnerFinancialSummary, OwnerPropertyPerformance } from "@/types/business";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#c9a84c",
    paddingBottom: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    gap: 2,
  },
  brand: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a2c17",
    letterSpacing: 1,
  },
  reportType: {
    fontSize: 13,
    color: "#c9a84c",
    fontWeight: "bold",
  },
  period: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  meta: {
    fontSize: 8,
    color: "#999",
    textAlign: "right",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4a2c17",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "22%",
    padding: 8,
    backgroundColor: "#f8f6f0",
    borderRadius: 2,
  },
  kpiLabel: {
    fontSize: 7,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4a2c17",
  },
  kpiSub: {
    fontSize: 7,
    color: "#666",
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#4a2c17",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4a2c17",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4a2c17",
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4a2c17",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 8,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#999",
  },
  statusBadge: {
    fontSize: 7,
    color: "#c9a84c",
    fontWeight: "bold",
  },
  disclaimer: {
    fontSize: 7,
    color: "#999",
    fontStyle: "italic",
    marginTop: 16,
    padding: 8,
    backgroundColor: "#f8f6f0",
  },
});

function formatCurrency(amount: number | undefined | null, currency?: string): string {
  const val = amount ?? 0;
  const symbol = currency === "EUR" ? "€" : "MAD";
  return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function getReportTypeLabel(type: OwnerReport["report_type"]): string {
  const labels: Record<OwnerReport["report_type"], string> = {
    monthly_owner_statement: "Relevé Mensuel Propriétaire",
    property_performance: "Performance du Bien",
    reservation_activity: "Activité des Réservations",
    financial_ledger: "Recettes et Dépenses",
    maintenance_operations: "Exploitation et Maintenance",
    owner_payout_statement: "Relevé de Reversement",
    forward_forecast: "Prévision 30/60/90 Jours",
    annual_owner_summary: "Rapport Annuel",
  };
  return labels[type] ?? type;
}

function getAccountingBasisLabel(basis?: string): string {
  return basis === "activity" ? "Base activité" : "Base trésorerie";
}

type OwnerReportPDFProps = {
  report: OwnerReport;
  ownerName: string;
  kpis?: OwnerDashboardKPIs;
  financialSummary?: OwnerFinancialSummary;
  propertyPerformance?: OwnerPropertyPerformance[];
};

export function OwnerReportPDF({ report, ownerName, kpis, financialSummary, propertyPerformance }: OwnerReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header report={report} ownerName={ownerName} />
        {kpis && <KPISection kpis={kpis} currency={report.currency} />}
        {financialSummary && <FinancialSummarySection summary={financialSummary} currency={report.currency} />}
        {propertyPerformance && propertyPerformance.length > 0 && (
          <PropertyPerformanceSection properties={propertyPerformance} currency={report.currency} />
        )}
        <Disclaimer />
        <Footer report={report} />
      </Page>
    </Document>
  );
}

function Header({ report, ownerName }: { report: OwnerReport; ownerName: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.brand}>YAKOUT</Text>
        <Text style={styles.reportType}>{getReportTypeLabel(report.report_type)}</Text>
        <Text style={styles.period}>
          {report.period_start} → {report.period_end}
        </Text>
        <Text style={styles.period}>{ownerName}</Text>
      </View>
      <View style={styles.meta}>
        <Text>Version {report.version}</Text>
        <Text>{getAccountingBasisLabel(report.accounting_basis)}</Text>
        <Text>Généré le {new Date(report.created_at).toLocaleDateString("fr-FR")}</Text>
      </View>
    </View>
  );
}

function KPISection({ kpis, currency }: { kpis: OwnerDashboardKPIs; currency?: string }) {
  const occupiedStr = String(kpis.occupiedNights) + " nuits occupées";
  const nightsStr = String(kpis.occupiedNights) + "/" + String(kpis.availableNights) + " nuits";
  const items = [
    { label: "Revenu Hébergement", value: formatCurrency(kpis.accommodationRevenue, currency), sub: occupiedStr },
    { label: "Taux d'Occupation", value: formatPercent(kpis.occupancyRate), sub: nightsStr },
    { label: "Commissions Yakout", value: formatCurrency(kpis.yakoutCommission, currency), sub: "" },
    { label: "Net Propriétaire", value: formatCurrency(kpis.netOwner, currency), sub: "" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Indicateurs Clés</Text>
      <View style={styles.kpiGrid}>
        {items.map((item, i) => (
          <View key={i} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>
            {item.sub ? <Text style={styles.kpiSub}>{item.sub}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function FinancialSummarySection({ summary, currency }: { summary: OwnerFinancialSummary; currency?: string }) {
  const rows = [
    { label: "Réservé", value: summary.reservedAmount },
    { label: "Facturé", value: summary.invoicedAmount },
    { label: "Encaissé", value: summary.collectedAmount },
    { label: "Reste à encaisser", value: summary.remainingAmount },
    { label: "Remboursé", value: summary.refundedAmount },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Synthèse Financière</Text>
      {rows.map((row, i) => (
        <View key={i} style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{row.label}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(row.value, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function PropertyPerformanceSection({ properties, currency }: { properties: OwnerPropertyPerformance[]; currency?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance par Bien</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Bien</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Occupation</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>ADR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>RevPAR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>Revenu</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Réservations</Text>
        </View>
        {properties.map((p, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{p.apartmentName}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatPercent(p.occupancyRate)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(p.adr, currency)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(p.revpar, currency)}</Text>
            <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>{formatCurrency(p.revenue, currency)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{p.reservationCount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Disclaimer() {
  return (
    <Text style={styles.disclaimer}>
      {"Ce rapport est généré automatiquement par le système Yakout. Les données présentées reflètent l'état des réservations et des paiements à la date de génération. Pour toute question, veuillez contacter votre gestionnaire Yakout."}
    </Text>
  );
}

function Footer({ report }: { report: OwnerReport }) {
  const generatedAt = report.generated_at ? new Date(report.generated_at) : new Date();
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Yakout Hospitality — Rapport généré le {generatedAt.toLocaleDateString("fr-FR")}</Text>
      <Text style={styles.footerText}>Rapport {report.status === "finalized" ? "finalisé" : "provisoire"} — v{report.version}</Text>
    </View>
  );
}
