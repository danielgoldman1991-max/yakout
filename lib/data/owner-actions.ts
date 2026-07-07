"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { createOwner as createOwnerData, updateOwner as updateOwnerData, deleteOwner as deleteOwnerData } from "@/lib/data/owners";

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

function databaseErrorMessage(error: { message?: string }) {
  const message = error.message ?? "Erreur de sauvegarde.";
  if (message.toLowerCase().includes("duplicate")) return "Cette valeur existe deja.";
  if (message.toLowerCase().includes("permission")) return "Droits Supabase insuffisants.";
  return message;
}

function redirectFormError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ─── Owner CRUD ───

export async function createOwnerAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const fullName = String(raw.full_name ?? "").trim();
  const phone = String(raw.phone ?? "").trim();

  if (!fullName) redirectFormError("/dashboard/owners/new", "Le nom complet est requis.");
  if (!phone) redirectFormError("/dashboard/owners/new", "Le telephone est requis.");

  if (isDemo()) { logger.info("[DEMO] createOwnerAction", raw); revalidatePath("/dashboard/owners"); redirect("/dashboard/owners"); }

  const email = raw.email ? String(raw.email).trim() : undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectFormError("/dashboard/owners/new", "L'email est invalide.");
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError("/dashboard/owners/new", "Profil entreprise introuvable. Contactez l'administrateur.");

  const result = await createOwnerData({
    full_name: fullName,
    phone,
    email,
    city: raw.city ? String(raw.city).trim() : undefined,
    country: raw.country ? String(raw.country).trim() : "Maroc",
    preferred_contact_channel: raw.preferred_contact_channel ? String(raw.preferred_contact_channel).trim() : "whatsapp",
    status: raw.status ? String(raw.status).trim() : "lead_received",
    source: raw.source ? String(raw.source).trim() : "Ajout manuel",
    notes: raw.notes ? String(raw.notes).trim() : undefined,
    company_id: companyId,
  });

  if (result.error) {
    logger.error("createOwnerAction failed", new Error(result.error));
    redirectFormError("/dashboard/owners/new", databaseErrorMessage({ message: result.error }));
  }

  revalidatePath("/dashboard/owners");
  redirect(`/dashboard/owners/${result.id}`);
}

export async function updateOwnerAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "owner");
  const raw = Object.fromEntries(formData);
  const fullName = String(raw.full_name ?? "").trim();

  if (!fullName) redirectFormError(`/dashboard/owners/${id}`, "Le nom complet est requis.");

  if (isDemo()) { logger.info("[DEMO] updateOwnerAction", { id, ...raw }); revalidatePath("/dashboard/owners"); return; }

  const result = await updateOwnerData(id, raw);
  if (result.error) {
    logger.error("updateOwnerAction failed", new Error(result.error));
    redirectFormError(`/dashboard/owners/${id}`, databaseErrorMessage({ message: result.error }));
  }

  revalidatePath("/dashboard/owners");
  revalidatePath(`/dashboard/owners/${id}`);
  redirect(`/dashboard/owners/${id}`);
}

export async function updateOwnerStatusAction(id: string, formData: FormData): Promise<void> {
  requireValidUUID(id, "owner");
  const status = formData.get("status") as string;
  if (!status) { logger.warn("updateOwnerStatusAction: statut vide", { id }); return; }
  if (isDemo()) { logger.error("updateOwnerStatusAction: Supabase non configure"); return; }
  const supabase = await getClient();
  const { error } = await supabase.from("owners").update({ status }).eq("id", id);
  if (error) { logger.error("updateOwnerStatusAction failed", error); return; }
  logger.info("Owner status updated", { id, status });
  revalidatePath("/dashboard/owners");
  revalidatePath(`/dashboard/owners/${id}`);
}

export async function deleteOwnerAction(id: string): Promise<void> {
  requireValidUUID(id, "owner");
  if (isDemo()) { logger.info("[DEMO] deleteOwnerAction", { id }); revalidatePath("/dashboard/owners"); return; }
  const result = await deleteOwnerData(id);
  if (result.error) { logger.error("deleteOwnerAction failed", new Error(result.error)); return; }
  revalidatePath("/dashboard/owners");
  redirect("/dashboard/owners");
}

// ─── Lead Conversion ───

type ConversionResult = {
  success: boolean;
  error?: string;
  ownerId?: string;
  debugCode?: string;
  debugMessage?: string;
  debugDetails?: string | null;
  debugHint?: string | null;
};

function serializeSupabaseError(error: unknown) {
  const value = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    stack?: string;
  };
  return {
    code: value?.code ?? "UNKNOWN",
    message: value?.message ?? String(error),
    details: value?.details ?? null,
    hint: value?.hint ?? null,
    stack: value?.stack ?? null,
  };
}

export async function convertLeadToOwnerAction(leadId: string, _prev: unknown, _formData: FormData): Promise<ConversionResult> {
  void _prev; void _formData;
  requireValidUUID(leadId, "lead");

  const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : "MISSING";
  console.log("SUPABASE_TARGET", {
    hostname: supabaseHostname,
    environment: process.env.VERCEL_ENV,
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
  });

  if (!hasSupabaseEnv()) {
    logger.error("convertLeadToOwnerAction: Supabase non configure");
    return { success: false, error: "Supabase n'est pas configuree.", debugCode: "NO_SUPABASE_ENV" };
  }

  const supabase = await getClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.error("convertLeadToOwnerAction: session expiree", userError ?? new Error("No user"));
    return { success: false, error: "Votre session a expire. Reconnectez-vous.", debugCode: "NO_SESSION" };
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc("convert_lead_to_owner", { p_lead_id: leadId });

  if (rpcError) {
    const serialized = serializeSupabaseError(rpcError);
    logger.error("convertLeadToOwnerAction:rpc", {
      leadId,
      userId: user.id,
      ...serialized,
    });
    console.error("LEAD_TO_OWNER_CONVERSION_FAILED", {
      leadId,
      userId: user.id,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      error: serialized,
    });

    let message = "La conversion en proprietaire n'a pas pu etre effectuee.";

    if (rpcError.code === "42501") {
      message = "Votre session n'est pas valide. Reconnectez-vous.";
    } else if (rpcError.code === "P0002") {
      message = "Ce lead est introuvable.";
    } else if (rpcError.code === "P0004") {
      message = rpcError.message ?? "Aucune entreprise rattachee a votre compte.";
    } else if (rpcError.code === "P0001") {
      message = rpcError.message ?? "Le proprietaire n'a pas pu etre cree.";
    } else if (
      rpcError.code === "42883" || rpcError.code === "404" || rpcError.code === "PGRST108"
      || (rpcError.message ?? "").toLowerCase().includes("could not find the function")
      || (rpcError.message ?? "").toLowerCase().includes("does not exist")
    ) {
      message = "La conversion proprietaire n'est pas encore disponible. Contactez l'administrateur.";
    }

    return {
      success: false,
      error: message,
      debugCode: serialized.code,
      debugMessage: serialized.message,
      debugDetails: serialized.details,
      debugHint: serialized.hint,
    };
  }

  if (!rpcResult || typeof rpcResult !== "object" || !rpcResult.success) {
    logger.error("convertLeadToOwnerAction: resultat RPC invalide", { leadId, rpcResult });
    return {
      success: false,
      error: "La base n'a pas retourne le proprietaire cree.",
      debugCode: "INVALID_RPC_RESULT",
      debugMessage: JSON.stringify(rpcResult),
    };
  }

  const ownerId: string = rpcResult.owner_id;

  if (!ownerId || !isValidUUID(ownerId)) {
    logger.error("convertLeadToOwnerAction: owner_id invalide dans le resultat RPC", { leadId, rpcResult });
    return {
      success: false,
      error: "La conversion n'a pas retourne de proprietaire valide.",
      debugCode: "INVALID_OWNER_ID",
      debugMessage: JSON.stringify(rpcResult),
    };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/owners");
  revalidatePath(`/dashboard/owners/${ownerId}`);
  redirect(`/dashboard/owners/${ownerId}`);
}

// ─── Owner Properties ───

export async function createPropertyFromOwnerAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const internalName = String(raw.internal_name ?? "").trim();
  const slug = String(raw.slug ?? "").trim();
  const ownerId = String(raw.owner_id ?? "").trim();

  if (!internalName) redirectFormError("/dashboard/apartments/new", "Le nom interne est requis.");
  if (!slug) redirectFormError("/dashboard/apartments/new", "Le slug est requis.");
  if (!ownerId) redirectFormError("/dashboard/apartments/new", "Le proprietaire est requis.");
  requireValidUUID(ownerId, "owner");

  if (isDemo()) { logger.info("[DEMO] createPropertyFromOwnerAction", raw); revalidatePath("/dashboard/owners"); redirect(`/dashboard/owners/${ownerId}`); }

  const input: Record<string, unknown> = {
    internal_name: internalName,
    slug,
    owner_id: ownerId,
    district: raw.district ? String(raw.district).trim() : null,
    bedrooms: raw.bedrooms ? Number(raw.bedrooms) : null,
    capacity: raw.capacity ? Number(raw.capacity) : null,
    property_type: raw.property_type ? String(raw.property_type).trim() : "apartment",
    management_status: "contract_pending",
    is_published: false,
  };

  const result = await insertWithCompany("apartments", input) as { error?: { message?: string; details?: string } };
  if (result.error) {
    logger.error("createPropertyFromOwnerAction failed", result.error);
    redirectFormError(`/dashboard/owners/${ownerId}`, databaseErrorMessage(result.error));
  }

  revalidatePath("/dashboard/owners");
  revalidatePath(`/dashboard/owners/${ownerId}`);
  revalidatePath("/dashboard/apartments");
  redirect("/dashboard/apartments");
}

// ─── Maintenance Tasks ───

export async function createMaintenanceTaskAction(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData);
  const title = String(raw.title ?? "").trim();
  const apartmentId = raw.apartment_id ? String(raw.apartment_id).trim() : null;
  const ownerId = raw.owner_id ? String(raw.owner_id).trim() : null;

  if (!title) redirectFormError("/dashboard/maintenance/new", "Le titre est requis.");
  if (apartmentId) requireValidUUID(apartmentId, "apartment");
  if (ownerId) requireValidUUID(ownerId, "owner");

  if (isDemo()) { logger.info("[DEMO] createMaintenanceTaskAction", raw); revalidatePath("/dashboard/owners"); return; }

  if (!hasSupabaseEnv()) { logger.error("createMaintenanceTaskAction: Supabase non configure"); return; }

  const admin = createSupabaseAdminClient();
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirectFormError("/dashboard/maintenance/new", "Profil entreprise introuvable.");

  const input: Record<string, unknown> = {
    title,
    apartment_id: apartmentId,
    owner_id: ownerId,
    company_id: companyId,
    priority: raw.priority ? String(raw.priority).trim() : "medium",
    category: raw.category ? String(raw.category).trim() : null,
    description: raw.description ? String(raw.description).trim() : null,
    estimated_cost: raw.estimated_cost ? Number(raw.estimated_cost) : null,
    due_date: raw.due_date ? String(raw.due_date).trim() : null,
    status: "open",
  };

  const { data, error } = await admin.from("maintenance_tasks").insert([input]).select("id").single();
  if (error) {
    logger.error("createMaintenanceTaskAction failed", error);
    redirectFormError("/dashboard/maintenance/new", databaseErrorMessage(error));
  }

  logger.info("Maintenance task created", { id: data.id, title });

  if (apartmentId) {
    revalidatePath(`/dashboard/apartments/${apartmentId}`);
  }
  if (ownerId) {
    revalidatePath(`/dashboard/owners/${ownerId}`);
  }
  revalidatePath("/dashboard/maintenance");
}

// ─── Apartment Publish Toggle ───

export async function toggleApartmentPublishAction(id: string): Promise<void> {
  requireValidUUID(id, "appartement");
  if (isDemo()) { logger.info("[DEMO] toggleApartmentPublishAction", { id }); revalidatePath("/dashboard/apartments"); return; }

  const admin = createSupabaseAdminClient();

  const { data: apartment, error: fetchError } = await admin.from("apartments").select("is_published, slug").eq("id", id).single();
  if (fetchError || !apartment) {
    logger.error("toggleApartmentPublishAction: appartement introuvable", fetchError);
    return;
  }

  const currentlyPublished = apartment.is_published;
  const updates: Record<string, unknown> = {};

  if (currentlyPublished) {
    updates.is_published = false;
    updates.management_status = "active";
    updates.published_at = null;
  } else {
    updates.is_published = true;
    updates.management_status = "published";
    updates.published_at = new Date().toISOString();
  }

  const { error } = await admin.from("apartments").update(updates).eq("id", id);
  if (error) {
    logger.error("toggleApartmentPublishAction failed", error);
    return;
  }

  logger.info("Apartment publish toggled", { id, wasPublished: currentlyPublished, now: !currentlyPublished });

  revalidatePath("/dashboard/apartments");
  revalidatePath(`/dashboard/apartments/${id}`);
  revalidatePath("/apartments");
  if (apartment.slug) revalidatePath(`/apartments/${apartment.slug}`);
}

// ─── Attach Apartment to Owner ───

export async function attachApartmentToOwnerAction(ownerId: string, formData: FormData): Promise<void> {
  requireValidUUID(ownerId, "propriétaire");
  if (isDemo()) { logger.info("[DEMO] attachApartmentToOwnerAction", { ownerId }); revalidatePath(`/dashboard/owners/${ownerId}`); return; }

  const apartmentId = formData.get("apartment_id");
  if (!apartmentId || typeof apartmentId !== "string") redirectFormError(`/dashboard/owners/${ownerId}`, "Sélectionnez un appartement.");
  requireValidUUID(apartmentId, "appartement");

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("apartments").update({ owner_id: ownerId }).eq("id", apartmentId).is("owner_id", null);
  if (error) {
    logger.error("attachApartmentToOwnerAction failed", error);
    redirectFormError(`/dashboard/owners/${ownerId}`, databaseErrorMessage(error));
  }

  revalidatePath("/dashboard/apartments");
  revalidatePath(`/dashboard/apartments/${apartmentId}`);
  revalidatePath("/dashboard/owners");
  revalidatePath(`/dashboard/owners/${ownerId}`);
}
