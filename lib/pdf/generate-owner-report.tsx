import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OwnerReportPDF } from "@/lib/pdf/owner-report-pdf";
import { getOwnerDashboard, getOwnerFinancialSummary, getOwnerPropertyPerformance, getOwnerReportById } from "@/lib/data/owner-reporting";
import { logger } from "@/lib/utils/logger";
import type { OwnerDashboardKPIs, OwnerFinancialSummary, OwnerPropertyPerformance } from "@/types/business";

const BUCKET = "yakout-private";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateStoragePath(ownerId: string, reportId: string, label: string): string {
  const baseName = slugify(label.slice(0, 60)) || "rapport";
  const timestamp = Date.now();
  return `documents/owners/${ownerId}/reports/${timestamp}-${reportId.slice(0, 8)}-${baseName}.pdf`;
}

export async function generateOwnerReportPdf(reportId: string): Promise<{ ok: boolean; pdfPath?: string; error?: string }> {
  try {
    const report = await getOwnerReportById(reportId);
    if (!report) return { ok: false, error: "Rapport introuvable." };

    const admin = createSupabaseAdminClient();

    const { data: owner } = await admin.from("owners").select("full_name").eq("id", report.owner_id).single();
    const ownerName = (owner as { full_name?: string } | null)?.full_name ?? "Propriétaire";

    const periodStart = report.period_start;
    const periodEnd = report.period_end;
    const apartmentId = report.apartment_id;

    let kpis: OwnerDashboardKPIs | undefined;
    let financialSummary: OwnerFinancialSummary | undefined;
    let performance: OwnerPropertyPerformance[] | undefined;

    try {
      kpis = await getOwnerDashboard(report.owner_id, periodStart, periodEnd, apartmentId);
    } catch { logger.warn("generatePdf: getOwnerDashboard failed, skipping KPIs"); }

    try {
      financialSummary = await getOwnerFinancialSummary(report.owner_id, periodStart, periodEnd, apartmentId);
    } catch { logger.warn("generatePdf: getOwnerFinancialSummary failed, skipping"); }

    try {
      performance = await getOwnerPropertyPerformance(report.owner_id, periodStart, periodEnd, apartmentId);
    } catch { logger.warn("generatePdf: getOwnerPropertyPerformance failed, skipping"); }

    const pdfBuffer = await renderToBuffer(
      <OwnerReportPDF
        report={report}
        ownerName={ownerName}
        kpis={kpis}
        financialSummary={financialSummary}
        propertyPerformance={performance}
      />
    );

    const filePath = generateStoragePath(report.owner_id, report.id, report.label);

    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.id === BUCKET)) {
      const { error: bucketError } = await admin.storage.createBucket(BUCKET, { public: false });
      if (bucketError) {
        logger.error("generatePdf: create bucket failed", bucketError);
        return { ok: false, error: "Erreur création bucket." };
      }
    }

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(filePath, pdfBuffer, {
      cacheControl: "31536000",
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      logger.error("generatePdf: upload failed", uploadError);
      return { ok: false, error: uploadError.message };
    }

    await admin.from("owner_reports").update({
      pdf_storage_path: filePath,
      generated_at: new Date().toISOString(),
    }).eq("id", reportId);

    return { ok: true, pdfPath: filePath };
  } catch (err) {
    logger.error("generateOwnerReportPdf failed", err);
    return { ok: false, error: "Erreur génération PDF." };
  }
}
