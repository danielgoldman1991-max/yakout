import "server-only";

import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { launchAirbnbBrowser, isVercelRuntime } from "./browser.server";
import { AirbnbImportError, normalizeAirbnbError, type AirbnbImportErrorCode } from "./errors";
import { extractAirbnbListingFromHtml } from "./extraction.server";
import type { AirbnbListingExtraction } from "./types";

export type AirbnbExtractionResult =
  | { success: true; partial: boolean; data: AirbnbListingExtraction; warnings: string[]; requestId: string }
  | { success: false; code: AirbnbImportErrorCode; message: string; requestId: string };

const HOST = /^(?:[a-z0-9-]+\.)?airbnb\.(?:com|fr)$/i;
const withTimeout = async <T>(promise: Promise<T>, ms: number, error: AirbnbImportError) => Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(error), ms))]);
const safeUrl = (url: string) => { const parsed = new URL(url); return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`; };

async function readStablePage(page: import("playwright-core").Page) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
      await page.locator("body").waitFor({ state: "attached", timeout: 10_000 });
      const [title, html, text] = await Promise.all([
        page.title(),
        page.content(),
        page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""),
      ]);
      return { title, html, text, finalUrl: page.url() };
    } catch (error) {
      lastError = error;
      if (!/navigat|execution context was destroyed/i.test(error instanceof Error ? error.message : String(error))) throw error;
    }
  }
  throw new AirbnbImportError("AIRBNB_NAVIGATION_FAILED", `Airbnb kept redirecting: ${lastError instanceof Error ? lastError.message : String(lastError)}`, "navigation", 502, true, { cause: lastError });
}

export function validateAirbnbUrl(rawUrl: string) {
  if (!rawUrl || rawUrl.length > 500) throw new AirbnbImportError("INVALID_AIRBNB_URL", "URL missing or longer than 500 characters", "validation", 400, false);
  let url: URL;
  try { url = new URL(rawUrl); } catch (cause) { throw new AirbnbImportError("INVALID_AIRBNB_URL", "URL parsing failed", "validation", 400, false, { cause }); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !HOST.test(url.hostname) || !/^\/rooms\/\d+(?:\/|$)/.test(url.pathname)) {
    throw new AirbnbImportError("INVALID_AIRBNB_URL", "URL must be an HTTPS airbnb.com/airbnb.fr rooms URL without credentials or a custom port", "validation", 400, false);
  }
  return safeUrl(rawUrl);
}

function log(event: string, details: Record<string, unknown>) { console.info(`[airbnb-import] ${event}`, details); }
function isBlocked(text: string, title: string) { return /captcha|verify you are human|confirmez que vous êtes humain|access denied|robot|challenge/i.test(`${title}\n${text}`); }

export async function analyzeAirbnbListing(rawUrl: string, options?: { requestId?: string }): Promise<AirbnbExtractionResult> {
  const requestId = options?.requestId ?? crypto.randomUUID();
  const runtime = isVercelRuntime() ? "vercel" : "local";
  const totalStarted = Date.now();
  let handle: Awaited<ReturnType<typeof launchAirbnbBrowser>> | null = null;
  let page: import("playwright-core").Page | null = null;
  let validatedUrl = "";
  let stage: AirbnbImportError["stage"] = "validation";
  log("started", { requestId, stage, runtime });
  try {
    validatedUrl = await withTimeout(Promise.resolve().then(() => validateAirbnbUrl(rawUrl)), 5_000, new AirbnbImportError("INVALID_AIRBNB_URL", "Validation timed out", "validation", 400, false));
    log("url validated", { requestId, stage, runtime, url: validatedUrl, durationMs: Date.now() - totalStarted });
    stage = "browser-resolution";
    log("browser resolution started", { requestId, stage, runtime, platform: process.platform, arch: process.arch });
    handle = await withTimeout(launchAirbnbBrowser(), 30_000, new AirbnbImportError("AIRBNB_BROWSER_LAUNCH_FAILED", "Browser launch timed out", "browser-launch", 503, true));
    stage = "navigation";
    const context = await handle.browser.newContext({ locale: "fr-FR", timezoneId: "Africa/Casablanca", viewport: { width: 1440, height: 1000 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7" } });
    page = await context.newPage();
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.resourceType() === "font" || request.resourceType() === "media" || /google-analytics|doubleclick|segment\.com/i.test(request.url())) await route.abort(); else await route.continue();
    });
    log("navigation started", { requestId, stage, runtime });
    const navStarted = Date.now();
    const response = await page.goto(validatedUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const { finalUrl, title, html, text } = await readStablePage(page);
    log("navigation completed", { requestId, stage, runtime, status: response?.status(), finalUrl: safeUrl(finalUrl), title, htmlLength: html.length, durationMs: Date.now() - navStarted });
    if (!HOST.test(new URL(finalUrl).hostname)) throw new AirbnbImportError("AIRBNB_NAVIGATION_FAILED", `Redirected outside Airbnb: ${safeUrl(finalUrl)}`, stage, 502, false);
    if (isBlocked(text, title)) throw new AirbnbImportError("AIRBNB_BLOCKED", "Airbnb protection page detected", stage, 503, true);
    if (response?.status() === 404 || /page non trouvée|annonce n'existe plus|listing.*not found/i.test(text)) throw new AirbnbImportError("AIRBNB_LISTING_NOT_FOUND", "Listing not found", stage, 404, false);
    if (!response || response.status() >= 400 || html.length < 1_000) throw new AirbnbImportError("AIRBNB_NAVIGATION_FAILED", `Unexpected response status=${response?.status()} htmlLength=${html.length}`, stage, 502, true);
    stage = "extraction";
    log("extraction started", { requestId, stage, runtime });
    const extraction = await withTimeout(extractAirbnbListingFromHtml(html, validatedUrl), 30_000, new AirbnbImportError("AIRBNB_EXTRACTION_FAILED", "Extraction timed out", stage, 500, true));
    const useful = Boolean(extraction.identity.title || extraction.capacity.maxGuests || extraction.photos.length || extraction.descriptions.summary);
    if (!useful) throw new AirbnbImportError("AIRBNB_EXTRACTION_EMPTY", "No useful listing field was extracted", stage, 422, true);
    const partial = extraction.missingFields.length > 0;
    log("extraction completed", { requestId, stage, runtime, partial, photos: extraction.photos.length, missingFields: extraction.missingFields.length, durationMs: Date.now() - totalStarted });
    return { success: true, partial, data: extraction, warnings: extraction.warnings, requestId };
  } catch (caught) {
    const error = normalizeAirbnbError(caught, stage);
    console.error("[airbnb-import] failed", { requestId, stage: error.stage, runtime, durationMs: Date.now() - totalStarted, code: error.code, name: caught instanceof Error ? caught.name : undefined, message: error.internalMessage, cause: caught instanceof Error && "cause" in caught ? String(caught.cause) : undefined, stack: caught instanceof Error ? caught.stack : undefined });
    if (page && !isVercelRuntime() && process.env.NODE_ENV === "development") {
      const dir = path.join(process.cwd(), ".airbnb-debug");
      await mkdir(dir, { recursive: true }).catch(() => undefined);
      await page.screenshot({ path: path.join(dir, `${requestId}.png`), fullPage: true }).catch(() => undefined);
      const html = await page.content().catch(() => "");
      await writeFile(path.join(dir, `${requestId}.html`), html.slice(0, 500_000)).catch(() => undefined);
      await writeFile(path.join(dir, `${requestId}.json`), JSON.stringify({ title: await page.title().catch(() => ""), finalUrl: safeUrl(page.url()) }, null, 2)).catch(() => undefined);
    }
    return { success: false, code: error.code, message: error.publicMessage, requestId };
  } finally {
    if (handle) await handle.cleanup();
  }
}
