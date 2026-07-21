export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { analyzeAirbnbListing } from "@/lib/airbnb/analyze-listing.server";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log("[airbnb-import] API route called");
  try {
    const client = await createSupabaseActionClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ success: false, code: "UNAUTHORIZED", message: "Authentification requise." }, { status: 401 });
    const body = await request.json();
    const rawUrl = String(body.url ?? "");

    const result = await analyzeAirbnbListing(rawUrl);
    if (!result.success) {
      return NextResponse.json(
        { success: false, code: result.code, message: result.message, requestId: result.requestId },
        { status: result.code === "INVALID_AIRBNB_URL" ? 400 : result.code === "AIRBNB_LISTING_NOT_FOUND" ? 404 : result.code === "AIRBNB_EXTRACTION_EMPTY" ? 422 : result.code === "AIRBNB_NAVIGATION_TIMEOUT" ? 504 : result.code.startsWith("AIRBNB_BROWSER") || result.code === "AIRBNB_BLOCKED" ? 503 : result.code === "AIRBNB_NAVIGATION_FAILED" ? 502 : 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[airbnb-import] route failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, code: "AIRBNB_EXTRACTION_FAILED", message: "L'analyse de l'annonce a échoué." },
      { status: 500 },
    );
  }
}
