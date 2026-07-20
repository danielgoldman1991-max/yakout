export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { analyzeAirbnbListing } from "@/lib/airbnb/analyze-listing.server";
import { extractAirbnbListingFromHtml } from "@/lib/airbnb/extraction.server";

export async function POST(request: NextRequest) {
  console.log("[airbnb-import] API route called");
  try {
    const body = await request.json();
    const rawUrl = String(body.url ?? "");
    const rawHtml = String(body.rawHtml ?? "");

    if (rawHtml) {
      const extraction = await extractAirbnbListingFromHtml(rawHtml, rawUrl);
      return NextResponse.json({ success: true, data: extraction });
    }

    const result = await analyzeAirbnbListing(rawUrl);
    if (!result.success) {
      const statusMap: Record<string, number> = {
        INVALID_AIRBNB_URL: 400,
        AIRBNB_BROWSER_LAUNCH_FAILED: 503,
        AIRBNB_NAVIGATION_FAILED: 502,
        AIRBNB_TIMEOUT: 504,
        AIRBNB_BLOCKED: 503,
        AIRBNB_EXTRACTION_EMPTY: 422,
        AIRBNB_EXTRACTION_FAILED: 500,
      };
      return NextResponse.json(
        { success: false, code: result.code, message: result.message },
        { status: statusMap[result.code] ?? 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
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
