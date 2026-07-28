"use server";

import { revalidatePath } from "next/cache";
import { createHash, randomUUID } from "node:crypto";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug";
import { airbnbImportConfirmationSchema, airbnbUrlSchema } from "./schemas";
import { buildShortDescription, extractionContentHash, mapPropertyType } from "./normalization";
import type { AirbnbListingExtraction } from "./types";
import { AirbnbImportError, normalizeAirbnbConfirmationError, normalizeAirbnbError, type AirbnbConfirmationStage } from "./errors";
import { runAirbnbAnalysis } from "./action-runner.server";

type AirbnbPreview = { extraction: AirbnbListingExtraction; contentHash: string; generatedShortDescription: string; mappedPropertyType: string; partial: boolean; warnings: string[] };
export type AirbnbAnalysisState =
  | null
  | { success: true; data: AirbnbListingExtraction; partial: boolean; warnings: string[]; requestId: string; sourceUrl: string; listingId: string; preview: AirbnbPreview }
  | { success: false; code: string; message: string; requestId: string; retryable: boolean; sourceUrl?: string; listingId?: string };
export type AirbnbConfirmationState = { error?: string; errorCode?: string; requestId?: string; apartmentId?: string; photosDetected?: number; photosSelected?: number; photosUploaded?: number; photosFailed?: number; warnings?: string[] };

async function importPermissionContext() {
  let client: Awaited<ReturnType<typeof createSupabaseActionClient>>;
  try {
    client = await createSupabaseActionClient();
  } catch (error) {
    throw new AirbnbImportError("AIRBNB_PROFILE_UNAVAILABLE", error instanceof Error ? error.message : String(error), "authentication", 503, true, { cause: error });
  }
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    throw new AirbnbImportError("AIRBNB_AUTH_REQUIRED", userError?.message ?? "No authenticated user", "authentication", 401, false, { cause: userError });
  }
  const { data: profile, error: profileError } = await client.from("profiles").select("company_id,role").eq("user_id", user.id).single();
  if (profileError) {
    throw new AirbnbImportError("AIRBNB_PROFILE_UNAVAILABLE", profileError.message, "authorization", 503, true, { cause: profileError });
  }
  if (!profile?.company_id || !["admin", "manager"].includes(profile.role)) {
    throw new AirbnbImportError("AIRBNB_AUTHORIZATION_FAILED", "User is not an admin or manager with a company", "authorization", 403, false);
  }
  console.info("[airbnb-import] permission verified", { userId: user.id, companyId: profile.company_id, role: profile.role });
  return { user, companyId: profile.company_id as string };
}

export async function analyzeAirbnbAction(_state: AirbnbAnalysisState, formData: FormData): Promise<AirbnbAnalysisState> {
  const requestId = randomUUID();
  const rawUrl = String(formData.get("url") ?? "");
  try {
    console.info("[airbnb-import] server action started", { requestId });
    await importPermissionContext();
    console.info("[airbnb-import] server action authorization completed", { requestId });
    const url = airbnbUrlSchema.parse(rawUrl);
    console.info("[airbnb-import] server action validation completed", { requestId });
    return await runAirbnbAnalysis(url, requestId);
  } catch (error) {
    const normalized = normalizeAirbnbError(error);
    console.error("[airbnb-import] server action failed", { requestId, code: normalized.code, stage: normalized.stage, name: error instanceof Error ? error.name : undefined, message: error instanceof Error ? error.message : String(error), cause: error instanceof Error && "cause" in error ? String(error.cause) : undefined, stack: error instanceof Error ? error.stack : undefined });
    return { success: false, code: normalized.code, message: normalized.publicMessage, requestId, retryable: normalized.retryable, sourceUrl: rawUrl };
  }
}

export async function analyzeAirbnbHtmlAction(_state: AirbnbAnalysisState, formData: FormData): Promise<AirbnbAnalysisState> {
  try {
    await importPermissionContext();
    const url = String(formData.get("url") ?? "").trim();
    const rawHtml = String(formData.get("rawHtml") ?? "").trim();
    if (!rawHtml) throw new Error("Collez le code source de l'annonce.");
    const { extractAirbnbListingFromHtml } = await import("./extraction.server");
    const extraction = await extractAirbnbListingFromHtml(rawHtml, url);
    extraction.raw = { jsonLd: extraction.raw.jsonLd, extractedTexts: {} };
    return { success: true, data: extraction, partial: extraction.missingFields.length > 0, warnings: extraction.warnings, requestId: randomUUID(), sourceUrl: url, listingId: extraction.source.listingId, preview: { extraction, contentHash: extractionContentHash(extraction), generatedShortDescription: buildShortDescription(extraction), mappedPropertyType: mapPropertyType(extraction.identity.propertyTypeLabel, extraction.identity.roomType), partial: extraction.missingFields.length > 0, warnings: extraction.warnings } };
  } catch (error) {
    const normalized = normalizeAirbnbError(error);
    return { success: false, code: normalized.code, message: normalized.publicMessage, requestId: randomUUID(), retryable: normalized.retryable };
  }
}

async function uniqueSlug(admin: ReturnType<typeof createSupabaseAdminClient>, title: string) {
  const base = slugify(title) || "appartement-airbnb"; let candidate = base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const { data, error } = await admin.from("apartments").select("id").eq("slug", candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function isAllowedAirbnbPhotoUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "a0.muscache.com" && /^\/im\/pictures\//.test(url.pathname) && !/\.svg$/i.test(url.pathname); } catch { return false; } }
async function importSelectedPhotos(admin: ReturnType<typeof createSupabaseAdminClient>, apartmentId: string, companyId: string, title: string, urls: string[]) {
  if (!urls.length) return { uploaded: 0, failed: 0, warnings: [] as string[] };
  const { count, error: countError } = await admin.from("apartment_images").select("id", { count: "exact", head: true }).eq("apartment_id", apartmentId);
  if (countError) throw countError;
  const availableSlots = Math.max(0, 6 - (count ?? 0));
  const rows: Array<Record<string, unknown>> = [];
  const warnings: string[] = [];
  for (const [index, url] of urls.slice(0, availableSlots).entries()) {
    try {
    if (!isAllowedAirbnbPhotoUrl(url)) throw new Error("Hôte ou chemin photo non autorisé.");
    console.info("[airbnb-import] photo download started", { apartmentId, index });
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!response.ok || !isAllowedAirbnbPhotoUrl(response.url)) throw new Error(`Téléchargement photo impossible (${response.status}).`);
    const mime = (response.headers.get("content-type") ?? "").split(";")[0];
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(mime)) throw new Error(`Format photo non autorisé : ${mime || "inconnu"}.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Une photo Airbnb dépasse 5 MB.");
    const hash = createHash("sha256").update(bytes).digest("hex");
    const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/avif" ? "avif" : "jpg";
    const imagePath = `apartments/${apartmentId}/airbnb-import/${hash}.${extension}`;
    const { error: uploadError } = await admin.storage.from("yakout-media").upload(imagePath, bytes, { contentType: mime, cacheControl: "31536000", upsert: false });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
    const publicUrl = admin.storage.from("yakout-media").getPublicUrl(imagePath).data.publicUrl;
    rows.push({ company_id: companyId, apartment_id: apartmentId, url: publicUrl, image_url: publicUrl, image_path: imagePath, alt_text: `Photo ${index + 1} de ${title}`, image_alt_text: `Photo ${index + 1} de ${title}`, display_order: (count ?? 0) + index, sort_order: (count ?? 0) + index, is_cover: (count ?? 0) === 0 && index === 0, storage_bucket: "yakout-media" });
    console.info("[airbnb-import] photo uploaded", { apartmentId, index });
    } catch (error) { warnings.push(`Photo ${index + 1} non importée : ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (rows.length) { const { error } = await admin.from("apartment_images").insert(rows); if (error) throw error; }
  return { uploaded: rows.length, failed: urls.slice(0, availableSlots).length - rows.length, warnings };
}

export async function confirmAirbnbImportAction(_state: AirbnbConfirmationState, formData: FormData): Promise<AirbnbConfirmationState> {
  const requestId = randomUUID();
  let stage: AirbnbConfirmationStage = "validation";
  console.info("[airbnb-import] confirmation started", { requestId, stage });
  try {
    const { user, companyId } = await importPermissionContext();
    const admin = createSupabaseAdminClient();
    const extraction = JSON.parse(String(formData.get("extraction") ?? "{}"));
    const selectedPhotoUrls = formData.getAll("photos").map(String);
    const parsed = airbnbImportConfirmationSchema.parse({ extraction, contentHash: formData.get("contentHash"), ownerId: formData.get("ownerId"), title: formData.get("title"), city: formData.get("city"), propertyType: formData.get("propertyType"), shortDescription: formData.get("shortDescription"), mode: formData.get("mode"), imageRightsConfirmed: formData.get("imageRightsConfirmed") === "on", selectedPhotoUrls, pricePerNight: formData.get("pricePerNight") ? Number(formData.get("pricePerNight")) : null, currency: formData.get("currency") || "MAD" });
    stage = "owner-verification";
    const { data: owner, error: ownerError } = await admin.from("owners").select("id").eq("id", parsed.ownerId).eq("company_id", companyId).maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner) throw new Error("Propriétaire invalide.");
    stage = "duplicate-check";
    const { data: existing, error: existingError } = await admin.from("apartments").select("id,slug").eq("company_id", companyId).eq("source_platform", "airbnb").eq("source_listing_id", parsed.extraction.source.listingId).maybeSingle();
    if (existingError) throw existingError;
    if (existing && parsed.mode === "create") throw new Error("Cette annonce est déjà importée. Choisissez Compléter les champs vides ou Mise à jour sélective.");
    const payload = { company_id: companyId, owner_id: parsed.ownerId, internal_name: parsed.title, public_name: parsed.title, property_type: parsed.propertyType, city: parsed.city, district: parsed.extraction.location.district, public_district: parsed.extraction.location.district, capacity: parsed.extraction.capacity.maxGuests ?? 0, bedrooms: parsed.extraction.capacity.bedrooms ?? 0, beds: parsed.extraction.capacity.beds, bathrooms: parsed.extraction.capacity.bathrooms ?? 0, short_description: parsed.shortDescription, detailed_description: parsed.extraction.descriptions.summary, description: parsed.extraction.descriptions.summary, amenities: parsed.extraction.amenities.available.map((item) => item.sourceLabel).slice(0, 12), house_rules: parsed.extraction.rules.additionalRules.slice(0, 12), price_per_night: parsed.pricePerNight, price_from: parsed.pricePerNight ?? 0, currency: parsed.currency, public_status: "draft", is_published: false, management_status: "info_missing", source_platform: "airbnb", source_listing_id: parsed.extraction.source.listingId, source_url: parsed.extraction.source.url, source_imported_at: new Date().toISOString() };
    stage = "apartment-write";
    let apartmentId: string;
    if (existing) { const updates = parsed.mode === "fill_empty" ? Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== 0)) : payload; const { error } = await admin.from("apartments").update(updates).eq("id", existing.id).eq("company_id", companyId); if (error) throw error; apartmentId = existing.id; }
    else { const { data, error } = await admin.from("apartments").insert({ ...payload, slug: await uniqueSlug(admin, parsed.title) }).select("id").single(); if (error) throw error; apartmentId = data.id; }
    const allowedExtractedPhotos = new Set(parsed.extraction.photos.map((photo) => photo.highResolutionUrl));
    if (parsed.selectedPhotoUrls.some((url) => !allowedExtractedPhotos.has(url))) throw new Error("Une photo sélectionnée ne provient pas de l’analyse validée.");
    stage = "photo-import";
    const photoResult = parsed.imageRightsConfirmed ? await importSelectedPhotos(admin, apartmentId, companyId, parsed.title, parsed.selectedPhotoUrls) : { uploaded: 0, failed: 0, warnings: [] as string[] };
    stage = "import-audit";
    const { error: importError } = await admin.from("apartment_imports").upsert({ company_id: companyId, apartment_id: apartmentId, source_platform: "airbnb", source_listing_id: parsed.extraction.source.listingId, source_url: parsed.extraction.source.url, import_status: "completed", extraction_snapshot: parsed.extraction, mapped_payload: { ...payload, photos_imported: photoResult.uploaded }, warnings: [...parsed.extraction.warnings, ...photoResult.warnings], missing_fields: parsed.extraction.missingFields, content_hash: parsed.contentHash, created_by: user.id, confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString() }, { onConflict: "company_id,source_platform,source_listing_id,content_hash" });
    if (importError) throw importError;
    revalidatePath("/dashboard/apartments"); revalidatePath(`/dashboard/apartments/${apartmentId}`); revalidatePath(`/dashboard/owners/${parsed.ownerId}`);
    console.info("[airbnb-import] import completed", { apartmentId, photosDetected: parsed.extraction.photos.length, photosSelected: parsed.selectedPhotoUrls.length, uploadedPhotoCount: photoResult.uploaded, warningCount: photoResult.warnings.length });
    return { requestId, apartmentId, photosDetected: parsed.extraction.photos.length, photosSelected: parsed.selectedPhotoUrls.length, photosUploaded: photoResult.uploaded, photosFailed: photoResult.failed, warnings: photoResult.warnings };
  } catch (error) {
    const normalized = normalizeAirbnbConfirmationError(error, stage);
    let listingId: string | undefined;
    try { listingId = JSON.parse(String(formData.get("extraction") ?? "{}"))?.source?.listingId; } catch { listingId = undefined; }
    console.error("[airbnb-import] confirmation failed", {
      requestId,
      stage: normalized.stage,
      code: normalized.code,
      message: normalized.internalMessage,
      listingId,
    });
    return { error: normalized.publicMessage, errorCode: normalized.code, requestId };
  }
}
