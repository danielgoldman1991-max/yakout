import { NextRequest, NextResponse } from "next/server";
import { getReportDefinition } from "@/lib/reports/definitions";
import { getReportData } from "@/lib/reports/data";
import { generateReportPdf } from "@/lib/reports/exports/pdf";
import { canUseReportOutputs } from "@/lib/reports/certification";
import { getUserPermissions } from "@/lib/reports/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  const def = getReportDefinition(reportId);
  if (!def) {
    return NextResponse.json({ error: "Rapport introuvable." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";

  const permissions = await getUserPermissions();
  if (!permissions.includes(def.permission) || !permissions.includes("reports.export")) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const filters = body.filters ?? {};
    const data = await getReportData(reportId, filters);
    if (!canUseReportOutputs(data)) return NextResponse.json({ error: "Ce rapport est indisponible et ne peut pas être exporté." }, { status: 409 });

    if (format === "pdf") {
      if (!def.supportedFormats.includes("pdf")) {
        return NextResponse.json({ error: "Ce rapport ne supporte pas l'export PDF." }, { status: 400 });
      }
      try {
        const pdfBuffer = await generateReportPdf(data);

        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${reportId}-${filters.period_start || "all"}-${filters.period_end || "all"}.pdf"`,
          },
        });
      } catch (err) {
        return NextResponse.json({
          error: `Erreur lors de la génération du PDF : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
        }, { status: 500 });
      }
    }

    if (format === "xlsx") {
      if (!def.supportedFormats.includes("xlsx")) {
        return NextResponse.json({ error: "Ce rapport ne supporte pas l'export XLSX." }, { status: 400 });
      }
      try {
        const { generateReportXlsx } = await import("@/lib/reports/exports/xlsx");
        const buffer = await generateReportXlsx(data);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${reportId}-${filters.period_start || "all"}-${filters.period_end || "all"}.xlsx"`,
          },
        });
      } catch (err) {
        return NextResponse.json({ error: `Erreur lors de l'export XLSX : ${err instanceof Error ? err.message : "Erreur inconnue"}` }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Format non supporté. Utilisez ?format=pdf ou ?format=xlsx." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      error: `Erreur lors de l'export : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
    }, { status: 500 });
  }
}
