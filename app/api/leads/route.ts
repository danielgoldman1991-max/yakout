import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validations/schemas";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

const userError = "La demande n'a pas pu etre envoyee.";

async function getPublicLeadCompanyId(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  if (process.env.YAKOUT_COMPANY_ID) return process.env.YAKOUT_COMPANY_ID;

  const { data, error } = await supabase.from("companies").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) {
    logger.error("[API/leads] Impossible de charger l'entreprise par defaut", error);
    return null;
  }

  return data?.id ?? null;
}

function errorResponse(status: number, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: userError,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = leadSchema.safeParse(json);

    if (!parsed.success) {
      return errorResponse(400, parsed.error.flatten());
    }

    if (!hasSupabaseEnv()) {
      return errorResponse(503, "Base de donnees non configuree.");
    }

    const supabase = createSupabaseAdminClient();
    const companyId = await getPublicLeadCompanyId(supabase);
    if (!companyId) {
      return errorResponse(500, "Aucune entreprise Yakout disponible pour rattacher la demande.");
    }

    const payload = {
      ...parsed.data,
      company_id: companyId,
      status: "new",
    };

    logger.info("[API/leads] lead public nettoye", {
      request_type: payload.request_type,
      source: payload.source,
      related_type: payload.related_type,
      related_slug: payload.related_slug,
      page_url: payload.page_url,
      company_id: payload.company_id,
    });

    const { data, error } = await supabase.from("leads").insert([payload]).select("*").single();

    if (error) {
      logger.error("[API/leads] Supabase insert error", error);
      return errorResponse(500, error.message);
    }

    return NextResponse.json({ ok: true, lead: data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    logger.error("[API/leads] Unexpected error", err);
    return errorResponse(500, msg);
  }
}
