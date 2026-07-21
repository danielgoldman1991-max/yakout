import type { ReportAvailability, ReportData } from "@/lib/reports/data/types";

export function deriveReportAvailability(report: ReportData): ReportAvailability {
  if (report.metadata.status === "error") return "unavailable";
  if (report.metadata.status === "suspended") return "not_configured";
  if (report.metadata.status === "partial" || report.warnings.length > 0 || (report.anomalies?.length ?? 0) > 0) return "available_with_warnings";
  return "available";
}

export function canUseReportOutputs(report: ReportData): boolean {
  const availability = report.metadata.availability ?? deriveReportAvailability(report);
  return availability === "available" || availability === "available_with_warnings";
}

export function applyReportAvailability(report: ReportData, filtersApplied = report.metadata.filtersApplied ?? {}): ReportData {
  const availability = deriveReportAvailability(report);
  return {
    ...report,
    metadata: {
      ...report.metadata,
      availability,
      filtersApplied,
    },
  };
}
