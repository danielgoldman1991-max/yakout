import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validations/schemas";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

const userError = "La demande n’a pas pu être envoyée.";

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
      return errorResponse(503, "Base de données non configurée.");
    }

    const payload = {
      ...parsed.data,
      status: "new",
    };

    logger.info("[API/leads] lead public nettoye", {
      request_type: payload.request_type,
      source: payload.source,
      related_type: payload.related_type,
      related_slug: payload.related_slug,
      page_url: payload.page_url,
    });

    const supabase = createSupabaseAdminClient();
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
