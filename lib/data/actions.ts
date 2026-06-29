"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import {
  leadSchema, clientSchema, apartmentSchema, vehicleSchema,
  reservationSchema, tripSchema, partnerSchema, paymentSchema,
  expenseSchema, blogPostSchema, serviceSchema, sitePageSchema,
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

function normalizeApartmentInput(input: Record<string, unknown> & { amenities?: string }): Record<string, unknown> & { amenities: string[] } {
  return {
    ...input,
    amenities: input.amenities
      ? input.amenities.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

function getApartmentCoreInput(input: Record<string, unknown> & { amenities?: string[] }) {
  return {
    internal_name: input.internal_name,
    public_name: input.public_name,
    slug: input.slug,
    district: input.district,
    public_district: input.district,
    bedrooms: input.bedrooms,
    capacity: input.capacity,
    price_from: input.price_from,
    short_description: input.short_description,
    detailed_description: input.detailed_description,
    amenities: input.amenities,
    is_published: input.is_published,
    is_featured: input.is_featured,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
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

function withoutKeys<T extends Record<string, unknown>>(input: T, keys: string[]) {
  const copy: Record<string, unknown> = { ...input };
  for (const key of keys) delete copy[key];
  return copy;
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
  const supabase = await getClient();
  const { error } = await supabase.from("leads").insert([{ ...parsed.data, status: "new" }]);
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
  const normalized = normalizeApartmentInput(parsed.data);
  const { image_url, image_alt_text } = normalized;

  const { data: apartment, error } = await supabase
    .from("apartments")
    .insert([{ ...getApartmentCoreInput(normalized), company_id: companyId }])
    .select("id")
    .single();

  if (error) {
    logger.error("createApartmentAction failed", error);
    redirectApartmentError(error.message.includes("duplicate") ? "Ce slug existe deja. Changez le slug de l'appartement." : error.message);
  }

  if (apartment?.id && typeof image_url === "string" && image_url) {
    const { error: imageError } = await supabase.from("apartment_images").insert([{
      company_id: companyId,
      apartment_id: apartment.id,
      url: image_url,
      alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      display_order: 0,
    }]);

    if (imageError) {
      logger.warn("createApartmentAction image attach failed", imageError);
    }
  }

  revalidatePath("/dashboard/apartments");
  revalidatePath("/apartments");
  redirect("/dashboard/apartments");
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
  const normalized = normalizeApartmentInput(parsed.data);
  const { data: currentApartment } = await supabase.from("apartments").select("slug").eq("id", id).single();
  const { image_url, image_alt_text } = normalized;
  const { error } = await supabase
    .from("apartments")
    .update(getApartmentCoreInput(normalized))
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) { logger.error("updateApartmentAction failed", error); redirectFormError(`/dashboard/apartments/${id}`, databaseErrorMessage(error)); }

  if (typeof image_url === "string" && image_url) {
    await supabase.from("apartment_images").delete().eq("apartment_id", id).eq("company_id", companyId);
    const { error: imageError } = await supabase.from("apartment_images").insert([{
      company_id: companyId,
      apartment_id: id,
      url: image_url,
      alt_text: typeof image_alt_text === "string" ? image_alt_text : null,
      display_order: 0,
    }]);

    if (imageError) {
      logger.warn("updateApartmentAction image attach failed", imageError);
    }
  }

  revalidatePath("/dashboard/apartments");
  revalidatePath(`/dashboard/apartments/${id}`);
  revalidatePath("/apartments");
  if (currentApartment?.slug) revalidatePath(`/apartments/${currentApartment.slug}`);
  if (typeof normalized.slug === "string") revalidatePath(`/apartments/${normalized.slug}`);
}

export async function deleteApartmentAction(id: string): Promise<void> {
  requireValidUUID(id, "appartement");
  if (isDemo()) { logger.info("[DEMO] deleteApartmentAction", { id }); revalidatePath("/dashboard/apartments"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("apartments").delete().eq("id", id);
  if (error) { logger.error("deleteApartmentAction failed", error); return; }
  revalidatePath("/dashboard/apartments");
}

// ─── Vehicles ───

export async function createVehicleAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createVehicleAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/vehicles/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createVehicleAction", parsed.data); revalidatePath("/dashboard/vehicles"); redirect("/dashboard/vehicles"); }
  const vehicleInput = withoutKeys(parsed.data, ["image_url", "image_alt_text"]);
  const { error } = await insertWithCompany("vehicles", { vehicle_type: "Vehicule Yakout", ...vehicleInput });
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
  const { error } = await supabase.from("vehicles").update(withoutKeys(parsed.data, ["image_url", "image_alt_text"])).eq("id", id);
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
  const { error } = await insertWithCompany("reservations", parsed.data);
  if (error) { logger.error("createReservationAction failed", error); redirectFormError("/dashboard/reservations/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/reservations");
  redirect("/dashboard/reservations");
}

export async function updateReservationAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateReservationAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/reservations/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateReservationAction", { id, ...parsed.data }); revalidatePath("/dashboard/reservations"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("reservations").update(parsed.data).eq("id", id);
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

export async function createTripAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createTripAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/trips/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createTripAction", parsed.data); revalidatePath("/dashboard/trips"); redirect("/dashboard/trips"); }
  const { error } = await insertWithCompany("trips", parsed.data);
  if (error) { logger.error("createTripAction failed", error); redirectFormError("/dashboard/trips/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/trips");
  redirect("/dashboard/trips");
}

export async function updateTripAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateTripAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/trips/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateTripAction", { id, ...parsed.data }); revalidatePath("/dashboard/trips"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").update(parsed.data).eq("id", id);
  if (error) { logger.error("updateTripAction failed", error); redirectFormError(`/dashboard/trips/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/trips");
}

export async function deleteTripAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteTripAction", { id }); revalidatePath("/dashboard/trips"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) { logger.error("deleteTripAction failed", error); return; }
  revalidatePath("/dashboard/trips");
}

// ─── Partners ───

export async function createPartnerAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = partnerSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createPartnerAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/partners/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createPartnerAction", parsed.data); revalidatePath("/dashboard/partners"); redirect("/dashboard/partners"); }
  const { error } = await insertWithCompany("partners", parsed.data);
  if (error) { logger.error("createPartnerAction failed", error); redirectFormError("/dashboard/partners/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/partners");
  redirect("/dashboard/partners");
}

export async function updatePartnerAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = partnerSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updatePartnerAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/partners/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updatePartnerAction", { id, ...parsed.data }); revalidatePath("/dashboard/partners"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("partners").update(parsed.data).eq("id", id);
  if (error) { logger.error("updatePartnerAction failed", error); redirectFormError(`/dashboard/partners/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/partners");
}

export async function deletePartnerAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deletePartnerAction", { id }); revalidatePath("/dashboard/partners"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) { logger.error("deletePartnerAction failed", error); return; }
  revalidatePath("/dashboard/partners");
}

// ─── Payments ───

export async function createPaymentAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createPaymentAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/payments/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createPaymentAction", parsed.data); revalidatePath("/dashboard/payments"); redirect("/dashboard/payments"); }
  const { error } = await insertWithCompany("payments", parsed.data);
  if (error) { logger.error("createPaymentAction failed", error); redirectFormError("/dashboard/payments/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/payments");
  redirect("/dashboard/payments");
}

export async function updatePaymentAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updatePaymentAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/payments/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updatePaymentAction", { id, ...parsed.data }); revalidatePath("/dashboard/payments"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("payments").update(parsed.data).eq("id", id);
  if (error) { logger.error("updatePaymentAction failed", error); redirectFormError(`/dashboard/payments/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/payments");
}

export async function deletePaymentAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deletePaymentAction", { id }); revalidatePath("/dashboard/payments"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) { logger.error("deletePaymentAction failed", error); return; }
  revalidatePath("/dashboard/payments");
}

// ─── Expenses ───

export async function createExpenseAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createExpenseAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/expenses/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createExpenseAction", parsed.data); revalidatePath("/dashboard/expenses"); redirect("/dashboard/expenses"); }
  const { error } = await insertWithCompany("expenses", parsed.data);
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
  const { error } = await supabase.from("expenses").update(parsed.data).eq("id", id);
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

export async function createBlogPostAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("createBlogPostAction: validation echec", parsed.error.flatten()); redirectFormError("/dashboard/site/blog/new", firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] createBlogPostAction", parsed.data); revalidatePath("/dashboard/site/blog"); redirect("/dashboard/site/blog"); }
  const { error } = await insertWithCompany("blog_posts", withoutKeys(parsed.data, ["cover_image_alt"]));
  if (error) { logger.error("createBlogPostAction failed", error); redirectFormError("/dashboard/site/blog/new", databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/blog");
  redirect("/dashboard/site/blog");
}

export async function updateBlogPostAction(id: string, formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) { logger.warn("updateBlogPostAction: validation echec", parsed.error.flatten()); redirectFormError(`/dashboard/site/blog/${id}`, firstValidationMessage(parsed.error)); }
  if (isDemo()) { logger.info("[DEMO] updateBlogPostAction", { id, ...parsed.data }); revalidatePath("/dashboard/site/blog"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").update(withoutKeys(parsed.data, ["cover_image_alt"])).eq("id", id);
  if (error) { logger.error("updateBlogPostAction failed", error); redirectFormError(`/dashboard/site/blog/${id}`, databaseErrorMessage(error)); }
  revalidatePath("/dashboard/site/blog");
}

export async function deleteBlogPostAction(id: string): Promise<void> {
  if (isDemo()) { logger.info("[DEMO] deleteBlogPostAction", { id }); revalidatePath("/dashboard/site/blog"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) { logger.error("deleteBlogPostAction failed", error); return; }
  revalidatePath("/dashboard/site/blog");
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
