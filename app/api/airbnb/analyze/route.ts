export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { chromium as playwrightChromium, type Browser } from "playwright-core";
import { airbnbUrlSchema, airbnbExtractionSchema } from "@/lib/airbnb/schemas";
import { extractAirbnbListingFromHtml } from "@/lib/airbnb/extraction.server";
import { buildShortDescription, extractionContentHash, mapPropertyType } from "@/lib/airbnb/normalization";
import type { AirbnbListingExtraction } from "@/lib/airbnb/types";

const AIRBNB_HOSTNAME_PATTERN = /^([a-z0-9-]+\.)?airbnb\.(com|fr)$/;

function validateUrl(input: string): string {
  if (!input || typeof input !== "string") throw new Error("URL requise.");
  if (input.length > 500) throw new Error("URL trop longue.");
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("URL invalide."); }
  if (url.protocol !== "https:") throw new Error("Seules les URLs HTTPS sont autorisées.");
  if (!AIRBNB_HOSTNAME_PATTERN.test(url.hostname)) throw new Error("Seules les annonces airbnb.com ou airbnb.fr sont autorisées.");
  if (!/^\/rooms\/\d+/.test(url.pathname)) throw new Error("L'URL doit pointer vers une annonce Airbnb (/rooms/...).");
  return input;
}

async function extractWithBrowser(url: string): Promise<AirbnbListingExtraction> {
  console.log("[airbnb-import] launching browser");
  const sparticuz = await import("@sparticuz/chromium").then((m) => m.default).catch(() => null);
  const launchOptions: Record<string, unknown> = { headless: true };
  if (sparticuz?.executablePath) {
    launchOptions.executablePath = await sparticuz.executablePath();
    launchOptions.args = sparticuz.args;
  }
  let browser: Browser | null = null;
  try {
    browser = await playwrightChromium.launch(launchOptions);
    const context = await browser.newContext({
      locale: "fr-FR",
      timezoneId: "Africa/Casablanca",
      viewport: { width: 1440, height: 1000 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9" },
    });
    const page = await context.newPage();
    console.log("[airbnb-import] navigating");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    console.log("[airbnb-import] page loaded");
    const bodyText = await page.locator("body").innerText();
    if (/captcha|confirmez que vous êtes humain|verify you are human/i.test(bodyText)) throw new Error("INTERVENTION_HUMAINE_REQUISE");
    const html = await page.content();
    console.log("[airbnb-import] extracting data");
    const extraction = await import("@/lib/airbnb/extraction.server").then((m) => m.extractAirbnbListingFromHtml(html, url));
    return extraction;
  } finally {
    if (browser) {
      await browser.close().catch((e) => console.error("[airbnb-import] browser close failed", e));
    }
  }
}

export async function POST(request: NextRequest) {
  console.log("[airbnb-import] API route called");
  try {
    const body = await request.json();
    const rawUrl = String(body.url ?? "");
    const rawHtml = String(body.rawHtml ?? "");

    if (rawHtml) {
      const extraction = await extractAirbnbListingFromHtml(rawHtml, rawUrl);
      return NextResponse.json({ extraction });
    }

    const url = validateUrl(rawUrl);
    airbnbUrlSchema.parse(url);
    const extraction = await extractWithBrowser(url);
    return NextResponse.json({ extraction });
  } catch (error) {
    console.error("[airbnb-import] API failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Analyse impossible.";
    if (message === "INTERVENTION_HUMAINE_REQUISE") {
      return NextResponse.json({ error: "Intervention humaine requise. Lancez avec AIRBNB_IMPORT_VISIBLE=true localement ou réessayez plus tard." }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
