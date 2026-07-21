import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { airbnbExtractionSchema, airbnbUrlSchema } from "./schemas";
import { canonicalPropertyType, normalizeAmenity, normalizeRoomType } from "./normalization";
import type { Browser } from "playwright-core";
import type { AirbnbListingCanonical, AirbnbListingExtraction, AirbnbPhotoCandidate } from "./types";

const numberNear = (text: string, words: string[]) => {
  for (const word of words) {
    const match = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${word}`, "i"));
    if (match) return Number(match[1].replace(",", "."));
  }
  return null;
};

const shouldWriteDebugArtifacts = () =>
  process.env.AIRBNB_WRITE_DEBUG_ARTIFACTS === "true" &&
  process.env.VERCEL !== "1" &&
  !process.env.AWS_EXECUTION_ENV &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME;

function extractJsonLd(html: string) {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      results.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch { /* skip invalid JSON-LD */ }
  }
  return results;
}

function decodeHtml(value: string | null): string | null {
  if (value == null) return null;
  const named: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token[0] === "#") {
      const point = token[1].toLowerCase() === "x" ? Number.parseInt(token.slice(2), 16) : Number.parseInt(token.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return named[token.toLowerCase()] ?? entity;
  }).replace(/[\s\u00a0]+/g, " ").trim();
}

function isGenericAirbnbTitle(value: string | null) {
  const normalized = decodeHtml(value)?.toLowerCase() ?? "";
  return !normalized || normalized.startsWith("airbnb") || normalized.includes("locations de vacances, cabanes") || normalized.includes("vacation rentals") || normalized.includes("holiday rentals");
}

function parseEmbeddedOverview(html: string) {
  const match = html.match(/"overview":\{[\s\S]{0,1200}?"title":"((?:\\.|[^"\\])*)"[\s\S]{0,600}?"items":\[((?:\\.|[^\]])*)\]/);
  if (!match) return { title: null as string | null, items: [] as string[] };
  try {
    const title = decodeHtml(JSON.parse(`"${match[1]}"`));
    const items = JSON.parse(`[${match[2]}]`).map((item: unknown) => decodeHtml(String(item))).filter(Boolean) as string[];
    return { title, items };
  } catch { return { title: null, items: [] }; }
}

function parsePropertySummary(summary: string | null) {
  if (!summary) return { propertyTypeLabel: null, city: null, country: null };
  const normalized = decodeHtml(summary) ?? "";
  const french = normalized.match(/^(?:Logement entier|Chambre privée)\s*:\s*(.+?)\s+-\s*([^,]+),\s*(.+)$/i);
  if (french) return { propertyTypeLabel: french[1].trim(), city: french[2].trim(), country: french[3].trim() };
  const english = normalized.match(/^(?:Entire|Private)\s+(.+?)\s+in\s+([^,]+),\s*(.+)$/i);
  if (english) return { propertyTypeLabel: english[1].trim(), city: english[2].trim(), country: english[3].trim() };
  return { propertyTypeLabel: normalized, city: null, country: null };
}

function structuredPhotoCandidates(jsonLd: Record<string, unknown>[], listingId: string): AirbnbPhotoCandidate[] {
  const urls = jsonLd.flatMap((entry) => Array.isArray(entry.image) ? entry.image : typeof entry.image === "string" ? [entry.image] : []);
  const seen = new Set<string>();
  return urls.flatMap((value) => {
    const sourceUrl = String(value).replace(/&amp;/g, "&");
    if (!/^https:\/\//i.test(sourceUrl) || !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(sourceUrl) || !/muscache\.com$/i.test(new URL(sourceUrl).hostname) || !sourceUrl.includes(listingId) || seen.has(sourceUrl)) return [];
    seen.add(sourceUrl);
    return [{ sourceUrl, width: null, height: null, alt: null, source: "structured-data" as const }];
  }).slice(0, 20);
}

export function extractCanonicalAirbnbListing(html: string, url: string, listingId: string): AirbnbListingCanonical {
  const jsonLd = extractJsonLd(html);
  const listing = jsonLd.find((entry) => entry["@type"] === "VacationRental") ?? jsonLd.find((entry) => entry["@type"] === "Product") ?? {};
  const overview = parseEmbeddedOverview(html);
  const summary = parsePropertySummary(overview.title);
  const capacityText = overview.items.join(" · ");
  const titleCandidate = decodeHtml(typeof listing.name === "string" ? listing.name : null);
  const title = !isGenericAirbnbTitle(titleCandidate) ? titleCandidate : null;
  const address = listing.address && typeof listing.address === "object" ? listing.address as Record<string, unknown> : {};
  const city = summary.city ?? (typeof address.addressLocality === "string" ? decodeHtml(address.addressLocality) : null);
  const photos = structuredPhotoCandidates(jsonLd, listingId);
  const propertyType = canonicalPropertyType(summary.propertyTypeLabel);
  const values = {
    maxGuests: numberNear(capacityText, ["voyageurs?", "guests?"]),
    bedrooms: numberNear(capacityText, ["chambres?", "bedrooms?"]),
    beds: numberNear(capacityText, ["lits?", "beds?"]),
    bathrooms: numberNear(capacityText, ["salles? de bain", "baths?", "bathrooms?"]),
  };
  const missing = [title, propertyType, city, values.maxGuests, values.bedrooms, values.beds, values.bathrooms].filter((value) => value == null).length;
  const warnings = [...(!title ? ["Titre spécifique introuvable."] : []), ...(!propertyType ? ["Type de logement à confirmer."] : []), ...(!photos.length ? ["Aucune photo exploitable n’a été détectée."] : [])];
  return { listingId, sourceUrl: url, title, propertyType, propertyTypeLabel: summary.propertyTypeLabel, city, country: summary.country, maxGuests: values.maxGuests, bedrooms: values.bedrooms, beds: values.beds, bathrooms: values.bathrooms, description: decodeHtml(typeof listing.description === "string" ? listing.description : null), amenities: [], photos, partial: missing > 0, warnings };
}

function extractHeadingText(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text) headings.push(text);
  }
  return headings;
}

function extractBodyText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return "";
  return bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u00a0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractAirbnbListingFromHtml(html: string, inputUrl: string): Promise<AirbnbListingExtraction> {
  const url = airbnbUrlSchema.parse(inputUrl);
  const listingId = new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1];
  if (!listingId) throw new Error("Identifiant Airbnb introuvable.");
  return parseAirbnbHtml(html, url, listingId);
}

export async function extractAirbnbListing(inputUrl: string): Promise<AirbnbListingExtraction> {
  console.log("[airbnb-import] analysis started");
  const url = airbnbUrlSchema.parse(inputUrl);
  const listingId = new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1];
  if (!listingId) throw new Error("Identifiant Airbnb introuvable.");
  const root = path.join(process.cwd(), "airbnb-import-artifacts");
  await mkdir(path.join(root, "raw"), { recursive: true });
  await mkdir(path.join(root, "screenshots"), { recursive: true });

  const { chromium: playwrightChromium } = await import("playwright-core");
  const headless = process.env.AIRBNB_IMPORT_VISIBLE !== "true";
  const launchOptions: Record<string, unknown> = { headless };

  if (process.env.VERCEL) {
    const sparticuz = await import("@sparticuz/chromium").then((m) => m.default).catch(() => null);
    if (sparticuz?.executablePath) {
      launchOptions.executablePath = await sparticuz.executablePath();
      const sparticuzArgs = sparticuz.args ?? [];
      const existingArgs = (launchOptions.args as string[]) ?? [];
      launchOptions.args = [...existingArgs, ...sparticuzArgs];
    }
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
    console.log("[airbnb-import] page loading");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    console.log("[airbnb-import] page loaded");
    const bodyText = await page.locator("body").innerText();
    if (/captcha|confirmez que vous êtes humain|verify you are human/i.test(bodyText)) throw new Error("INTERVENTION_HUMAINE_REQUISE");
    const html = await page.content();
    await page.screenshot({ path: path.join(root, "screenshots", "full-page.png"), fullPage: true }).catch(() => {});
    console.log("[airbnb-import] extraction completed");
    return parseAirbnbHtml(html, url, listingId);
  } catch (error) {
    console.error("[airbnb-import] analysis failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch((closeError) => {
        console.error("[airbnb-import] browser close failed", closeError);
      });
    }
  }
}

async function parseAirbnbHtml(html: string, url: string, listingId: string): Promise<AirbnbListingExtraction> {
  const jsonLd = extractJsonLd(html);
  const canonical = extractCanonicalAirbnbListing(html, url, listingId);
  const text = extractBodyText(html);
  const headings = extractHeadingText(html);
  const photos = canonical.photos.map((img, order) => ({
    order,
    sourceUrl: img.sourceUrl,
    highResolutionUrl: img.sourceUrl,
    caption: null,
    roomLabel: null,
    altText: img.alt,
    width: img.width,
    height: img.height,
  }));

  const title = canonical.title;
  const pageTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() || null;
  const description = canonical.description;
  const lang = (html.match(/<html[^>]*lang=["']([^"']+)/i)?.[1] ?? "fr").slice(0, 5);
  const location = canonical.city && canonical.country ? `${canonical.city}, ${canonical.country}` : canonical.city;

  const amenities = text.split(/\s{2,}|•|\n/).filter((line) => {
    const l = line.trim();
    return l.length > 1 && l.length < 80 && /wifi|cuisine|climatisation|piscine|parking|lave-linge|ascenseur|balcon|terrasse|détecteur/i.test(l);
  });
  const propertyLabel = canonical.propertyTypeLabel;
  const locationParts = (location ?? "").split(",").map((p) => p.trim());

  const extraction: AirbnbListingExtraction = {
    source: { platform: "airbnb", listingId, url, extractedAt: new Date().toISOString(), language: lang, pageTitle },
    identity: {
      title,
      subtitle: propertyLabel,
      propertyTypeLabel: propertyLabel,
      roomType: canonical.propertyType === "room" ? "private_room" : canonical.propertyType ? "entire_place" : normalizeRoomType(propertyLabel),
    },
    capacity: {
      maxGuests: canonical.maxGuests,
      bedrooms: canonical.bedrooms,
      beds: canonical.beds,
      bathrooms: canonical.bathrooms,
      sleepingArrangements: [],
    },
    location: {
      city: canonical.city,
      district: null,
      region: locationParts[1] || null,
      country: canonical.country,
      publicLocationLabel: location,
      neighborhoodDescription: null,
    },
    descriptions: { summary: description, space: null, guestAccess: null, otherThingsToNote: null, neighborhood: null },
    amenities: { available: [...new Set(amenities)].map(normalizeAmenity), unavailable: [] },
    rules: { checkInFrom: null, checkInUntil: null, checkOutBefore: null, maxGuests: null, petsAllowed: null, smokingAllowed: null, eventsAllowed: null, additionalRules: [] },
    safety: [],
    photos,
    platformMetrics: {
      rating: numberNear(text, ["sur 5"]),
      reviewCount: numberNear(text, ["commentaires?", "avis"]),
      guestFavorite: /coup de cœur voyageurs/i.test(text) || null,
      hostName: null,
      superhost: /superhôte/i.test(text) || null,
    },
    priceSnapshot: { amount: null, currency: null, observedAt: null, dateContext: null },
    raw: { jsonLd, extractedTexts: { page: text } },
    warnings: [],
    missingFields: [],
    confidence: {},
  };

  for (const [key, value] of Object.entries({
    title: extraction.identity.title,
    propertyType: extraction.identity.propertyTypeLabel,
    capacity: extraction.capacity.maxGuests,
    bedrooms: extraction.capacity.bedrooms,
    beds: extraction.capacity.beds,
    bathrooms: extraction.capacity.bathrooms,
    city: extraction.location.city,
  })) {
    extraction.confidence[key] = value == null ? 0 : key === "title" ? 0.9 : 0.75;
    if (value == null) extraction.missingFields.push(key);
  }
  if (!canonical.propertyType) extraction.warnings.push("Type de location à confirmer manuellement.");
  if (!extraction.photos.length) extraction.warnings.push("Aucune photo publique détectée.");

  const parsed = airbnbExtractionSchema.parse(extraction);
  if (shouldWriteDebugArtifacts()) {
    const root = path.join(process.cwd(), "airbnb-import-artifacts", "raw");
    await mkdir(root, { recursive: true });
    await Promise.all([
      writeFile(path.join(root, "page.json"), JSON.stringify({ jsonLd, title, pageTitle, description, lang, location, headings }, null, 2), "utf8"),
      writeFile(path.join(root, "page.html"), html, "utf8"),
    ]);
  }
  return parsed;
}
