import type { ReportData, ReportFilters } from "@/lib/reports/data/types";
import { getExecutiveDashboard, getExecutivePerformance } from "@/lib/reports/data/executive";
import { getSalesLeadFunnel, getSalesConversion } from "@/lib/reports/data/sales";
import { getAccommodationPerformance, getAccommodationReservations, getAccommodationArrivalsDepartures } from "@/lib/reports/data/accommodation";
import { getFinanceRevenueJournal, getFinanceExpenseJournal, getFinanceAccountsReceivable, getFinanceResultByApartment, getFinanceReconciliation } from "@/lib/reports/data/finance";
import { getOwnerMonthlyStatement, getOwnersConsolidated, getOwnerPayouts } from "@/lib/reports/data/owners";
import { getOperationsMaintenance } from "@/lib/reports/data/operations";
import { getTransportPerformance, getTransportTrips } from "@/lib/reports/data/transport";
import { getFleetVehicleUsage, getFleetPartnerPerformance } from "@/lib/reports/data/fleet";
import { getPackagesSales } from "@/lib/reports/data/packages";
import { getClientsPortfolio } from "@/lib/reports/data/clients";
import { getComplianceContracts } from "@/lib/reports/data/compliance";
import { getDataQualityOverview } from "@/lib/reports/data/data-quality";

export type ReportLoader = (filters: ReportFilters) => Promise<ReportData>;

export const REPORT_LOADERS = {
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
} satisfies Record<string, ReportLoader>;

export function getReportLoader(reportId: string): ReportLoader | undefined {
  return REPORT_LOADERS[reportId as keyof typeof REPORT_LOADERS];
}
