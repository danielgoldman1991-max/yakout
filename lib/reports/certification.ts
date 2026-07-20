import type { ReportData } from "@/lib/reports/data/types";

export type ReportCertificationStatus = "draft" | "under_review" | "certified" | "suspended";

export const REPORTS_UNCERTIFIED_MESSAGE =
  "Les rapports sont en cours de vérification. Ne pas utiliser ces données pour une décision financière ou opérationnelle.";

export const REPORTS_UNAVAILABLE_MESSAGE = "Données indisponibles ou non certifiées.";

export function isReportingCertified(): boolean {
  return process.env.REPORTS_CERTIFIED === "true";
}

export function isReportTestingModeEnabled(): boolean {
  return process.env.REPORTS_ALLOW_UNCERTIFIED_TESTING === "true";
}

export function getReportCertificationStatus(): ReportCertificationStatus {
  if (isReportingCertified()) return "certified";
  if (isReportTestingModeEnabled()) return "under_review";
  return "suspended";
}

export function canUseReportOutputs(status = getReportCertificationStatus()): boolean {
  return status === "certified";
}

export function canExportReports(): boolean {
  return canUseReportOutputs();
}

export function applyCertificationGate(report: ReportData): ReportData {
  const certificationStatus = getReportCertificationStatus();

  if (certificationStatus === "certified") {
    return {
      ...report,
      metadata: {
        ...report.metadata,
        certificationStatus,
        testingMode: false,
      },
      warnings: report.warnings,
    };
  }

  return {
    ...report,
    metadata: {
      ...report.metadata,
      status: "suspended",
      certificationStatus,
      formulaVersion: report.metadata.formulaVersion ?? "non-certifiee",
      dataSourceVersion: report.metadata.dataSourceVersion ?? "non-certifiee",
    },
    kpis: [],
    charts: [],
    tables: [],
    totals: undefined,
    warnings: [REPORTS_UNCERTIFIED_MESSAGE, REPORTS_UNAVAILABLE_MESSAGE, ...report.warnings],
    anomalies: [
      {
        severity: "critical",
        code: "REPORTS_CERTIFICATION_LOCKDOWN",
        message: "Module de reporting suspendu tant que les sources, formules, statuts et exports ne sont pas certifiés.",
      },
      ...(report.anomalies ?? []),
    ],
  };
}
