import { getReportDefinition } from "@/lib/reports/definitions";
import type { ReportFilters, ReportData } from "./types";
import { applyReportAvailability } from "@/lib/reports/certification";
import { logger } from "@/lib/utils/logger";
import { getReportLoader } from "@/lib/reports/registry";

export async function getReportData(reportId: string, filters: ReportFilters): Promise<ReportData> {
  const def = getReportDefinition(reportId);
  if (!def) {
    return applyReportAvailability({
      metadata: { reportId, title: "Rapport inconnu", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: ["Le rapport demandé n'existe pas."],
      sourceCounts: {},
    }, filters);
  }

  const handler = getReportLoader(reportId);
  if (!handler) {
    return applyReportAvailability({
      metadata: { reportId, title: def.title, generatedAt: new Date().toISOString(), status: "suspended" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: ["Ce rapport n'est pas encore implémenté."],
      sourceCounts: {},
    }, filters);
  }

  try {
    return applyReportAvailability(await handler(filters), filters);
  } catch (err) {
    logger.error("report loader failed", { reportId, error: err instanceof Error ? err.message : String(err) });
    return applyReportAvailability({
      metadata: { reportId, title: def.title, generatedAt: new Date().toISOString(), status: "error" },
      kpis: [],
      tables: [],
      totals: undefined,
      warnings: ["Ce rapport est temporairement indisponible. Réessayez ultérieurement."],
      sourceCounts: {},
    }, filters);
  }
}
