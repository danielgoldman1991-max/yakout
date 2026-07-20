import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { airbnbExtractionSchema, airbnbUrlSchema } from "./schemas";
import { normalizeAmenity, normalizeRoomType } from "./normalization";
import type { AirbnbListingExtraction } from "./types";

const numberNear = (text: string, words: string[]) => { for (const word of words) { const match = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${word}`, "i")); if (match) return Number(match[1].replace(",", ".")); } return null; };
async function clickText(page: Page, patterns: RegExp[]) { for (const pattern of patterns) { const target = page.getByRole("button", { name: pattern }).first(); if (await target.isVisible().catch(() => false)) await target.click({ timeout: 3000 }).catch(() => {}); } }

export async function extractAirbnbListing(inputUrl: string, options?: { headless?: boolean }): Promise<AirbnbListingExtraction> {
  const url = airbnbUrlSchema.parse(inputUrl);
  const listingId = new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1];
  if (!listingId) throw new Error("Identifiant Airbnb introuvable.");
  const root = path.join(process.cwd(), "airbnb-import-artifacts");
  await Promise.all(["raw", "screenshots", "reports"].map((folder) => mkdir(path.join(root, folder), { recursive: true })));
  const browser = await chromium.launch({ headless: options?.headless ?? process.env.AIRBNB_IMPORT_VISIBLE !== "true" });
  const consoleLogs: string[] = []; const networkLogs: string[] = [];
  try {
    const context = await browser.newContext({ locale: "fr-FR", timezoneId: "Africa/Casablanca", viewport: { width: 1440, height: 1000 }, javaScriptEnabled: true });
    const page = await context.newPage(); page.setDefaultTimeout(10_000);
    page.on("console", (message) => consoleLogs.push(`[${message.type()}] ${message.text()}`));
    page.on("response", (response) => { const parsed = new URL(response.url()); networkLogs.push(`${response.status()} ${parsed.origin}${parsed.pathname}`); });
    let loaded = false;
    for (const candidate of [url, `${url}?adults=2`, `${url}?source_impression_id=yakout_import`]) {
      const response = await page.goto(candidate, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      const body = await page.locator("body").innerText().catch(() => "");
      if ((response?.status() ?? 500) < 500 && !/stay tuned|temporarily unavailable|error code:\s*503/i.test(body)) { loaded = true; break; }
      await page.waitForTimeout(1500);
    }
    if (!loaded) throw new Error("Airbnb est temporairement indisponible (503). Réessayez dans quelques instants.");
    if (/captcha|confirmez que vous êtes humain|verify you are human/i.test(await page.locator("body").innerText())) throw new Error("INTERVENTION_HUMAINE_REQUISE");
    await clickText(page, [/accepter/i, /fermer/i, /plus tard/i]);
    for (let index = 0; index < 5; index += 1) { await page.mouse.wheel(0, 800); await page.waitForTimeout(250); }
    await clickText(page, [/afficher plus/i, /tous les équipements/i, /règles/i]);
    const baseImages = await collectImageData(page);
    await clickText(page, [/afficher toutes? les photos/i]);
    await page.waitForTimeout(1200);
    const galleryImages = await collectImageData(page);
    const data = await page.evaluate(() => {
      const clean = (value: string | null | undefined) => value?.replace(/\s+/g, " ").trim() || null;
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((node) => { try { const parsed = JSON.parse(node.textContent || "null"); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; } });
      const text = document.body.innerText.replace(/\u00a0/g, " ");
      const headings = [...document.querySelectorAll("h1,h2,h3")].map((node) => clean(node.textContent)).filter(Boolean) as string[];
      const meta = (name: string) => clean(document.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.getAttribute("content"));
      return { lang: document.documentElement.lang || "fr", title: meta("og:title") || clean(document.querySelector("h1")?.textContent), pageTitle: document.title || null, description: meta("og:description") || meta("description"), location: headings.find((heading) => /marrakech|maroc|morocco/i.test(heading)) || null, text, headings, jsonLd };
    });
    const photos = [...new Map([...baseImages, ...galleryImages].map((photo) => [photo.src.replace(/\?.*$/, ""), photo])).values()].slice(0, 30);
    const amenities = data.text.split("\n").map((line) => line.trim()).filter((line) => line.length > 1 && line.length < 80 && /wifi|cuisine|climatisation|piscine|parking|lave-linge|ascenseur|balcon|terrasse|détecteur/i.test(line));
    const propertyLabel = data.headings.find((heading) => /appartement|studio|villa|riad|maison|chambre|penthouse|logement/i.test(heading)) ?? null;
    const location = (data.location ?? "").split(",").map((part) => part.trim());
    const extraction: AirbnbListingExtraction = {
      source: { platform: "airbnb", listingId, url, extractedAt: new Date().toISOString(), language: data.lang, pageTitle: data.pageTitle }, identity: { title: data.title, subtitle: propertyLabel, propertyTypeLabel: propertyLabel, roomType: normalizeRoomType(propertyLabel) },
      capacity: { maxGuests: numberNear(data.text, ["voyageurs?", "personnes?"]), bedrooms: numberNear(data.text, ["chambres?"]), beds: numberNear(data.text, ["lits?"]), bathrooms: numberNear(data.text, ["salles? de bain"]), sleepingArrangements: [] },
      location: { city: location[0] || null, district: null, region: location[1] || null, country: location[2] || (data.location?.toLowerCase().includes("maroc") ? "Maroc" : null), publicLocationLabel: data.location, neighborhoodDescription: null },
      descriptions: { summary: data.description, space: null, guestAccess: null, otherThingsToNote: null, neighborhood: null }, amenities: { available: [...new Set(amenities)].map(normalizeAmenity), unavailable: [] },
      rules: { checkInFrom: null, checkInUntil: null, checkOutBefore: null, maxGuests: null, petsAllowed: null, smokingAllowed: null, eventsAllowed: null, additionalRules: [] }, safety: [],
      photos: photos.map((photo, order) => ({ order, sourceUrl: photo.src, highResolutionUrl: photo.src, caption: null, roomLabel: null, altText: photo.alt, width: photo.width, height: photo.height })),
      platformMetrics: { rating: numberNear(data.text, ["sur 5"]), reviewCount: numberNear(data.text, ["commentaires?", "avis"]), guestFavorite: /coup de cœur voyageurs/i.test(data.text) || null, hostName: null, superhost: /superhôte/i.test(data.text) || null },
      priceSnapshot: { amount: null, currency: null, observedAt: null, dateContext: null }, raw: { jsonLd: data.jsonLd, extractedTexts: { page: data.text } }, warnings: [], missingFields: [], confidence: {},
    };
    for (const [key, value] of Object.entries({ title: extraction.identity.title, propertyType: extraction.identity.propertyTypeLabel, capacity: extraction.capacity.maxGuests, bedrooms: extraction.capacity.bedrooms, beds: extraction.capacity.beds, bathrooms: extraction.capacity.bathrooms, city: extraction.location.city })) { extraction.confidence[key] = value == null ? 0 : key === "title" ? 0.9 : 0.75; if (value == null) extraction.missingFields.push(key); }
    if (extraction.identity.roomType === "unknown") extraction.warnings.push("Type de location à confirmer manuellement.");
    if (!extraction.photos.length) extraction.warnings.push("Aucune photo publique détectée.");
    const parsed = airbnbExtractionSchema.parse(extraction);
    await Promise.all([writeFile(path.join(root, "raw", "page.html"), await page.content(), "utf8"), writeFile(path.join(root, "raw", "page.json"), JSON.stringify(data, null, 2), "utf8"), writeFile(path.join(root, "raw", "structured-data.json"), JSON.stringify(data.jsonLd, null, 2), "utf8"), writeFile(path.join(root, "reports", "console.log"), consoleLogs.join("\n"), "utf8"), writeFile(path.join(root, "reports", "network.log"), networkLogs.join("\n"), "utf8"), page.screenshot({ path: path.join(root, "screenshots", "full-page.png"), fullPage: true })]);
    return parsed;
  } finally { await browser.close(); }
}

async function collectImageData(page: Page) {
  return page.evaluate(() => [...document.images].flatMap((image) => {
    const srcsets = [image.getAttribute("srcset"), ...[...(image.closest("picture")?.querySelectorAll("source") ?? [])].map((source) => source.getAttribute("srcset"))];
    const urls = srcsets.flatMap((srcset) => (srcset ?? "").split(",").map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean));
    urls.push(image.currentSrc || image.src);
    return urls.map((src) => ({ src, alt: image.alt?.trim() || null, width: image.naturalWidth || null, height: image.naturalHeight || null }));
  }).filter((image) => /^https:\/\//.test(image.src) && /muscache|airbnb|akamai/i.test(image.src) && !/assets\.airbnb\.com\/images\/maintenance/i.test(image.src)));
}
