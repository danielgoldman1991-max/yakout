import "server-only";

import { REPORT_DEFINITIONS, type ReportDefinition } from "@/lib/reports/definitions";
import { getReportData } from "@/lib/reports/data";
import type { ReportAvailability, ReportFilters, ReportingSystemStatus } from "@/lib/reports/data/types";
import { getUserPermissions } from "@/lib/reports/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReportHealthItem = {
  reportId: string;
  availability: ReportAvailability;
  warningCount: number;
  anomalyCount: number;
  sourceCount: number;
  checkedAt: string;
};

export type ReportingHealth = {
  systemStatus: ReportingSystemStatus;
  reports: ReportHealthItem[];
  availableReports: number;
  warningReports: number;
  unavailableReports: number;
  notConfiguredReports: number;
  criticalAnomalies: number;
  majorAnomalies: number;
  checkedAt: string;
  permittedReportIds: string[];
};

async function filtersForHealth(definition: ReportDefinition, base: ReportFilters): Promise<ReportFilters | null> {
  if (!definition.filters.some((filter) => filter.required && filter.type === "owner")) return base;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("owners").select("id").limit(1).maybeSingle();
  if (error || !data?.id) return null;
  return { ...base, owner_id: data.id };
}

export async function getReportingHealth(): Promise<ReportingHealth> {
  const checkedAt = new Date().toISOString();
  const end = checkedAt.slice(0, 10);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 365);
  const base: ReportFilters = { period_start: startDate.toISOString().slice(0, 10), period_end: end };
  const permissions = await getUserPermissions();
  const permittedDefinitions = REPORT_DEFINITIONS.filter((definition) => permissions.includes(definition.permission));

  const reports = await Promise.all(permittedDefinitions.map(async (definition): Promise<ReportHealthItem> => {
    const filters = await filtersForHealth(definition, base);
    if (!filters) return { reportId: definition.id, availability: "not_configured", warningCount: 1, anomalyCount: 0, sourceCount: 0, checkedAt };
    const report = await getReportData(definition.id, filters);
    return {
      reportId: definition.id,
      availability: report.metadata.availability ?? "unavailable",
      warningCount: report.warnings.length,
      anomalyCount: report.anomalies?.length ?? 0,
      sourceCount: Object.values(report.sourceCounts).reduce((sum, count) => sum + count, 0),
      checkedAt,
    };
  }));

  const availableReports = reports.filter((report) => report.availability === "available").length;
  const warningReports = reports.filter((report) => report.availability === "available_with_warnings").length;
  const unavailableReports = reports.filter((report) => report.availability === "unavailable").length;
  const notConfiguredReports = reports.filter((report) => report.availability === "not_configured").length;
  const criticalAnomalies = reports.filter((report) => report.availability === "unavailable").reduce((sum, report) => sum + Math.max(1, report.anomalyCount), 0);
  const majorAnomalies = reports.filter((report) => report.availability === "available_with_warnings").reduce((sum, report) => sum + Math.max(1, report.warningCount + report.anomalyCount), 0);
  const essentialIds = new Set(["executive-dashboard", "accommodation-reservations", "finance-revenue-journal", "finance-reconciliation", "data-quality-overview"]);
  const essential = reports.filter((report) => essentialIds.has(report.reportId));
  const systemStatus: ReportingSystemStatus = essential.every((report) => report.availability === "unavailable")
    ? "unavailable"
    : unavailableReports > 0 || notConfiguredReports > 0 || warningReports > 0
      ? "degraded"
      : "operational";

  return { systemStatus, reports, availableReports, warningReports, unavailableReports, notConfiguredReports, criticalAnomalies, majorAnomalies, checkedAt, permittedReportIds: permittedDefinitions.map((definition) => definition.id) };
}
