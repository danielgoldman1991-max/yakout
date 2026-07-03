"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeUuid } from "@/lib/utils/uuid";
import { slugify } from "@/lib/utils/slug";
import { normalizeStringArray } from "@/lib/utils/lists";
import { logger } from "@/lib/utils/logger";
import { canPublishApartmentWithCounts, MAX_APARTMENT_IMAGES } from "@/lib/data/apartments";
import {
  leadSchema, clientSchema, apartmentSchema, vehicleSchema,
  reservationSchema, tripSchema, transferSchema, partnerSchema, packageSchema, paymentSchema,
  expenseSchema, documentSchema, blogPostSchema, serviceSchema, sitePageSchema,
  clientNoteSchema, clientFollowupSchema, clientReviewSchema,
} from "@/lib/validations/schemas";

async function getClient() {
  return createSupabaseActionClient();
}

function isDemo(): boolean {
  return !hasSupabaseEnv();
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return uuidRegex.test(value);
}

function requireValidUUID(value: string, label: string): void {
  if (!isValidUUID(value)) {
    throw new Error(`ID ${label} invalide. L'identifiant n'est pas un UUID valide.`);
  }
}

async function getCurrentCompanyId() {
  const supabase = await getClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.error("getCurrentCompanyId failed", userError ?? new Error("Utilisateur non connecte."));
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("profiles").select("company_id").eq("user_id", user.id).single();
  if (error) {
    logger.error("getCurrentCompanyId failed", error);
    return null;
  }
  return data?.company_id as string | null;
}

async function insertWithCompany(table: string, input: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) return { error: new Error("Profil entreprise introuvable.") };
  return supabase.from(table).insert([{ ...input, company_id: companyId }]);
}

type ApartmentSubmitIntent = "save" | "draft" | "publish" | "pause";

function getApartmentSubmitIntent(formData: FormData): ApartmentSubmitIntent {
  const intent = String(formData.get("intent") ?? "save");
  if (intent === "draft" || intent === "publish" || intent === "pause") return intent;
  return "save";
}

function getRequestedApartmentPublicStatus(input: Record<string, unknown>, intent: ApartmentSubmitIntent) {
  if (intent === "draft") return "draft";
  if (intent === "publish") return "published";
  if (intent === "pause") return "paused";
  return String(input.public_status ?? (input.is_published ? "published" : "draft"));
}

function normalizeApartmentInput(
  input: Record<string, unknown> & { amenities?: string },
  publicStatusOverride?: string,
): Record<string, unknown> & { amenities: string[] } {
  const publicStatus = publicStatusOverride ?? String(input.public_status ?? (input.is_published ? "published" : "draft"));
  const price = input.price_per_night ?? input.price_from ?? 0;
  return {
    ...input,
    slug: typeof input.slug === "string" ? slugify(input.slug) : input.slug,
    owner_id: normalizeUuid(input.owner_id),
    public_status: publicStatus,
    is_published: publicStatus === "published",
    published_at: publicStatus === "published" ? (input.published_at || new Date().toISOString()) : null,
    price_from: price,
    price_per_night: price,
    public_district: input.public_district || input.district,
    detailed_description: input.detailed_description || input.description,
    description: input.description || input.detailed_description,
    amenities: normalizeStringArray(input.amenities as string | string[] | undefined).slice(0, 12),
    highlights: normalizeStringArray(input.highlights as string | string[] | undefined).slice(0, 6),
    house_rules: normalizeStringArray(input.house_rules as string | string[] | undefined).slice(0, 12),
  };
}

function getApartmentCoreInput(input: Record<string, unknown> & { amenities?: string[] }) {
  return {
    internal_name: input.internal_name,
    public_name: input.public_name,
    internal_reference: input.internal_reference,
    slug: input.slug,
    district: input.district,
    city: input.city || "Marrakech",
    public_district: input.public_district || input.district,
    address_private: input.address_private,
    address_public_hint: input.address_public_hint,
    map_area: input.map_area,
    property_type: input.property_type,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    beds: input.beds,
    capacity: input.capacity,
    floor: input.floor,
    has_elevator: input.has_elevator,
    surface_area: input.surface_area,
    has_terrace: input.has_terrace,
    has_pool: input.has_pool,
    has_parking: input.has_parking,
    price_from: input.price_from,
    price_per_night: input.price_per_night,
    currency: input.currency || "MAD",
    cleaning_fee: input.cleaning_fee,
    deposit_amount: input.deposit_amount,
    minimum_nights: input.minimum_nights,
    commission_rate: input.commission_rate,
    short_description: input.short_description,
    detailed_description: input.detailed_description,
    description: input.description,
    highlights: input.highlights,
    amenities: input.amenities,
    house_rules: input.house_rules,
    check_in_time: input.check_in_time,
    check_out_time: input.check_out_time,
    is_published: input.is_published,
    is_featured: input.is_featured,
    public_status: input.public_status,
    management_status: input.management_status,
    contract_status: input.contract_status,
    onboarding_status: input.onboarding_status,
    published_at: input.published_at,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
    owner_id: input.owner_id || null,
    access_instructions: input.access_instructions,
    cleaning_instructions: input.cleaning_instructions,
    wifi_name: input.wifi_name,
    wifi_password: input.wifi_password,
    maintenance_notes: input.maintenance_notes,
    internal_notes: input.internal_notes,
  };
}

function redirectApartmentError(message: string): never {
  redirect(`/dashboard/apartments/new?error=${encodeURIComponent(message)}`);
}

function firstValidationMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Formulaire incomplet.";
}

function databaseErrorMessage(error: { message?: string }) {
  const message = error.message ?? "Erreur de sauvegarde.";
  if (message.toLowerCase().includes("duplicate")) return "Cette valeur existe deja. Changez le slug ou l'identifiant.";
  if (message.toLowerCase().includes("permission")) return "Droits Supabase insuffisants pour sauvegarder.";
  return message;
}

function redirectFormError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function paymentFormPath(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirect_to") ?? "");
  return redirectTo.startsWith("/dashboard/") ? redirectTo : fallback;
}

function withoutKeys<T extends Record<string, unknown>>(input: T, keys: string[]) {
  const copy: Record<string, unknown> = { ...input };
  for (const key of keys) delete copy[key];
  return copy;
}

function normalizePaymentInput(input: Record<string, unknown>) {
  const paymentType = String(input.payment_type ?? "other");
  const source = input.source ? String(input.source) : paymentType === "accommodation" ? "direct" : null;
  return {
    ...withoutKeys(input, ["create_reservation", "total_amount"]),
    client_id: normalizeUuid(input.client_id),
    lead_id: normalizeUuid(input.lead_id),
    reservation_id: normalizeUuid(input.reservation_id),
    apartment_id: normalizeUuid(input.apartment_id),
    owner_id: normalizeUuid(input.owner_id),
    trip_id: normalizeUuid(input.trip_id),
    vehicle_id: normalizeUuid(input.vehicle_id),
    partner_id: normalizeUuid(input.partner_id),
    transfer_id: normalizeUuid(input.transfer_id),
    package_id: normalizeUuid(input.package_id),
    payment_type: paymentType,
    payment_part: input.payment_part || null,
    source,
    stay_check_in: input.stay_check_in || null,
    stay_check_out: input.stay_check_out || null,
    guests_count: input.guests_count || null,
    activity_type: input.activity_type || (paymentType === "accommodation" ? "apartment" : "other"),
    currency: input.currency || "MAD",
  };
}

function getApartmentImageFiles(formData: FormData): File[] {
  const values = [...formData.getAll("images"), ...formData.getAll("image_files")];
  const seen = new Set<string>();
  return values
    .filter((value): value is File => value instanceof File && value.size > 0)
    .filter((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function syncApartmentCover(supabase: ReturnType<typeof createSupabaseAdminClient>, apartmentId: string, companyId: string) {
  const { data: images } = await supabase
    .from("apartment_images")
    .select("*")
    .eq("apartment_id", apartmentId)
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });

  const sorted = (images ?? []).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) ||
    Number(a.sort_order ?? a.display_order ?? 0) - Number(b.sort_order ?? b.display_order ?? 0),
  );
  const cover = sorted.find((image: Record<string, unknown>) => image.is_cover) ?? sorted[0];
  await supabase.from("apartments").update({
    image_url: cover ? (cover.image_url ?? cover.url ?? null) : null,
    image_alt_text: cover ? (cover.image_alt_text ?? cover.alt_text ?? null) : null,
  }).eq("id", apartmentId).eq("company_id", companyId);
}

async function insertApartmentImages(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  apartmentId: string,
  companyId: string,
  files: File[],
  startOrder = 0,
) {
  if (files.length === 0) return;
  const { uploadApartmentImage, deleteApartmentImageFile } = await import("@/lib/storage");
  const rows = [];
  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const uploaded = await uploadApartmentImage(file, apartmentId);
    uploadedPaths.push(uploaded.filePath);
    rows.push({
      company_id: companyId,
      apartment_id: apartmentId,
      url: uploaded.publicUrl,
      image_url: uploaded.publicUrl,
      image_path: uploaded.filePath,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      image_alt_text: file.name.replace(/\.[^.]+$/, ""),
      display_order: startOrder + index,
      sort_order: startOrder + index,
      is_cover: startOrder + index === 0,
      storage_bucket: "yakout-media",
    });
  }
  const { error } = await supabase.from("apartment_images").insert(rows);
  if (error) {
    await Promise.all(uploadedPaths.map((path) => deleteApartmentImageFile(path).catch(() => {})));
    throw new Error(error.message);
  }
}

// ─── Leads ───

export async function updateLeadStatus(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "lead");
  const status = String(formData.get("status") ?? "");
  if (!status) { logger.warn("updateLeadStatus: statut vide", { id }); return; }
  if (isDemo()) { logger.error("updateLeadStatus: Supabase non configure"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) { logger.error("updateLeadStatus failed", error); return; }
  logger.info("Lead status updated", { id, status });
  revalidatePath("/dashboard/leads");
}

export async function deleteLeadAction(id: string): Promise<void> {
  requireValidUUID(id, "lead");
  if (isDemo()) { logger.error("deleteLeadAction: Supabase non configure"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) { logger.error("deleteLeadAction failed", error); return; }
  logger.info("Lead deleted", { id });
  revalidatePath("/dashboard/leads");
}

export async function updateLeadAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateLeadAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/leads/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { redirectFormError(`/dashboard/leads/${id}`, "Supabase n'est pas configure."); }
  const supabase = await getClient();
  const { error } = await supabase.from("leads").update(parsed.data).eq("id", id);
  if (error) { logger.error("updateLeadAction failed", error); redirectFormError(`/dashboard/leads/${id}`, databaseErrorMessage(error)); }
  logger.info("Lead updated", { id });
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${id}`);
}

export async function createLeadAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createLeadAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/leads/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { redirectFormError("/dashboard/leads/new", "Supabase n'est pas configure."); }
  const { error } = await insertWithCompany("leads", { ...parsed.data, status: "new" });
  if (error) { logger.error("createLeadAction failed", error); redirectFormError("/dashboard/leads/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

// ─── Clients ───

export async function updateClientAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "client");
  const raw = Object.fromEntries(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateClientAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/clients/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateClientAction", { id, ...parsed.data }); revalidatePath("/dashboard/clients"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  if (error) { logger.error("updateClientAction failed", error); redirectFormError(`/dashboard/clients/${id}`, databaseErrorMessage(error)); }
  logger.info("Client updated", { id });
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
}

export async function createClientAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createClientAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/clients/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createClientAction", parsed.data); revalidatePath("/dashboard/clients"); redirect("/dashboard/clients"); }
  const { error } = await insertWithCompany("clients", parsed.data);
  if (error) { logger.error("createClientAction failed", error); redirectFormError("/dashboard/clients/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-_().]/g, "").replace(/^00212/, "+212").replace(/^0/, "+212");
}

export async function convertLeadToClientAction(leadId: string): Promise<void> {
  requireValidUUID(leadId, "lead");
  if (!hasSupabaseEnv()) { logger.error("convertLeadToClientAction: Supabase non configure"); redirectFormError(`/dashboard/leads/${leadId}`, "Supabase n'est pas configure."); }

  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin.from("leads").select("*").eq("id", leadId).single();
  if (leadError || !lead) {
    logger.error("convertLeadToClientAction: lead introuvable", leadError ?? new Error("lead null"));
    redirectFormError(`/dashboard/leads/${leadId}`, "Lead introuvable.");
  }

  if (lead.client_id) {
    redirect(`/dashboard/clients/${lead.client_id}`);
  }

  const companyId = lead.company_id;
  if (!companyId) {
    logger.error("convertLeadToClientAction: company_id manquant", { leadId });
    redirectFormError(`/dashboard/leads/${leadId}`, "Aucune entreprise rattachee a ce lead.");
  }

  // Anti-doublon: chercher client existant par email ou telephone
  let existingClient = null;
  if (lead.email) {
    const { data } = await admin.from("clients").select("*").eq("email", lead.email).maybeSingle();
    existingClient = data;
  }
  if (!existingClient && lead.phone) {
    const normalizedPhone = normalizePhone(lead.phone);
    const { data } = await admin.from("clients").select("*").eq("phone", normalizedPhone).maybeSingle();
    existingClient = data;
  }

  let clientId: string;

  if (existingClient) {
    clientId = existingClient.id;
    logger.info("Client existant trouve pour lead", { leadId, clientId });
  } else {
    const { data: newClient, error: createError } = await admin.from("clients").insert([{
      company_id: companyId,
      full_name: lead.name,
      phone: normalizePhone(lead.phone),
      email: lead.email || null,
      acquisition_source: lead.source || "Site web",
      notes: lead.message || null,
    }]).select("id");

    if (createError || !newClient || newClient.length === 0) {
      const detail = createError?.message ?? "Aucune donnee retournee";
      logger.error("convertLeadToClientAction: creation client echouee", { detail, leadId });
      redirectFormError(`/dashboard/leads/${leadId}`, "Echec creation client: " + detail);
    }
    clientId = newClient[0].id;

    try {
      await admin.from("client_interactions").insert([{
        company_id: companyId,
        client_id: clientId,
        type: "lead_conversion",
        channel: "interne",
        subject: "Conversion lead → client",
        content: `Converti depuis le lead. Type: ${lead.request_type}. Message: ${lead.message || "N/A"}`,
        direction: "internal",
        status: "done",
      }]);
    } catch (_interactionErr) {
      logger.warn("Impossible d ecrire dans client_interactions", _interactionErr);
    }
  }

  const { error: updateError } = await admin.from("leads").update({
    client_id: clientId,
    status: "Confirme",
  }).eq("id", leadId);

  if (updateError) {
    logger.error("convertLeadToClientAction: mise a jour lead echouee", updateError);
    redirectFormError(`/dashboard/leads/${leadId}`, "Lead cree mais echec mise a jour: " + updateError.message);
  }

  logger.info("Lead converti en client", { leadId, clientId });
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${clientId}`);
}

export async function deleteClientAction(id: string): Promise<void> {
  requireValidUUID(id, "client");
  if (isDemo()) { logger.info("[DEMO] deleteClientAction", { id }); revalidatePath("/dashboard/clients"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) { logger.error("deleteClientAction failed", error); return; }
  revalidatePath("/dashboard/clients");
}

export async function createClientNoteAction(clientId: string, formData: FormData): Promise<void> {
  requireValidUUID(clientId, "client");
  const parsed = clientNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirectFormError(`/dashboard/clients/${clientId}`, firstValidationMessage(parsed.error));
  if (isDemo()) redirectFormError(`/dashboard/clients/${clientId}`, "Supabase n'est pas configure.");
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(`/dashboard/clients/${clientId}`, "Profil entreprise introuvable.");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("client_notes").insert([{ ...parsed.data, client_id: clientId, company_id: companyId }]);
  if (error) redirectFormError(`/dashboard/clients/${clientId}`, databaseErrorMessage(error));
  await supabase.from("client_interactions").insert([{
    client_id: clientId,
    company_id: companyId,
    type: "note",
    channel: "interne",
    subject: "Note interne",
    content: parsed.data.note,
    direction: "internal",
    status: "done",
  }]);
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function createClientFollowupAction(clientId: string, formData: FormData): Promise<void> {
  requireValidUUID(clientId, "client");
  const parsed = clientFollowupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirectFormError(`/dashboard/clients/${clientId}`, firstValidationMessage(parsed.error));
  if (isDemo()) redirectFormError(`/dashboard/clients/${clientId}`, "Supabase n'est pas configure.");
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(`/dashboard/clients/${clientId}`, "Profil entreprise introuvable.");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("client_followups").insert([{ ...parsed.data, client_id: clientId, company_id: companyId }]);
  if (error) redirectFormError(`/dashboard/clients/${clientId}`, databaseErrorMessage(error));
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function markClientFollowupDoneAction(clientId: string, followupId: string): Promise<void> {
  requireValidUUID(clientId, "client");
  requireValidUUID(followupId, "relance");
  if (isDemo()) redirectFormError(`/dashboard/clients/${clientId}`, "Supabase n'est pas configure.");
  const supabase = await getClient();
  const { error } = await supabase.from("client_followups").update({ status: "done" }).eq("id", followupId).eq("client_id", clientId);
  if (error) redirectFormError(`/dashboard/clients/${clientId}`, databaseErrorMessage(error));
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function postponeClientFollowupAction(clientId: string, followupId: string): Promise<void> {
  requireValidUUID(clientId, "client");
  requireValidUUID(followupId, "relance");
  if (isDemo()) redirectFormError(`/dashboard/clients/${clientId}`, "Supabase n'est pas configure.");
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dueDate = nextWeek.toISOString().slice(0, 10);
  const supabase = await getClient();
  const { error } = await supabase.from("client_followups").update({ due_date: dueDate, status: "open" }).eq("id", followupId).eq("client_id", clientId);
  if (error) redirectFormError(`/dashboard/clients/${clientId}`, databaseErrorMessage(error));
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function saveClientReviewAction(clientId: string, formData: FormData): Promise<void> {
  requireValidUUID(clientId, "client");
  const parsed = clientReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirectFormError(`/dashboard/clients/${clientId}`, firstValidationMessage(parsed.error));
  if (isDemo()) redirectFormError(`/dashboard/clients/${clientId}`, "Supabase n'est pas configure.");
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(`/dashboard/clients/${clientId}`, "Profil entreprise introuvable.");
  const now = new Date().toISOString();
  const payload = {
    ...parsed.data,
    client_id: clientId,
    company_id: companyId,
    requested_at: parsed.data.status === "requested" ? now : null,
    received_at: parsed.data.status === "received" ? now : null,
  };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("client_reviews").insert([payload]);
  if (error) redirectFormError(`/dashboard/clients/${clientId}`, databaseErrorMessage(error));
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

// ─── Apartments ───

export async function createApartmentAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = apartmentSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Formulaire incomplet.";
    logger.warn("createApartmentAction: validation echec", parsed.error.flatten());
    redirectApartmentError(firstError);
  }
  if (isDemo()) { logger.info("[DEMO] createApartmentAction", parsed.data); revalidatePath("/dashboard/apartments"); redirect("/dashboard/apartments"); }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    logger.error("createApartmentAction failed", new Error("Profil entreprise introuvable."));
    redirectApartmentError("Profil entreprise introuvable. Reconnectez Maria puis reessayez.");
  }

  const supabase = createSupabaseAdminClient();
  const intent = getApartmentSubmitIntent(formData);
  const requestedPublicStatus = getRequestedApartmentPublicStatus(parsed.data, intent);
  const normalized = normalizeApartmentInput(parsed.data, requestedPublicStatus);
  const { image_url, image_alt_text, owner_id } = normalized;
  const imageFiles = getApartmentImageFiles(formData);
  console.log("[Apartment images]", { count: imageFiles.length, names: imageFiles.map((file) => file.name) });
  if (imageFiles.length > MAX_APARTMENT_IMAGES) {
    redirectApartmentError("Maximum 6 photos par appartement.");
  }
  const existingImagesCount = typeof image_url === "string" && image_url ? 1 : 0;
  const publishCheck = canPublishApartmentWithCounts(normalized as never, existingImagesCount, imageFiles.length);
  if (requestedPublicStatus === "published" && !publishCheck.ok) {
    redirectApartmentError(`Impossible de publier : ${publishCheck.missing.join(", ")}.`);
  }
  const shouldPublishAfterImages = requestedPublicStatus === "published";
  const insertInput = shouldPublishAfterImages
    ? { ...normalized, public_status: "ready", is_published: false, published_at: null }
    : normalized;

  const { data: apartment, error } = await supabase
    .from("apartments")
    .insert([{ ...getApartmentCoreInput(insertInput), image_url: image_url || null, image_alt_text: image_alt_text || null, company_id: companyId }])
    .select("id")
    .single();

  if (error) {
    logger.error("createApartmentAction failed", error);
    redirectApartmentError(error.message.includes("duplicate") ? "Ce slug existe deja. Changez le slug de l'appartement." : error.message);
  }

  if (apartment?.id && imageFiles.length > 0) {
    try {
      await insertApartmentImages(supabase, apartment.id, companyId, imageFiles, 0);
    } catch (imageError) {
      logger.warn("createApartmentAction image upload failed", imageError);
      redirect(`/dashboard/apartments/${apartment.id}?error=${encodeURIComponent("Appartement cree, mais l'upload photo a echoue. Ajoutez les photos depuis cette fiche.")}`);
    }
  } else if (apartment?.id && typeof image_url === "string" && image_url) {
    const { error: imageError } = await supabase.from("apartment_images").insert([{
      company_id: companyId,
      apartment_id: apartment.id,
      url: image_url,
      image_url,
      alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      image_alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      display_order: 0,
      sort_order: 0,
      is_cover: true,
      storage_bucket: "yakout-media",
    }]);

    if (imageError) {
      logger.warn("createApartmentAction image attach failed", imageError);
    }
  }
  if (apartment?.id) await syncApartmentCover(supabase, apartment.id, companyId);
  if (apartment?.id && shouldPublishAfterImages) {
    const publishedAt = new Date().toISOString();
    const { error: publishError } = await supabase
      .from("apartments")
      .update({ public_status: "published", is_published: true, published_at: publishedAt })
      .eq("id", apartment.id)
      .eq("company_id", companyId);
    if (publishError) {
      logger.error("createApartmentAction publish failed", publishError);
      redirect(`/dashboard/apartments/${apartment.id}?error=${encodeURIComponent(databaseErrorMessage(publishError))}`);
    }
  }

  revalidatePath("/dashboard/apartments");
  revalidatePath("/apartments");

  if (owner_id && typeof owner_id === "string" && isValidUUID(owner_id)) {
    redirect(`/dashboard/owners/${owner_id}?tab=properties`);
  }

  redirect(apartment?.id ? `/dashboard/apartments/${apartment.id}` : "/dashboard/apartments");
}

export async function updateApartmentAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "appartement");
  const raw = Object.fromEntries(formData);
  const parsed = apartmentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateApartmentAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/apartments/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateApartmentAction", { id, ...parsed.data }); revalidatePath("/dashboard/apartments"); return; }
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    logger.error("updateApartmentAction failed", new Error("Profil entreprise introuvable."));
    redirectFormError(`/dashboard/apartments/${id}`, "Profil entreprise introuvable. Reconnectez Maria puis reessayez.");
  }

  const supabase = createSupabaseAdminClient();
  const intent = getApartmentSubmitIntent(formData);
  const requestedPublicStatus = getRequestedApartmentPublicStatus(parsed.data, intent);
  const normalized = normalizeApartmentInput(parsed.data, requestedPublicStatus);
  const { data: currentApartment } = await supabase.from("apartments").select("slug, image_url").eq("id", id).single();
  const { image_url, image_alt_text } = normalized;
  const files = getApartmentImageFiles(formData);
  console.log("[Apartment images]", { count: files.length, names: files.map((file) => file.name) });
  const existingImageIds = String(formData.get("existing_image_ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const galleryTouched = formData.has("gallery_touched");
  const coverImageId = String(formData.get("cover_image_id") ?? "");
  const { data: currentImages } = await supabase
    .from("apartment_images")
    .select("*")
    .eq("apartment_id", id)
    .eq("company_id", companyId);
  const retainedCount = galleryTouched ? existingImageIds.length : (currentImages ?? []).length;
  const legacyImageCount = !galleryTouched && retainedCount === 0 && Boolean(image_url || currentApartment?.image_url) ? 1 : 0;
  const existingImagesAfterSave = retainedCount + legacyImageCount;
  const totalImagesAfterSave = existingImagesAfterSave + files.length;
  if (totalImagesAfterSave > MAX_APARTMENT_IMAGES) {
    redirectFormError(`/dashboard/apartments/${id}`, "Maximum 6 photos par appartement.");
  }
  const publishCheck = canPublishApartmentWithCounts(normalized as never, existingImagesAfterSave, files.length);
  if (requestedPublicStatus === "published" && !publishCheck.ok) {
    redirectFormError(`/dashboard/apartments/${id}`, `Impossible de publier : ${publishCheck.missing.join(", ")}.`);
  }
  const shouldPublishAfterImages = requestedPublicStatus === "published";
  const updateInput = shouldPublishAfterImages
    ? { ...normalized, public_status: "ready", is_published: false, published_at: null }
    : normalized;
  const { error } = await supabase
    .from("apartments")
    .update(getApartmentCoreInput(updateInput))
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) { logger.error("updateApartmentAction failed", error); redirectFormError(`/dashboard/apartments/${id}`, databaseErrorMessage(error)); }

  if (galleryTouched) {
    if (existingImageIds.length > 0) {
      await supabase.from("apartment_images").delete().eq("apartment_id", id).eq("company_id", companyId).not("id", "in", `(${existingImageIds.join(",")})`);
    } else if (!currentImages || currentImages.length === 0) {
      await supabase.from("apartment_images").delete().eq("apartment_id", id).eq("company_id", companyId);
    }
    for (const [index, imageId] of existingImageIds.entries()) {
      await supabase.from("apartment_images").update({
        display_order: index,
        sort_order: index,
        is_cover: coverImageId ? imageId === coverImageId : index === 0,
      }).eq("id", imageId).eq("apartment_id", id).eq("company_id", companyId);
    }
  }

  if (files.length > 0) {
    try {
      await insertApartmentImages(supabase, id, companyId, files, retainedCount);
    } catch (imageError) {
      logger.warn("updateApartmentAction image upload failed", imageError);
      redirectFormError(`/dashboard/apartments/${id}`, "Appartement enregistre, mais l'upload photo a echoue.");
    }
  } else if ((currentImages ?? []).length === 0 && typeof image_url === "string" && image_url) {
    const { error: imageError } = await supabase.from("apartment_images").insert([{
      company_id: companyId,
      apartment_id: id,
      url: image_url,
      image_url,
      alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      image_alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      display_order: 0,
      sort_order: 0,
      is_cover: true,
      storage_bucket: "yakout-media",
    }]);
    if (imageError) logger.warn("updateApartmentAction image attach failed", imageError);
  }
  await syncApartmentCover(supabase, id, companyId);
  if (shouldPublishAfterImages) {
    const publishedAt = new Date().toISOString();
    const { error: publishError } = await supabase
      .from("apartments")
      .update({ public_status: "published", is_published: true, published_at: publishedAt })
      .eq("id", id)
      .eq("company_id", companyId);
    if (publishError) {
      logger.error("updateApartmentAction publish failed", publishError);
      redirectFormError(`/dashboard/apartments/${id}`, databaseErrorMessage(publishError));
    }
  }

  redirect(`/dashboard/apartments/${id}?saved=1`);
}

export async function deleteApartmentAction(id: string): Promise<void> {
  requireValidUUID(id, "appartement");
  if (isDemo()) { logger.info("[DEMO] deleteApartmentAction", { id }); revalidatePath("/dashboard/apartments"); redirect("/dashboard/apartments"); }
  const supabase = await getClient();
  const { error } = await supabase.from("apartments").delete().eq("id", id);
  if (error) { logger.error("deleteApartmentAction failed", error); return; }
  revalidatePath("/dashboard/apartments");
  redirect("/dashboard/apartments");
}

// ─── Vehicles ───

function normalizeVehicleInput(input: Record<string, unknown>) {
  const publicStatus = String(input.public_status ?? (input.is_published ? "published" : "draft"));
  const priceFrom = input.price_from || input.price_transfer || 0;
  const ownershipType = String(input.ownership_type ?? "partner");
  return {
    ...withoutKeys(input, ["image_url", "image_alt_text"]),
    partner_id: normalizeUuid(input.partner_id),
    title: input.title || input.internal_name,
    public_title: input.public_title || input.public_name,
    slug: typeof input.slug === "string" ? slugify(input.slug) : input.slug,
    vehicle_type: ownershipType === "owned" ? "Vehicule Yakout" : "Vehicule partenaire",
    registration: input.plate_number || null,
    commission: input.commission_rate || 0,
    private_notes: input.internal_notes || null,
    public_description: input.description || input.public_description || input.short_description,
    price_from: priceFrom,
    price_transfer: input.price_transfer || priceFrom,
    public_status: publicStatus,
    is_published: publicStatus === "published",
    use_cases: normalizeStringArray(input.use_cases as string | string[] | undefined).slice(0, 10),
    amenities: normalizeStringArray(input.amenities as string | string[] | undefined).slice(0, 12),
  };
}

export async function createVehicleAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createVehicleAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/vehicles/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createVehicleAction", parsed.data); revalidatePath("/dashboard/vehicles"); redirect("/dashboard/vehicles"); }
  const { error } = await insertWithCompany("vehicles", normalizeVehicleInput(parsed.data));
  if (error) { logger.error("createVehicleAction failed", error); redirectFormError("/dashboard/vehicles/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

export async function updateVehicleAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "vehicule");
  const raw = Object.fromEntries(formData);
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateVehicleAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/vehicles/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateVehicleAction", { id, ...parsed.data }); revalidatePath("/dashboard/vehicles"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("vehicles").update(normalizeVehicleInput(parsed.data)).eq("id", id);
  if (error) { logger.error("updateVehicleAction failed", error); redirectFormError(`/dashboard/vehicles/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/vehicles");
}

export async function deleteVehicleAction(id: string): Promise<void> {
  requireValidUUID(id, "vehicule");
  if (isDemo()) { logger.info("[DEMO] deleteVehicleAction", { id }); revalidatePath("/dashboard/vehicles"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) { logger.error("deleteVehicleAction failed", error); return; }
  revalidatePath("/dashboard/vehicles");
}

// ─── Reservations ───

export async function createReservationAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createReservationAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/reservations/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createReservationAction", parsed.data); revalidatePath("/dashboard/reservations"); redirect("/dashboard/reservations"); }
  const input = {
    ...parsed.data,
    client_id: normalizeUuid(parsed.data.client_id),
    apartment_id: normalizeUuid(parsed.data.apartment_id),
    guests_count: parsed.data.guests_count ?? parsed.data.people_count,
  };
  const { error } = await insertWithCompany("reservations", input);
  if (error) { logger.error("createReservationAction failed", error); redirectFormError("/dashboard/reservations/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/reservations");
  redirect("/dashboard/reservations");
}

export async function updateReservationAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "reservation");
  const raw = Object.fromEntries(formData);
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateReservationAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/reservations/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateReservationAction", { id, ...parsed.data }); revalidatePath("/dashboard/reservations"); return; }
  const supabase = await getClient();
  const input = {
    ...parsed.data,
    client_id: normalizeUuid(parsed.data.client_id),
    apartment_id: normalizeUuid(parsed.data.apartment_id),
    guests_count: parsed.data.guests_count ?? parsed.data.people_count,
  };
  const { error } = await supabase.from("reservations").update(input).eq("id", id);
  if (error) { logger.error("updateReservationAction failed", error); redirectFormError(`/dashboard/reservations/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/reservations");
}

export async function deleteReservationAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteReservationAction", { id }); revalidatePath("/dashboard/reservations"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) { logger.error("deleteReservationAction failed", error); return; }
  revalidatePath("/dashboard/reservations");
}

// ─── Trips ───

function normalizeTripInput(input: Record<string, unknown>) {
  const amount = input.amount || input.sold_price || 0;
  const cost = input.cost_amount || input.cost_price || 0;
  return {
    ...input,
    lead_id: normalizeUuid(input.lead_id),
    client_id: normalizeUuid(input.client_id),
    vehicle_id: normalizeUuid(input.vehicle_id),
    partner_id: normalizeUuid(input.partner_id),
    package_id: normalizeUuid(input.package_id),
    title: input.title || input.destination || input.trip_type || "Trajet",
    destination_label: input.destination_label || input.destination,
    pickup_location: input.pickup_location || input.departure,
    dropoff_location: input.dropoff_location || input.destination,
    start_time: input.start_time || input.trip_time || null,
    trip_time: input.trip_time || input.start_time || null,
    amount,
    cost_amount: cost,
    sold_price: amount,
    cost_price: cost,
  };
}

export async function createTripAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createTripAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/trips/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createTripAction", parsed.data); revalidatePath("/dashboard/trips"); redirect("/dashboard/trips"); }
  const { error } = await insertWithCompany("trips", normalizeTripInput(parsed.data));
  if (error) { logger.error("createTripAction failed", error); redirectFormError("/dashboard/trips/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/trips");
  redirect("/dashboard/trips");
}

export async function updateTripAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "trajet");
  const raw = Object.fromEntries(formData);
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateTripAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/trips/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateTripAction", { id, ...parsed.data }); revalidatePath("/dashboard/trips"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").update(normalizeTripInput(parsed.data)).eq("id", id);
  if (error) { logger.error("updateTripAction failed", error); redirectFormError(`/dashboard/trips/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/trips");
}

export async function deleteTripAction(id: string): Promise<void> {
  requireValidUUID(id, "trajet");
  if (isDemo()) { logger.info("[DEMO] deleteTripAction", { id }); revalidatePath("/dashboard/trips"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) { logger.error("deleteTripAction failed", error); return; }
  revalidatePath("/dashboard/trips");
}

export async function createTransferAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = transferSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createTransferAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/transfers/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createTransferAction", parsed.data); revalidatePath("/dashboard/transfers"); redirect("/dashboard/transfers"); }
  const input = {
    ...parsed.data,
    lead_id: normalizeUuid(parsed.data.lead_id),
    client_id: normalizeUuid(parsed.data.client_id),
    vehicle_id: normalizeUuid(parsed.data.vehicle_id),
    partner_id: normalizeUuid(parsed.data.partner_id),
  };
  const { error } = await insertWithCompany("transfers", input);
  if (error) { logger.error("createTransferAction failed", error); redirectFormError("/dashboard/transfers/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/transfers");
  redirect("/dashboard/transfers");
}

export async function updateTransferAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "transfert");
  const raw = Object.fromEntries(formData);
  const parsed = transferSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateTransferAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/transfers/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateTransferAction", { id, ...parsed.data }); revalidatePath("/dashboard/transfers"); return; }
  const supabase = await getClient();
  const input = {
    ...parsed.data,
    lead_id: normalizeUuid(parsed.data.lead_id),
    client_id: normalizeUuid(parsed.data.client_id),
    vehicle_id: normalizeUuid(parsed.data.vehicle_id),
    partner_id: normalizeUuid(parsed.data.partner_id),
  };
  const { error } = await supabase.from("transfers").update(input).eq("id", id);
  if (error) { logger.error("updateTransferAction failed", error); redirectFormError(`/dashboard/transfers/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/transfers");
}

export async function deleteTransferAction(id: string): Promise<void> {
  requireValidUUID(id, "transfert");
  if (isDemo()) { logger.info("[DEMO] deleteTransferAction", { id }); revalidatePath("/dashboard/transfers"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("transfers").delete().eq("id", id);
  if (error) { logger.error("deleteTransferAction failed", error); return; }
  revalidatePath("/dashboard/transfers");
}

// ─── Partners ───

function normalizePartnerInput(input: Record<string, unknown>) {
  const partnerType = String(input.partner_type || input.type || "other");
  const status = String(input.status || "active");
  return {
    name: input.name,
    partner_type: partnerType,
    type: partnerType,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    email: input.email || null,
    city: input.city || "Marrakech",
    address: input.address || null,
    company_name: input.company_name || null,
    ice: input.ice || null,
    tax_id: input.tax_id || null,
    contact_person: input.contact_person || null,
    preferred_contact_channel: input.preferred_contact_channel || "whatsapp",
    status,
    service_categories: normalizeStringArray(input.service_categories as string | string[] | undefined).slice(0, 15),
    zones: normalizeStringArray(input.zones as string | string[] | undefined).slice(0, 15),
    languages: normalizeStringArray(input.languages as string | string[] | undefined).slice(0, 10),
    commission_rate: input.commission_rate ?? input.commission ?? null,
    default_cost_type: input.default_cost_type || null,
    payment_terms: input.payment_terms || null,
    bank_name: input.bank_name || null,
    rib: input.rib || null,
    rating: input.rating != null ? Number(input.rating) : null,
    reliability_score: input.reliability_score != null ? Number(input.reliability_score) : null,
    notes: input.notes || null,
    internal_notes: input.internal_notes || null,
    commission: input.commission_rate ?? input.commission ?? null,
    is_active: status !== "inactive" && status !== "suspended" && status !== "blacklisted",
  };
}

export async function createPartnerAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = partnerSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createPartnerAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/partners/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createPartnerAction", parsed.data); revalidatePath("/dashboard/partners"); redirect("/dashboard/partners"); }
  const supabase = createSupabaseAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) { redirectFormError("/dashboard/partners/new", "Profil entreprise introuvable."); }
  const payload = { ...normalizePartnerInput(parsed.data), company_id: companyId };
  const { data, error } = await supabase.from("partners").insert(payload).select("id").single();
  if (error) { logger.error("createPartnerAction failed", error); redirectFormError("/dashboard/partners/new", databaseErrorMessage(error)); }
  if (!data?.id) { redirectFormError("/dashboard/partners/new", "Partenaire crée sans identifiant retourné."); }
  revalidatePath("/dashboard/partners");
  redirect(`/dashboard/partners/${data.id}`);
}

export async function updatePartnerAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "partenaire");
  const raw = Object.fromEntries(formData);
  const parsed = partnerSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updatePartnerAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/partners/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updatePartnerAction", { id, ...parsed.data }); revalidatePath("/dashboard/partners"); return; }
  const supabase = createSupabaseAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) { redirectFormError(`/dashboard/partners/${id}`, "Profil entreprise introuvable."); }
  const { error } = await supabase.from("partners").update(normalizePartnerInput(parsed.data)).eq("id", id).eq("company_id", companyId);
  if (error) { logger.error("updatePartnerAction failed", error); redirectFormError(`/dashboard/partners/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/partners");
  revalidatePath(`/dashboard/partners/${id}`);
}

export async function deletePartnerAction(id: string): Promise<void> {
  requireValidUUID(id, "partenaire");
  if (isDemo()) { logger.info("[DEMO] deletePartnerAction", { id }); revalidatePath("/dashboard/partners"); return; }
  const supabase = createSupabaseAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) { return; }
  const { error } = await supabase.from("partners").delete().eq("id", id).eq("company_id", companyId);
  if (error) { logger.error("deletePartnerAction failed", error); return; }
  revalidatePath("/dashboard/partners");
  redirect("/dashboard/partners");
}

// ─── Payments ───

type PackageItemInput = {
  item_type?: string;
  item_id?: string | null;
  item_slug?: string;
  partner_id?: string | null;
  title?: string;
  description?: string;
  quantity?: number;
  unit_label?: string;
  price_amount?: number;
  cost_amount?: number;
  sort_order?: number;
  is_optional?: boolean;
};

function parsePackageItems(value: unknown): PackageItemInput[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as PackageItemInput[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item.title && item.item_type)
      .slice(0, 20)
      .map((item, index) => ({
        item_type: item.item_type,
        item_id: normalizeUuid(item.item_id),
        item_slug: item.item_slug || undefined,
        partner_id: normalizeUuid(item.partner_id),
        title: item.title ?? "Element",
        description: item.description || undefined,
        quantity: Number(item.quantity ?? 1),
        unit_label: item.unit_label || undefined,
        price_amount: Number(item.price_amount ?? 0),
        cost_amount: Number(item.cost_amount ?? 0),
        sort_order: Number(item.sort_order ?? index),
        is_optional: Boolean(item.is_optional),
      }));
  } catch {
    return [];
  }
}

function normalizePackageInput(input: Record<string, unknown>) {
  return {
    ...withoutKeys(input, ["items_json"]),
    public_title: input.public_title || input.title,
    slug: typeof input.slug === "string" ? slugify(input.slug) : input.slug,
    currency: input.currency || "MAD",
  };
}

export async function createPackageAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createPackageAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/packages/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createPackageAction", parsed.data); revalidatePath("/dashboard/packages"); redirect("/dashboard/packages"); }
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError("/dashboard/packages/new", "Profil entreprise introuvable.");
  const supabase = createSupabaseAdminClient();
  const { data: pack, error } = await supabase.from("packages").insert([{ ...normalizePackageInput(parsed.data), company_id: companyId }]).select("id").single();
  if (error || !pack?.id) { logger.error("createPackageAction failed", error); redirectFormError("/dashboard/packages/new", databaseErrorMessage(error ?? new Error("Pack introuvable apres creation."))); }
  const items = parsePackageItems(parsed.data.items_json).map((item) => ({ ...item, package_id: pack.id }));
  if (items.length > 0) {
    const { error: itemError } = await supabase.from("package_items").insert(items);
    if (itemError) logger.warn("createPackageAction items failed", itemError);
  }
  revalidatePath("/dashboard/packages");
  revalidatePath("/packages");
  redirect("/dashboard/packages");
}

export async function updatePackageAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "pack");
  const raw = Object.fromEntries(formData);
  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updatePackageAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/packages/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updatePackageAction", { id, ...parsed.data }); revalidatePath("/dashboard/packages"); return; }
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("packages").update(normalizePackageInput(parsed.data)).eq("id", id);
  if (error) { logger.error("updatePackageAction failed", error); redirectFormError(`/dashboard/packages/${id}`, databaseErrorMessage(error)); }
  const items = parsePackageItems(parsed.data.items_json).map((item) => ({ ...item, package_id: id }));
  await supabase.from("package_items").delete().eq("package_id", id);
  if (items.length > 0) {
    const { error: itemError } = await supabase.from("package_items").insert(items);
    if (itemError) logger.warn("updatePackageAction items failed", itemError);
  }
  revalidatePath("/dashboard/packages");
  revalidatePath(`/dashboard/packages/${id}`);
  revalidatePath("/packages");
}

export async function deletePackageAction(id: string): Promise<void> {
  requireValidUUID(id, "pack");
  if (isDemo()) { logger.info("[DEMO] deletePackageAction", { id }); revalidatePath("/dashboard/packages"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) { logger.error("deletePackageAction failed", error); return; }
  revalidatePath("/dashboard/packages");
}

export async function createPaymentAction(formData: FormData): Promise<void> {
  const errorPath = paymentFormPath(formData, "/dashboard/payments/new");
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createPaymentAction: validation echec", parsed.error.flatten()); redirectFormError(errorPath, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createPaymentAction", parsed.data); revalidatePath("/dashboard/payments"); redirect("/dashboard/payments"); }
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(errorPath, "Profil entreprise introuvable.");

  const supabase = createSupabaseAdminClient();
  const paymentInput = normalizePaymentInput(parsed.data);
  const apartmentId = paymentInput.apartment_id as string | null;

  if (apartmentId) {
    const { data: apartment, error: apartmentError } = await supabase
      .from("apartments")
      .select("id, owner_id")
      .eq("id", apartmentId)
      .eq("company_id", companyId)
      .single();
    if (apartmentError || !apartment) {
      logger.error("createPaymentAction apartment lookup failed", apartmentError ?? new Error("Appartement introuvable."));
      redirectFormError(errorPath, "Appartement introuvable pour cette recette.");
    }
    paymentInput.owner_id = paymentInput.owner_id || apartment.owner_id || null;
  }

  if (parsed.data.create_reservation && apartmentId && parsed.data.stay_check_in && parsed.data.stay_check_out) {
    const totalAmount = Number(parsed.data.total_amount || parsed.data.amount || 0);
    const depositAmount = ["deposit", "partial"].includes(String(parsed.data.payment_part)) || parsed.data.status === "partial"
      ? Number(parsed.data.amount || 0)
      : parsed.data.status === "paid"
        ? totalAmount || Number(parsed.data.amount || 0)
        : 0;
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert([{
        company_id: companyId,
        apartment_id: apartmentId,
        client_id: paymentInput.client_id || null,
        check_in: parsed.data.stay_check_in,
        check_out: parsed.data.stay_check_out,
        people_count: parsed.data.guests_count || 1,
        guests_count: parsed.data.guests_count || 1,
        total_amount: totalAmount || Number(parsed.data.amount || 0),
        deposit_amount: depositAmount,
        source: paymentInput.source,
        reservation_status: parsed.data.status === "pending" ? "Pre-reservation" : "Confirmee",
      }])
      .select("id")
      .single();
    if (reservationError) {
      logger.error("createPaymentAction reservation create failed", reservationError);
      redirectFormError(errorPath, databaseErrorMessage(reservationError));
    }
    paymentInput.reservation_id = reservation?.id ?? paymentInput.reservation_id;
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .insert([{ ...paymentInput, company_id: companyId }])
    .select("id, apartment_id, reservation_id")
    .single();
  if (error) { logger.error("createPaymentAction failed", error); redirectFormError(errorPath, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/payments");
  if (payment?.apartment_id) revalidatePath(`/dashboard/apartments/${payment.apartment_id}`);
  if (payment?.reservation_id) revalidatePath(`/dashboard/reservations/${payment.reservation_id}`);
  redirect(payment?.id ? `/dashboard/payments/${payment.id}` : "/dashboard/payments");
}

export async function updatePaymentAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "paiement");
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updatePaymentAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/payments/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updatePaymentAction", { id, ...parsed.data }); revalidatePath("/dashboard/payments"); return; }
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(`/dashboard/payments/${id}`, "Profil entreprise introuvable.");
  const supabase = createSupabaseAdminClient();
  const paymentInput = normalizePaymentInput(parsed.data);
  const apartmentId = paymentInput.apartment_id as string | null;
  if (apartmentId) {
    const { data: apartment } = await supabase
      .from("apartments")
      .select("owner_id")
      .eq("id", apartmentId)
      .eq("company_id", companyId)
      .single();
    paymentInput.owner_id = paymentInput.owner_id || apartment?.owner_id || null;
  }
  const { error } = await supabase.from("payments").update(paymentInput).eq("id", id).eq("company_id", companyId);
  if (error) { logger.error("updatePaymentAction failed", error); redirectFormError(`/dashboard/payments/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/payments");
  if (apartmentId) revalidatePath(`/dashboard/apartments/${apartmentId}`);
  if (paymentInput.reservation_id) revalidatePath(`/dashboard/reservations/${paymentInput.reservation_id}`);
}

export async function deletePaymentAction(id: string): Promise<void> {
  requireValidUUID(id, "paiement");
  if (isDemo()) { logger.info("[DEMO] deletePaymentAction", { id }); revalidatePath("/dashboard/payments"); return; }
  const supabase = createSupabaseAdminClient();
  const { data: payment } = await supabase.from("payments").select("apartment_id, reservation_id").eq("id", id).single();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) { logger.error("deletePaymentAction failed", error); return; }
  revalidatePath("/dashboard/payments");
  if (payment?.apartment_id) revalidatePath(`/dashboard/apartments/${payment.apartment_id}`);
  if (payment?.reservation_id) revalidatePath(`/dashboard/reservations/${payment.reservation_id}`);
}

// ─── Expenses ───

function normalizeExpenseInput(input: Record<string, unknown>) {
  return {
    ...input,
    client_id: normalizeUuid(input.client_id),
    lead_id: normalizeUuid(input.lead_id),
    reservation_id: normalizeUuid(input.reservation_id),
    apartment_id: normalizeUuid(input.apartment_id),
    vehicle_id: normalizeUuid(input.vehicle_id),
    trip_id: normalizeUuid(input.trip_id),
    transfer_id: normalizeUuid(input.transfer_id),
    package_id: normalizeUuid(input.package_id),
    partner_id: normalizeUuid(input.partner_id),
    owner_id: normalizeUuid(input.owner_id),
  };
}

export async function createExpenseAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createExpenseAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/expenses/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createExpenseAction", parsed.data); revalidatePath("/dashboard/expenses"); redirect("/dashboard/expenses"); }
  const { error } = await insertWithCompany("expenses", normalizeExpenseInput(parsed.data));
  if (error) { logger.error("createExpenseAction failed", error); redirectFormError("/dashboard/expenses/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/expenses");
  redirect("/dashboard/expenses");
}

export async function updateExpenseAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateExpenseAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/expenses/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateExpenseAction", { id, ...parsed.data }); revalidatePath("/dashboard/expenses"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("expenses").update(normalizeExpenseInput(parsed.data)).eq("id", id);
  if (error) { logger.error("updateExpenseAction failed", error); redirectFormError(`/dashboard/expenses/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/expenses");
}

export async function deleteExpenseAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteExpenseAction", { id }); revalidatePath("/dashboard/expenses"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) { logger.error("deleteExpenseAction failed", error); return; }
  revalidatePath("/dashboard/expenses");
}

// ─── Blog Posts ───

function blogDashboardRedirect(errorPath: string, message: string): never {
  redirect(`${errorPath}?error=${encodeURIComponent(message)}`);
}

export async function createBlogPostAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createBlogPostAction: validation echec", parsed.error.flatten()); blogDashboardRedirect("/dashboard/site/blog/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createBlogPostAction", parsed.data); revalidatePath("/dashboard/site/blog"); redirect("/dashboard/site/blog"); }
  const data = withoutKeys(parsed.data, ["cover_image_alt"]);
  if (data.status === "published" && !data.published_at) {
    data.published_at = new Date().toISOString();
  }
  const { error } = await insertWithCompany("blog_posts", data);
  if (error) { logger.error("createBlogPostAction failed", error); blogDashboardRedirect("/dashboard/site/blog/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/blog");
  revalidatePath("/blog");
  redirect("/dashboard/site/blog");
}

export async function updateBlogPostAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "blog_post");
  const raw = Object.fromEntries(formData);
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateBlogPostAction: validation echec", parsed.error.flatten()); blogDashboardRedirect(`/dashboard/site/blog/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateBlogPostAction", { id, ...parsed.data }); revalidatePath("/dashboard/site/blog"); return; }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("blog_posts").update(withoutKeys(parsed.data, ["cover_image_alt"])).eq("id", id);
  if (error) { logger.error("updateBlogPostAction failed", error); blogDashboardRedirect(`/dashboard/site/blog/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${parsed.data.slug}`);
}

export async function deleteBlogPostAction(id: string): Promise<void> {
  requireValidUUID(id, "blog_post");
  if (isDemo()) { logger.info("[DEMO] deleteBlogPostAction", { id }); revalidatePath("/dashboard/site/blog"); return; }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) { logger.error("deleteBlogPostAction failed", error); return; }
  revalidatePath("/dashboard/site/blog");
  revalidatePath("/blog");
}

export async function toggleBlogPostStatusAction(id: string, status: "draft" | "published" | "archived"): Promise<void> {
  requireValidUUID(id, "blog_post");
  if (isDemo()) { logger.info("[DEMO] toggleBlogPostStatusAction", { id, status }); revalidatePath("/dashboard/site/blog"); return; }
  const admin = createSupabaseAdminClient();
  const updates: Record<string, string | null> = { status };
  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }
  const { error } = await admin.from("blog_posts").update(updates).eq("id", id);
  if (error) { logger.error("toggleBlogPostStatusAction failed", error); return; }
  revalidatePath("/dashboard/site/blog");
  revalidatePath("/blog");
}

// ─── Services ───

export async function createServiceAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createServiceAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/site/services/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createServiceAction", parsed.data); revalidatePath("/dashboard/site/services"); redirect("/dashboard/site/services"); }
  const { error } = await insertWithCompany("services", withoutKeys(parsed.data, ["image_alt_text"]));
  if (error) { logger.error("createServiceAction failed", error); redirectFormError("/dashboard/site/services/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/services");
  redirect("/dashboard/site/services");
}

export async function updateServiceAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateServiceAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/site/services/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateServiceAction", { id, ...parsed.data }); revalidatePath("/dashboard/site/services"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("services").update(withoutKeys(parsed.data, ["image_alt_text"])).eq("id", id);
  if (error) { logger.error("updateServiceAction failed", error); redirectFormError(`/dashboard/site/services/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/services");
}

export async function deleteServiceAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteServiceAction", { id }); revalidatePath("/dashboard/site/services"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) { logger.error("deleteServiceAction failed", error); return; }
  revalidatePath("/dashboard/site/services");
}

// ─── Site Pages ───

export async function createSitePageAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = sitePageSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createSitePageAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/site/pages/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createSitePageAction", parsed.data); revalidatePath("/dashboard/site/pages"); redirect("/dashboard/site/pages"); }
  const { error } = await insertWithCompany("site_pages", withoutKeys(parsed.data, ["cover_image_alt"]));
  if (error) { logger.error("createSitePageAction failed", error); redirectFormError("/dashboard/site/pages/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/pages");
  redirect("/dashboard/site/pages");
}

export async function deleteSitePageAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteSitePageAction", { id }); revalidatePath("/dashboard/site/pages"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("site_pages").delete().eq("id", id);
  if (error) { logger.error("deleteSitePageAction failed", error); return; }
  revalidatePath("/dashboard/site/pages");
}

export async function updateSitePageAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = sitePageSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateSitePageAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/site/pages/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateSitePageAction", { id, ...parsed.data }); revalidatePath("/dashboard/site/pages"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("site_pages").update(withoutKeys(parsed.data, ["cover_image_alt"])).eq("id", id);
  if (error) { logger.error("updateSitePageAction failed", error); redirectFormError(`/dashboard/site/pages/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/pages");
}

// ─── Site Settings ───

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  if (isDemo()) { logger.info("[DEMO] saveSettingsAction", raw); revalidatePath("/dashboard/site/settings"); return; }
  const supabase = await getClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) { logger.error("saveSettingsAction failed", new Error("Profil entreprise introuvable.")); redirectFormError("/dashboard/site/settings", "Profil entreprise introuvable. Reconnectez Maria puis reessayez."); }
  const rows = Object.entries(raw).map(([key, value]) => ({
    company_id: companyId,
    key,
    value,
    is_public: true,
  }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "company_id,key" });
  if (error) { logger.error("saveSettingsAction failed", error); redirectFormError("/dashboard/site/settings", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/settings");
  revalidatePath("/");
}

export async function saveSeoSettingsAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  if (isDemo()) { logger.info("[DEMO] saveSeoSettingsAction", raw); revalidatePath("/dashboard/site/seo"); return; }
  const supabase = await getClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) { logger.error("saveSeoSettingsAction failed", new Error("Profil entreprise introuvable.")); redirectFormError("/dashboard/site/seo", "Profil entreprise introuvable. Reconnectez Maria puis reessayez."); }
  const { error } = await supabase.from("seo_metadata").insert([{ ...raw, company_id: companyId }]);
  if (error) { logger.error("saveSeoSettingsAction failed", error); redirectFormError("/dashboard/site/seo", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/seo");
}

// ─── Document Actions ───

export async function createDocumentAction(formData: FormData): Promise<void> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) redirectFormError("/dashboard/documents/new", "Veuillez sélectionner un fichier.");
  const raw = Object.fromEntries(formData);
  delete raw.file;
  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createDocumentAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/documents/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createDocumentAction", parsed.data); revalidatePath("/dashboard/documents"); redirect("/dashboard/documents"); }

  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError("/dashboard/documents/new", "Profil entreprise introuvable.");

  let fileResult: {
    filePath: string; fileUrl: string; fileName: string;
    fileSize: number; mimeType: string; extension: string;
  } | null = null;

  if (file && file.size > 0) {
    const { uploadDocument } = await import("@/lib/storage");
    try {
      fileResult = await uploadDocument(file, companyId, parsed.data.type, parsed.data.related_type);
    } catch (uploadErr) {
      logger.error("createDocumentAction: upload echec", uploadErr);
      redirectFormError("/dashboard/documents/new", "Erreur lors de l'upload du fichier.");
    }
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    ...parsed.data,
    company_id: companyId,
    file_url: fileResult?.fileUrl ?? parsed.data.file_url,
    file_path: fileResult?.filePath,
    file_name: fileResult?.fileName ?? parsed.data.file_name,
    file_size: fileResult?.fileSize ?? parsed.data.file_size,
    mime_type: fileResult?.mimeType ?? parsed.data.mime_type,
    file_extension: fileResult?.extension,
    storage_bucket: fileResult ? "yakout-private" : parsed.data.storage_bucket,
    owner_id: normalizeUuid(parsed.data.owner_id),
    client_id: normalizeUuid(parsed.data.client_id),
    apartment_id: normalizeUuid(parsed.data.apartment_id),
    vehicle_id: normalizeUuid(parsed.data.vehicle_id),
    partner_id: normalizeUuid(parsed.data.partner_id),
    transfer_id: normalizeUuid(parsed.data.transfer_id),
    trip_id: normalizeUuid(parsed.data.trip_id),
    package_id: normalizeUuid(parsed.data.package_id),
    reservation_id: normalizeUuid(parsed.data.reservation_id),
    payment_id: normalizeUuid(parsed.data.payment_id),
    expense_id: normalizeUuid(parsed.data.expense_id),
    related_id: normalizeUuid(parsed.data.related_id),
  };
  const { error } = await supabase.from("documents").insert([payload]);
  if (error) {
    if (fileResult?.filePath) {
      const { deleteDocumentFile } = await import("@/lib/storage");
      await deleteDocumentFile(fileResult.filePath).catch(() => {});
    }
    logger.error("createDocumentAction failed", error);
    redirectFormError("/dashboard/documents/new", databaseErrorMessage(error));
  }
  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

export async function updateDocumentAction(id: string, formData: FormData): Promise<void> {
  const file = formData.get("file") as File | null;
  const raw = Object.fromEntries(formData);
  delete raw.file;
  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateDocumentAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/documents/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateDocumentAction", { id, ...parsed.data }); revalidatePath("/dashboard/documents"); return; }

  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError(`/dashboard/documents/${id}`, "Profil entreprise introuvable.");

  const supabase = createSupabaseAdminClient();
  const updateData: Record<string, unknown> = {
    ...parsed.data,
    owner_id: normalizeUuid(parsed.data.owner_id),
    client_id: normalizeUuid(parsed.data.client_id),
    apartment_id: normalizeUuid(parsed.data.apartment_id),
    vehicle_id: normalizeUuid(parsed.data.vehicle_id),
    partner_id: normalizeUuid(parsed.data.partner_id),
    transfer_id: normalizeUuid(parsed.data.transfer_id),
    trip_id: normalizeUuid(parsed.data.trip_id),
    package_id: normalizeUuid(parsed.data.package_id),
    reservation_id: normalizeUuid(parsed.data.reservation_id),
    payment_id: normalizeUuid(parsed.data.payment_id),
    expense_id: normalizeUuid(parsed.data.expense_id),
    related_id: normalizeUuid(parsed.data.related_id),
  };

  if (file && file.size > 0) {
    const { uploadDocument, deleteDocumentFile } = await import("@/lib/storage");
    const { data: currentDoc } = await supabase.from("documents").select("file_path").eq("id", id).single();
    if (currentDoc?.file_path) {
      await deleteDocumentFile(currentDoc.file_path).catch(() => {});
    }
    try {
      const fileResult = await uploadDocument(file, companyId, parsed.data.type, parsed.data.related_type);
      updateData.file_url = fileResult.fileUrl;
      updateData.file_path = fileResult.filePath;
      updateData.file_name = fileResult.fileName;
      updateData.file_size = fileResult.fileSize;
      updateData.mime_type = fileResult.mimeType;
      updateData.file_extension = fileResult.extension;
      updateData.storage_bucket = "yakout-private";
    } catch (uploadErr) {
      logger.error("updateDocumentAction: upload echec", uploadErr);
      redirectFormError(`/dashboard/documents/${id}`, "Erreur lors de l'upload du fichier.");
    }
  }

  const { error } = await supabase.from("documents").update(updateData).eq("id", id).eq("company_id", companyId);
  if (error) { logger.error("updateDocumentAction failed", error); redirectFormError(`/dashboard/documents/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/documents");
}

export async function deleteDocumentAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteDocumentAction", { id }); revalidatePath("/dashboard/documents"); return; }
  const supabase = createSupabaseAdminClient();
  const { data: doc } = await supabase.from("documents").select("file_path").eq("id", id).single();
  if (doc?.file_path) {
    const { deleteDocumentFile } = await import("@/lib/storage");
    await deleteDocumentFile(doc.file_path).catch((err) => logger.warn("deleteDocumentAction: echec suppression fichier", err));
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) { logger.error("deleteDocumentAction failed", error); return; }
  revalidatePath("/dashboard/documents");
}

export async function archiveDocumentAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] archiveDocumentAction", { id }); revalidatePath("/dashboard/documents"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("documents").update({ doc_status: "archived" }).eq("id", id);
  if (error) { logger.error("archiveDocumentAction failed", error); return; }
  revalidatePath("/dashboard/documents");
}

export async function toggleDocumentStatusAction(id: string, status: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] toggleDocumentStatusAction", { id, status }); revalidatePath("/dashboard/documents"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("documents").update({ doc_status: status }).eq("id", id);
  if (error) { logger.error("toggleDocumentStatusAction failed", error); return; }
  revalidatePath("/dashboard/documents");
}
