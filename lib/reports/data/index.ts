import { getReportDefinition } from "@/lib/reports/definitions";
import type { ReportFilters, ReportData } from "./types";
import { getExecutiveDashboard } from "./executive";
import { getExecutivePerformance } from "./executive";
import { getSalesLeadFunnel, getSalesConversion } from "./sales";
import { getAccommodationPerformance, getAccommodationReservations, getAccommodationArrivalsDepartures } from "./accommodation";
import { getFinanceRevenueJournal, getFinanceExpenseJournal, getFinanceAccountsReceivable, getFinanceResultByApartment, getFinanceReconciliation } from "./finance";
import { getOwnerMonthlyStatement, getOwnersConsolidated, getOwnerPayouts } from "./owners";
import { getOperationsMaintenance } from "./operations";
import { getTransportPerformance, getTransportTrips } from "./transport";
import { getFleetVehicleUsage, getFleetPartnerPerformance } from "./fleet";
import { getPackagesSales } from "./packages";
import { getClientsPortfolio } from "./clients";
import { getComplianceContracts } from "./compliance";
import { getDataQualityOverview } from "./data-quality";
import { applyCertificationGate } from "@/lib/reports/certification";

const REPORT_HANDLERS: Record<string, (filters: ReportFilters) => Promise<ReportData>> = {
  "executive-dashboard": getExecutiveDashboard,
  "executive-performance": getExecutivePerformance,
  "sales-lead-funnel": getSalesLeadFunnel,
  "sales-conversion": getSalesConversion,
  "accommodation-performance": getAccommodationPerformance,
  "accommodation-reservations": getAccommodationReservations,
  "accommodation-arrivals-departures": getAccommodationArrivalsDepartures,
  "finance-revenue-journal": getFinanceRevenueJournal,
  "finance-expense-journal": getFinanceExpenseJournal,
  "finance-accounts-receivable": getFinanceAccountsReceivable,
  "finance-result-by-apartment": getFinanceResultByApartment,
  "finance-reconciliation": getFinanceReconciliation,
  "owners-monthly-statement": getOwnerMonthlyStatement,
  "owners-consolidated": getOwnersConsolidated,
  "owners-payouts": getOwnerPayouts,
  "operations-maintenance": getOperationsMaintenance,
  "transport-performance": getTransportPerformance,
  "transport-trips": getTransportTrips,
  "fleet-vehicle-usage": getFleetVehicleUsage,
  "fleet-partner-performance": getFleetPartnerPerformance,
  "packages-sales": getPackagesSales,
  "clients-portfolio": getClientsPortfolio,
  "compliance-contracts": getComplianceContracts,
  "data-quality-overview": getDataQualityOverview,
};

export async function getReportData(reportId: string, filters: ReportFilters): Promise<ReportData> {
  const def = getReportDefinition(reportId);
  if (!def) {
    return applyCertificationGate({
      metadata: { reportId, title: "Rapport inconnu", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: ["Le rapport demandé n'existe pas."],
      sourceCounts: {},
    });
  }

  const handler = REPORT_HANDLERS[reportId];
  if (!handler) {
    return applyCertificationGate({
      metadata: { reportId, title: def.title, generatedAt: new Date().toISOString(), status: "error" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: ["Ce rapport n'est pas encore implémenté."],
      sourceCounts: {},
    });
  }

  try {
    return applyCertificationGate(await handler(filters));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return applyCertificationGate({
      metadata: { reportId, title: def.title, generatedAt: new Date().toISOString(), status: "error" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: [`Le rapport n'a pas pu être généré : ${msg}`],
      sourceCounts: {},
    });
  }
}
