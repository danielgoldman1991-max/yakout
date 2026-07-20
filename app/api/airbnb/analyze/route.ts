export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { extractAirbnbListing } from "@/lib/airbnb/extraction.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = String(body.url ?? "");
    if (!url) {
      return NextResponse.json({ error: "URL requise." }, { status: 400 });
    }
    const extraction = await extractAirbnbListing(url);
    return NextResponse.json({ extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse impossible.";
    return NextResponse.json(
      { error: message === "INTERVENTION_HUMAINE_REQUISE" ? "Intervention humaine requise. Relancez localement avec AIRBNB_IMPORT_VISIBLE=true." : message },
      { status: 500 }
    );
  }
}
