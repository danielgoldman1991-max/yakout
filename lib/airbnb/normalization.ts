import { createHash } from "node:crypto";
import type { AirbnbListingCanonical, AirbnbListingExtraction, AirbnbPropertyType, AirbnbRoomType } from "./types";

const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const amenityMap: Record<string, [string, string]> = { wifi: ["wifi", "internet_work"], cuisine: ["kitchen", "kitchen"], climatisation: ["air_conditioning", "heating_cooling"], piscine: ["pool", "outdoor"], "parking gratuit sur place": ["free_parking", "parking"], "espace de travail dédié": ["workspace", "internet_work"], "lave-linge": ["washing_machine", "essentials"], ascenseur: ["elevator", "accessibility"], balcon: ["balcony", "outdoor"], terrasse: ["terrace", "outdoor"], "détecteur de fumée": ["smoke_alarm", "safety"] };

export function normalizeAmenity(label: string) { const found = Object.entries(amenityMap).find(([key]) => fold(key) === fold(label))?.[1]; return { sourceLabel: label.trim(), normalizedKey: found?.[0] ?? null, category: found?.[1] ?? null }; }
export function normalizeRoomType(label: string | null): AirbnbRoomType { const value = fold(label ?? ""); if (value.includes("logement entier") || value.includes("entire")) return "entire_place"; if (value.includes("chambre privee") || value.includes("private room")) return "private_room"; if (value.includes("chambre partagee") || value.includes("shared room")) return "shared_room"; return "unknown"; }
export function mapPropertyType(label: string | null, roomType: AirbnbRoomType) { if (roomType === "private_room") return "private_room" as const; const value = fold(label ?? ""); const entries = [["studio", "studio"], ["villa", "villa"], ["riad", "riad"], ["maison", "house"], ["penthouse", "penthouse"], ["appartement", "apartment"]] as const; return entries.find(([source]) => value.includes(source))?.[1] ?? "other"; }
export function canonicalPropertyType(label: string | null): AirbnbPropertyType | null {
  const value = fold(label ?? "");
  const entries = [["appartement en residence", "apartment"], ["rental unit", "apartment"], ["condominium", "apartment"], ["appartement", "apartment"], ["apartment", "apartment"], ["studio", "studio"], ["villa", "villa"], ["riad", "riad"], ["maison", "house"], ["house", "house"], ["chambre privee", "room"], ["private room", "room"]] as const;
  return entries.find(([source]) => value.includes(source))?.[1] ?? null;
}
export function mapAirbnbListingToApartmentForm(listing: AirbnbListingCanonical) {
  return { title: listing.title ?? "", city: listing.city ?? "", country: listing.country ?? "", propertyType: listing.propertyType ?? "", capacity: listing.maxGuests, bedrooms: listing.bedrooms, beds: listing.beds, bathrooms: listing.bathrooms, shortDescription: listing.description ?? "", sourceUrl: listing.sourceUrl, airbnbListingId: listing.listingId, photos: listing.photos };
}
export function normalizeIntegerCount(value: number | null | undefined, fallback = 0) {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.trunc(value));
}
export function buildShortDescription(e: AirbnbListingExtraction) { const type = e.identity.propertyTypeLabel ?? "Logement"; const location = e.location.district ?? e.location.city; const parts = [type + (location ? ` à ${location}` : "")]; if (e.capacity.maxGuests) parts.push(`pour ${e.capacity.maxGuests} voyageurs`); if (e.capacity.bedrooms) parts.push(`avec ${e.capacity.bedrooms} chambre${e.capacity.bedrooms > 1 ? "s" : ""}`); return `${parts.join(", ")}. Informations issues de l’annonce et à confirmer avant publication.`.slice(0, 220); }
function stable(value: unknown): unknown { if (Array.isArray(value)) return value.map(stable).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)])); return value; }
export function extractionContentHash(e: AirbnbListingExtraction) { const content = { identity: e.identity, capacity: e.capacity, descriptions: e.descriptions, amenities: e.amenities, rules: e.rules, photos: e.photos.map(({ highResolutionUrl, caption, altText }) => ({ highResolutionUrl: highResolutionUrl.replace(/\?.*$/, ""), caption, altText })) }; return createHash("sha256").update(JSON.stringify(stable(content))).digest("hex"); }
