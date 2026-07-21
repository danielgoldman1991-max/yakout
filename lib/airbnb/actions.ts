"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug";
import { airbnbImportConfirmationSchema, airbnbUrlSchema } from "./schemas";
import { buildShortDescription, extractionContentHash, mapPropertyType } from "./normalization";
import type { AirbnbListingExtraction } from "./types";
import { analyzeAirbnbListing } from "./analyze-listing.server";

export type AirbnbAnalysisState = { error?: string; code?: string; requestId?: string; sourceUrl?: string; listingId?: string; preview?: { extraction: AirbnbListingExtraction; contentHash: string; generatedShortDescription: string; mappedPropertyType: string; partial: boolean; warnings: string[] } };
export type AirbnbConfirmationState = { error?: string; apartmentId?: string };

async function authContext() {
  const client = await createSupabaseActionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Session expirée. Reconnectez-vous.");
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("company_id,role").eq("user_id", user.id).single();
  if (!profile?.company_id || !["admin", "manager"].includes(profile.role)) throw new Error("Vous n'avez pas la permission d'importer un appartement.");
  return { admin, user, companyId: profile.company_id as string };
}

export async function analyzeAirbnbAction(_state: AirbnbAnalysisState, formData: FormData): Promise<AirbnbAnalysisState> {
  try {
    await authContext();
    const url = airbnbUrlSchema.parse(String(formData.get("url") ?? ""));
    const result = await analyzeAirbnbListing(url);
    if (!result.success) return { error: result.message, code: result.code, requestId: result.requestId, sourceUrl: url, listingId: new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1] };
    const extraction = result.data;
    extraction.raw = { jsonLd: extraction.raw.jsonLd, extractedTexts: {} };
    return { requestId: result.requestId, sourceUrl: url, listingId: extraction.source.listingId, preview: { extraction, contentHash: extractionContentHash(extraction), generatedShortDescription: buildShortDescription(extraction), mappedPropertyType: mapPropertyType(extraction.identity.propertyTypeLabel, extraction.identity.roomType), partial: result.partial, warnings: result.warnings } };
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("[airbnb-import] action failed", { requestId, message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return { error: error instanceof Error ? error.message : "Analyse impossible.", code: "AIRBNB_INTERNAL_ERROR", requestId };
  }
}

export async function analyzeAirbnbHtmlAction(_state: AirbnbAnalysisState, formData: FormData): Promise<AirbnbAnalysisState> {
  try {
    await authContext();
    const url = String(formData.get("url") ?? "").trim();
    const rawHtml = String(formData.get("rawHtml") ?? "").trim();
    if (!rawHtml) throw new Error("Collez le code source de l'annonce.");
    const { extractAirbnbListingFromHtml } = await import("./extraction.server");
    const extraction = await extractAirbnbListingFromHtml(rawHtml, url);
    extraction.raw = { jsonLd: extraction.raw.jsonLd, extractedTexts: {} };
    return { preview: { extraction, contentHash: extractionContentHash(extraction), generatedShortDescription: buildShortDescription(extraction), mappedPropertyType: mapPropertyType(extraction.identity.propertyTypeLabel, extraction.identity.roomType), partial: extraction.missingFields.length > 0, warnings: extraction.warnings } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Analyse impossible." };
  }
}

async function uniqueSlug(admin: ReturnType<typeof createSupabaseAdminClient>, title: string) {
  const base = slugify(title) || "appartement-airbnb"; let candidate = base;
  for (let suffix = 2; suffix < 100; suffix += 1) { const { data } = await admin.from("apartments").select("id").eq("slug", candidate).maybeSingle(); if (!data) return candidate; candidate = `${base}-${suffix}`; }
  return `${base}-${Date.now().toString(36)}`;
}

async function importSelectedPhotos(admin: ReturnType<typeof createSupabaseAdminClient>, apartmentId: string, companyId: string, title: string, urls: string[]) {
  if (!urls.length) return 0;
  const { count } = await admin.from("apartment_images").select("id", { count: "exact", head: true }).eq("apartment_id", apartmentId);
  const availableSlots = Math.max(0, 6 - (count ?? 0));
  const rows: Array<Record<string, unknown>> = [];
  for (const [index, url] of urls.slice(0, availableSlots).entries()) {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Téléchargement photo impossible (${response.status}).`);
    const mime = (response.headers.get("content-type") ?? "").split(";")[0];
    if (!new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(mime)) throw new Error(`Format photo non autorisé : ${mime || "inconnu"}.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Une photo Airbnb dépasse 5 MB.");
    const hash = createHash("sha256").update(bytes).digest("hex");
    const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/avif" ? "avif" : "jpg";
    const imagePath = `apartments/${apartmentId}/airbnb-import/${hash}.${extension}`;
    const { error: uploadError } = await admin.storage.from("yakout-media").upload(imagePath, bytes, { contentType: mime, cacheControl: "31536000", upsert: false });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
    const publicUrl = admin.storage.from("yakout-media").getPublicUrl(imagePath).data.publicUrl;
    rows.push({ company_id: companyId, apartment_id: apartmentId, url: publicUrl, image_url: publicUrl, image_path: imagePath, alt_text: `Photo ${index + 1} de ${title}`, image_alt_text: `Photo ${index + 1} de ${title}`, display_order: (count ?? 0) + index, sort_order: (count ?? 0) + index, is_cover: (count ?? 0) === 0 && index === 0, storage_bucket: "yakout-media" });
  }
  if (rows.length) { const { error } = await admin.from("apartment_images").insert(rows); if (error) throw error; }
  return rows.length;
}

export async function confirmAirbnbImportAction(_state: AirbnbConfirmationState, formData: FormData): Promise<AirbnbConfirmationState> {
  try {
    const { admin, user, companyId } = await authContext();
    const extraction = JSON.parse(String(formData.get("extraction") ?? "{}"));
    const selectedPhotoUrls = formData.getAll("photos").map(String);
    const parsed = airbnbImportConfirmationSchema.parse({ extraction, contentHash: formData.get("contentHash"), ownerId: formData.get("ownerId"), title: formData.get("title"), city: formData.get("city"), propertyType: formData.get("propertyType"), shortDescription: formData.get("shortDescription"), mode: formData.get("mode"), imageRightsConfirmed: formData.get("imageRightsConfirmed") === "on", selectedPhotoUrls, pricePerNight: formData.get("pricePerNight") ? Number(formData.get("pricePerNight")) : null, currency: formData.get("currency") || "MAD" });
    const { data: owner } = await admin.from("owners").select("id").eq("id", parsed.ownerId).eq("company_id", companyId).maybeSingle();
    if (!owner) throw new Error("Propriétaire invalide.");
    const { data: existing } = await admin.from("apartments").select("id,slug").eq("company_id", companyId).eq("source_platform", "airbnb").eq("source_listing_id", parsed.extraction.source.listingId).maybeSingle();
    if (existing && parsed.mode === "create") throw new Error("Cette annonce est déjà importée. Choisissez Compléter les champs vides ou Mise à jour sélective.");
    const payload = { company_id: companyId, owner_id: parsed.ownerId, internal_name: parsed.title, public_name: parsed.title, property_type: parsed.propertyType, city: parsed.city, district: parsed.extraction.location.district, public_district: parsed.extraction.location.district, capacity: parsed.extraction.capacity.maxGuests ?? 0, bedrooms: parsed.extraction.capacity.bedrooms ?? 0, beds: parsed.extraction.capacity.beds, bathrooms: parsed.extraction.capacity.bathrooms ?? 0, short_description: parsed.shortDescription, detailed_description: parsed.extraction.descriptions.summary, description: parsed.extraction.descriptions.summary, amenities: parsed.extraction.amenities.available.map((item) => item.sourceLabel).slice(0, 12), house_rules: parsed.extraction.rules.additionalRules.slice(0, 12), price_per_night: parsed.pricePerNight, price_from: parsed.pricePerNight ?? 0, currency: parsed.currency, public_status: "draft", is_published: false, management_status: "info_missing", source_platform: "airbnb", source_listing_id: parsed.extraction.source.listingId, source_url: parsed.extraction.source.url, source_imported_at: new Date().toISOString() };
    let apartmentId: string;
    if (existing) { const updates = parsed.mode === "fill_empty" ? Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== 0)) : payload; const { error } = await admin.from("apartments").update(updates).eq("id", existing.id).eq("company_id", companyId); if (error) throw error; apartmentId = existing.id; }
    else { const { data, error } = await admin.from("apartments").insert({ ...payload, slug: await uniqueSlug(admin, parsed.title) }).select("id").single(); if (error) throw error; apartmentId = data.id; }
    const photosImported = parsed.imageRightsConfirmed ? await importSelectedPhotos(admin, apartmentId, companyId, parsed.title, parsed.selectedPhotoUrls) : 0;
    const { error: importError } = await admin.from("apartment_imports").upsert({ company_id: companyId, apartment_id: apartmentId, source_platform: "airbnb", source_listing_id: parsed.extraction.source.listingId, source_url: parsed.extraction.source.url, import_status: "completed", extraction_snapshot: parsed.extraction, mapped_payload: { ...payload, photos_imported: photosImported }, warnings: parsed.extraction.warnings, missing_fields: parsed.extraction.missingFields, content_hash: parsed.contentHash, created_by: user.id, confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString() }, { onConflict: "company_id,source_platform,source_listing_id,content_hash" });
    if (importError) throw importError;
    revalidatePath("/dashboard/apartments"); revalidatePath(`/dashboard/apartments/${apartmentId}`); revalidatePath(`/dashboard/owners/${parsed.ownerId}`);
    return { apartmentId };
  } catch (error) { return { error: error instanceof Error ? error.message : "Import impossible." }; }
}
