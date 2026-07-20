export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { extractAirbnbListing, extractAirbnbListingFromHtml } from "@/lib/airbnb/extraction.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = String(body.url ?? "");
    const rawHtml = String(body.rawHtml ?? "");
    if (!url) return NextResponse.json({ error: "URL requise." }, { status: 400 });
    const extraction = rawHtml ? await extractAirbnbListingFromHtml(rawHtml, url) : await extractAirbnbListing(url);
    return NextResponse.json({ extraction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analyse impossible." }, { status: 500 });
  }
}
