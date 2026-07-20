import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { airbnbExtractionSchema, airbnbUrlSchema } from "./schemas";
import { normalizeAmenity, normalizeRoomType } from "./normalization";
import type { AirbnbListingExtraction } from "./types";

const numberNear = (text: string, words: string[]) => {
  for (const word of words) {
    const match = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${word}`, "i"));
    if (match) return Number(match[1].replace(",", "."));
  }
  return null;
};

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

function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta\\s[^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(name)}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, "i"),
      new RegExp(`<meta\\s[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(name)}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) return m[1].replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function elementText(html: string, tag: string, nth = 0): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    if (count++ === nth) return match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }
  return null;
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

function extractImageUrls(html: string): { src: string; alt: string | null }[] {
  const urls = new Map<string, string | null>();
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1].replace(/\?.*$/, "");
    if (/^https:\/\//.test(src) && /muscache|airbnb|akamai/i.test(src) && !/assets\.airbnb\.com\/images\/maintenance/i.test(src)) {
      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      if (!urls.has(src)) urls.set(src, altMatch?.[1]?.trim() || null);
    }
  }
  return [...urls.entries()].map(([src, alt]) => ({ src, alt }));
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
  const url = airbnbUrlSchema.parse(inputUrl);
  const listingId = new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1];
  if (!listingId) throw new Error("Identifiant Airbnb introuvable.");
  const root = path.join(process.cwd(), "airbnb-import-artifacts");
  await mkdir(path.join(root, "raw"), { recursive: true });
  await mkdir(path.join(root, "screenshots"), { recursive: true });

  const headless = process.env.AIRBNB_IMPORT_VISIBLE !== "true";
  const launchOptions: Parameters<typeof chromium.launch>[0] = { headless };

  if (process.env.VERCEL) {
    const sparticuz = await import("@sparticuz/chromium").then((m) => m.default).catch(() => null);
    if (sparticuz?.executablePath) {
      launchOptions.executablePath = await sparticuz.executablePath();
      launchOptions.args = [...(launchOptions.args ?? []), ...(sparticuz.args ?? [])];
    }
  }

  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ locale: "fr-FR", timezoneId: "Africa/Casablanca", viewport: { width: 1440, height: 1000 } });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    const bodyText = await page.locator("body").innerText();
    if (/captcha|confirmez que vous êtes humain|verify you are human/i.test(bodyText)) throw new Error("INTERVENTION_HUMAINE_REQUISE");
    const html = await page.content();
    await page.screenshot({ path: path.join(root, "screenshots", "full-page.png"), fullPage: true }).catch(() => {});
    return parseAirbnbHtml(html, url, listingId);
  } finally {
    await browser.close();
  }
}

async function parseAirbnbHtml(html: string, url: string, listingId: string): Promise<AirbnbListingExtraction> {
  const root = path.join(process.cwd(), "airbnb-import-artifacts");
  await mkdir(path.join(root, "raw"), { recursive: true });

  const jsonLd = extractJsonLd(html);
  const text = extractBodyText(html);
  const headings = extractHeadingText(html);
  const images = extractImageUrls(html).slice(0, 30);
  const photos = images.map((img, order) => ({
    order,
    sourceUrl: img.src,
    highResolutionUrl: img.src,
    caption: null,
    roomLabel: null,
    altText: img.alt,
    width: null as number | null,
    height: null as number | null,
  }));

  const title = metaContent(html, ["og:title", "twitter:title"]) || elementText(html, "h1") || null;
  const pageTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() || null;
  const description = metaContent(html, ["og:description", "description", "twitter:description"]) || null;
  const lang = (html.match(/<html[^>]*lang=["']([^"']+)/i)?.[1] ?? "fr").slice(0, 5);
  const location = headings.find((h) => /marrakech|maroc|morocco/i.test(h)) || null;

  const amenities = text.split(/\s{2,}|•|\n/).filter((line) => {
    const l = line.trim();
    return l.length > 1 && l.length < 80 && /wifi|cuisine|climatisation|piscine|parking|lave-linge|ascenseur|balcon|terrasse|détecteur/i.test(l);
  });
  const propertyLabel = headings.find((h) => /appartement|studio|villa|riad|maison|chambre|penthouse|logement/i.test(h)) ?? null;
  const locationParts = (location ?? "").split(",").map((p) => p.trim());

  const extraction: AirbnbListingExtraction = {
    source: { platform: "airbnb", listingId, url, extractedAt: new Date().toISOString(), language: lang, pageTitle },
    identity: {
      title,
      subtitle: propertyLabel,
      propertyTypeLabel: propertyLabel,
      roomType: normalizeRoomType(propertyLabel),
    },
    capacity: {
      maxGuests: numberNear(text, ["voyageurs?", "personnes?"]),
      bedrooms: numberNear(text, ["chambres?"]),
      beds: numberNear(text, ["lits?"]),
      bathrooms: numberNear(text, ["salles? de bain", "salle de bain"]),
      sleepingArrangements: [],
    },
    location: {
      city: locationParts[0] || null,
      district: null,
      region: locationParts[1] || null,
      country: locationParts[2] || (location?.toLowerCase().includes("maroc") ? "Maroc" : null),
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
  if (extraction.identity.roomType === "unknown") extraction.warnings.push("Type de location à confirmer manuellement.");
  if (!extraction.photos.length) extraction.warnings.push("Aucune photo publique détectée.");

  const parsed = airbnbExtractionSchema.parse(extraction);
  await Promise.all([
    writeFile(path.join(root, "raw", "page.json"), JSON.stringify({ jsonLd, title, pageTitle, description, lang, location, headings }, null, 2), "utf8"),
    writeFile(path.join(root, "raw", "page.html"), html, "utf8"),
  ]);
  return parsed;
}
