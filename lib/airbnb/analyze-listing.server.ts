import "server-only";
import { extractAirbnbListingFromHtml } from "./extraction.server";
import { airbnbUrlSchema } from "./schemas";
import type { AirbnbListingExtraction } from "./types";

export type AirbnbErrorCode =
  | "INVALID_AIRBNB_URL"
  | "AIRBNB_BROWSER_LAUNCH_FAILED"
  | "AIRBNB_NAVIGATION_FAILED"
  | "AIRBNB_TIMEOUT"
  | "AIRBNB_BLOCKED"
  | "AIRBNB_EXTRACTION_EMPTY"
  | "AIRBNB_EXTRACTION_FAILED";

export type AirbnbAnalysisResult =
  | { success: true; data: AirbnbListingExtraction }
  | { success: false; code: AirbnbErrorCode; message: string };

class AirbnbError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AirbnbError";
  }
}

const AIRBNB_HOSTNAME_PATTERN = /^([a-z0-9-]+\.)?airbnb\.(com|fr)$/;

const PUBLIC_ERROR_MESSAGES: Record<AirbnbErrorCode, string> = {
  INVALID_AIRBNB_URL: "L'URL Airbnb n'est pas valide.",
  AIRBNB_BROWSER_LAUNCH_FAILED: "Le service d'analyse est temporairement indisponible.",
  AIRBNB_NAVIGATION_FAILED: "Impossible d'ouvrir cette annonce Airbnb. Vérifiez qu'elle est publique.",
  AIRBNB_TIMEOUT: "Airbnb met trop de temps à répondre. Réessayez dans quelques instants.",
  AIRBNB_BLOCKED: "Airbnb a temporairement refusé l'analyse automatique.",
  AIRBNB_EXTRACTION_EMPTY: "L'annonce a été ouverte, mais aucune information exploitable n'a été trouvée.",
  AIRBNB_EXTRACTION_FAILED: "L'analyse de l'annonce a échoué.",
};

function validateAirbnbUrl(input: string): string {
  if (!input || typeof input !== "string") throw new AirbnbError("INVALID_AIRBNB_URL", "URL requise.");
  if (input.length > 500) throw new AirbnbError("INVALID_AIRBNB_URL", "URL trop longue.");
  let url: URL;
  try { url = new URL(input); } catch { throw new AirbnbError("INVALID_AIRBNB_URL", "URL invalide."); }
  if (url.protocol !== "https:") throw new AirbnbError("INVALID_AIRBNB_URL", "Seules les URLs HTTPS sont autorisées.");
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") throw new AirbnbError("INVALID_AIRBNB_URL", "Les URLs locales ne sont pas autorisées.");
  if (!AIRBNB_HOSTNAME_PATTERN.test(url.hostname)) throw new AirbnbError("INVALID_AIRBNB_URL", "Seules les annonces airbnb.com ou airbnb.fr sont autorisées.");
  if (!/^\/rooms\/\d+/.test(url.pathname)) throw new AirbnbError("INVALID_AIRBNB_URL", "L'URL doit pointer vers une annonce Airbnb.");
  return input;
}

export async function analyzeAirbnbListing(rawUrl: string): Promise<AirbnbAnalysisResult> {
  console.log("[airbnb-import] validation started");
  const url = validateAirbnbUrl(rawUrl);
  console.log("[airbnb-import] validation succeeded");

  const parsedUrl = airbnbUrlSchema.parse(url);
  const listingId = new URL(parsedUrl).pathname.match(/^\/rooms\/(\d+)/)?.[1];
  if (!listingId) return { success: false, code: "INVALID_AIRBNB_URL", message: PUBLIC_ERROR_MESSAGES.INVALID_AIRBNB_URL };

  console.log("[airbnb-import] browser launch started");
  let playwrightChromium: typeof import("playwright-core").chromium;
  try {
    playwrightChromium = (await import("playwright-core")).chromium;
  } catch (e: unknown) {
    const cause = e instanceof Error ? { message: e.message, stack: e.stack?.split("\n").slice(0, 3).join(";"), name: e.name } : String(e);
    console.error("[airbnb-import] playwright-core import failed", cause);
    throw new AirbnbError("AIRBNB_BROWSER_LAUNCH_FAILED", PUBLIC_ERROR_MESSAGES.AIRBNB_BROWSER_LAUNCH_FAILED);
  }

  const sparticuz = await import("@sparticuz/chromium").then((m) => m.default).catch(() => null);
  const launchOptions: Record<string, unknown> = { headless: true };
  if (sparticuz?.executablePath) {
    launchOptions.executablePath = await sparticuz.executablePath();
    const sparticuzArgs = sparticuz.args ?? [];
    const existingArgs = (launchOptions.args as string[]) ?? [];
    launchOptions.args = [...existingArgs, ...sparticuzArgs];
  }

  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | null = null;
  try {
    browser = await playwrightChromium.launch(launchOptions);
    console.log("[airbnb-import] browser launched");

    const context = await browser.newContext({
      locale: "fr-FR",
      timezoneId: "Africa/Casablanca",
      viewport: { width: 1440, height: 1000 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9" },
    });
    const page = await context.newPage();

    page.on("requestfailed", (request) => {
      console.warn("[airbnb-import] browser request failed", {
        resourceType: request.resourceType(),
        failure: request.failure()?.errorText,
      });
    });

    console.log("[airbnb-import] navigation started");
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    } catch (navError) {
      console.error("[airbnb-import] navigation failed", {
        message: navError instanceof Error ? navError.message : String(navError),
      });
      throw new AirbnbError("AIRBNB_NAVIGATION_FAILED", PUBLIC_ERROR_MESSAGES.AIRBNB_NAVIGATION_FAILED);
    }
    console.log("[airbnb-import] page loaded");

    const currentUrl = page.url();

    if (!AIRBNB_HOSTNAME_PATTERN.test(new URL(currentUrl).hostname)) {
      console.warn("[airbnb-import] redirected outside Airbnb", { currentUrl });
      throw new AirbnbError("AIRBNB_NAVIGATION_FAILED", PUBLIC_ERROR_MESSAGES.AIRBNB_NAVIGATION_FAILED);
    }

    const bodyText = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (/captcha|confirmez que vous êtes humain|verify you are human/i.test(bodyText)) {
      console.warn("[airbnb-import] captcha detected");
      throw new AirbnbError("AIRBNB_BLOCKED", PUBLIC_ERROR_MESSAGES.AIRBNB_BLOCKED);
    }

    if (/cette page n'est plus disponible|cette annonce n'existe plus|page non trouvée|not found/i.test(bodyText)) {
      console.warn("[airbnb-import] listing not available");
      throw new AirbnbError("AIRBNB_NAVIGATION_FAILED", PUBLIC_ERROR_MESSAGES.AIRBNB_NAVIGATION_FAILED);
    }

    console.log("[airbnb-import] extraction started");
    const html = await page.content();
    const extraction = await extractAirbnbListingFromHtml(html, url);
    console.log("[airbnb-import] extraction completed");

    if (!extraction.identity.title && !extraction.capacity.maxGuests) {
      throw new AirbnbError("AIRBNB_EXTRACTION_EMPTY", PUBLIC_ERROR_MESSAGES.AIRBNB_EXTRACTION_EMPTY);
    }

    return { success: true, data: extraction };
  } catch (error) {
    const code: AirbnbErrorCode = error instanceof AirbnbError
      ? error.code as AirbnbErrorCode
      : "AIRBNB_EXTRACTION_FAILED";
    console.error("[airbnb-import] operation failed", {
      stage: "extraction",
      code,
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error && "cause" in error ? error.cause : undefined,
    });
    return { success: false, code, message: PUBLIC_ERROR_MESSAGES[code] };
  } finally {
    if (browser) {
      await browser.close().catch((e) => console.error("[airbnb-import] browser close failed", e));
      console.log("[airbnb-import] browser closed");
    }
  }
}
