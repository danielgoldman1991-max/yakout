import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { logger } from "@/lib/utils/logger";
import type { Owner, Apartment, Document, Payment, Expense, Reservation, MaintenanceTask, OwnerStatement, OwnerPayout } from "@/types/business";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return uuidRegex.test(value);
}

function isServer() {
  return typeof window === "undefined";
}

async function getClient() {
  if (isServer()) {
    return createSupabaseServerClient();
  }
  return getSupabaseBrowserClient();
}

function isDemo(): boolean {
  return !hasSupabaseEnv();
}

function demoWarning(entity: string) {
  logger.info(`[DEMO] ${entity} called`);
}

// ─── Owners CRUD ───

export async function getOwners(options?: { status?: string; search?: string }): Promise<Owner[]> {
  if (isDemo()) { demoWarning("getOwners"); return []; }
  const supabase = await getClient();
  try {
    let query = supabase.from("owners").select("*").order("created_at", { ascending: false });
    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.search) {
      const search = `%${options.search}%`;
      query = query.or(`full_name.ilike.${search},phone.ilike.${search},email.ilike.${search}`);
    }
    const { data, error } = await query;
    if (error) {
      logger.error(`getOwners failed: ${error?.message ?? String(error)}`);
      return [];
    }
    return data as Owner[];
  } catch (err) {
    logger.error(`getOwners threw: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function getOwnerById(id: string): Promise<Owner | null> {
  if (!isUUID(id)) return null;
  if (isDemo()) { demoWarning("getOwnerById"); return null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("owners").select("*").eq("id", id).maybeSingle();
  if (error) {
    logger.error(`getOwnerById failed: ${error?.message ?? String(error)}`);
    return null;
  }
  return data as Owner | null;
}

export async function createOwner(input: Partial<Owner>): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createOwner"); return { error: "Supabase n'est pas configure." }; }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("owners").insert([input]).select("id").single();
  if (error) {
    logger.error(`createOwner failed: ${error?.message ?? String(error)}`);
    return { error: error.message };
  }
  if (!data?.id) {
    logger.error("createOwner: aucun id retourne par l'insert", { input });
    return { error: "Propriétaire créé sans identifiant retourné." };
  }
  logger.info("Owner created", { id: data.id, name: input.full_name });
  return { id: data.id };
}

export async function updateOwner(id: string, input: Partial<Owner>): Promise<{ ok: boolean; error?: string }> {
  if (!isUUID(id)) return { ok: false, error: "ID invalide." };
  if (isDemo()) { demoWarning("updateOwner"); return { ok: true }; }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("owners").update(input).eq("id", id);
  if (error) {
    logger.error(`updateOwner failed: ${error?.message ?? String(error)}`);
    return { ok: false, error: error.message };
  }
  logger.info("Owner updated", { id });
  return { ok: true };
}

export async function deleteOwner(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isUUID(id)) return { ok: false, error: "ID invalide." };
  if (isDemo()) { demoWarning("deleteOwner"); return { ok: true }; }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("owners").delete().eq("id", id);
  if (error) {
    logger.error(`deleteOwner failed: ${error?.message ?? String(error)}`);
    return { ok: false, error: error.message };
  }
  logger.info("Owner deleted", { id });
  return { ok: true };
}

// ─── Owner Properties ───

export async function getOwnerProperties(ownerId: string): Promise<Apartment[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerProperties"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("apartments").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) {
    logger.error(`getOwnerProperties failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return data as Apartment[];
}

export async function getOwnerDocuments(ownerId: string): Promise<Document[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerDocuments"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("documents").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) {
    logger.error(`getOwnerDocuments failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return data as Document[];
}

// ─── Owner Finances ───

export async function getOwnerFinancialSummary(ownerId: string): Promise<{
  grossRevenue: number;
  expensesTotal: number;
  estimatedCommission: number;
  netAmount: number;
}> {
  if (!isUUID(ownerId)) return { grossRevenue: 0, expensesTotal: 0, estimatedCommission: 0, netAmount: 0 };
  if (isDemo()) { demoWarning("getOwnerFinancialSummary"); return { grossRevenue: 0, expensesTotal: 0, estimatedCommission: 0, netAmount: 0 }; }
  const supabase = await getClient();

  const { data: properties } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  let grossRevenue = 0;
  let expensesTotal = 0;

  if (propertyIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .in("apartment_id", propertyIds);
    if (!paymentsError && payments) {
      grossRevenue = payments.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
    } else {
      logger.error(`getOwnerFinancialSummary payments failed: ${paymentsError?.message ?? String(paymentsError)}`);
    }

    const { data: expensesByApartment, error: expensesApartmentError } = await supabase
      .from("expenses")
      .select("amount")
      .in("apartment_id", propertyIds);
    if (!expensesApartmentError && expensesByApartment) {
      expensesTotal = expensesByApartment.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
    } else {
      logger.error(`getOwnerFinancialSummary expenses (by apartment) failed: ${expensesApartmentError?.message ?? String(expensesApartmentError)}`);
    }
  }

  try {
    const { data: paymentsDirect, error: paymentsDirectError } = await supabase
      .from("payments")
      .select("amount")
      .eq("owner_id", ownerId);
    if (!paymentsDirectError && paymentsDirect) {
      grossRevenue += paymentsDirect.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
    } else if (paymentsDirectError) {
      logger.error(`getOwnerFinancialSummary direct payments failed: ${paymentsDirectError?.message ?? String(paymentsDirectError)}`);
    }
  } catch { /* column may not exist */ }

  try {
    const { data: expensesDirect, error: expensesDirectError } = await supabase
      .from("expenses")
      .select("amount")
      .eq("owner_id", ownerId);
    if (!expensesDirectError && expensesDirect) {
      expensesTotal += expensesDirect.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
    } else if (expensesDirectError) {
      logger.error(`getOwnerFinancialSummary direct expenses failed: ${expensesDirectError?.message ?? String(expensesDirectError)}`);
    }
  } catch { /* column may not exist */ }

  const estimatedCommission = grossRevenue * 0.2;
  const netAmount = grossRevenue - estimatedCommission - expensesTotal;

  return { grossRevenue, expensesTotal, estimatedCommission, netAmount };
}

export async function getOwnerPayments(ownerId: string): Promise<Payment[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerPayments"); return []; }
  const supabase = await getClient();

  const { data: properties } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  const payments: Payment[] = [];

  if (propertyIds.length > 0) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .in("apartment_id", propertyIds)
      .order("paid_at", { ascending: false });
    if (error) {
      logger.error(`getOwnerPayments by apartment failed: ${error?.message ?? String(error)}`);
    } else if (data) {
      payments.push(...(data as Payment[]));
    }
  }

  const { data: directPayments, error: directError } = await supabase
    .from("payments")
    .select("*")
    .eq("owner_id", ownerId)
    .order("paid_at", { ascending: false });
  if (directError) {
    logger.error(`getOwnerPayments direct failed: ${directError?.message ?? String(directError)}`);
  } else if (directPayments) {
    const existingIds = new Set(payments.map((p) => p.id));
    for (const p of directPayments as Payment[]) {
      if (!existingIds.has(p.id)) {
        payments.push(p);
      }
    }
  }

  payments.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  return payments;
}

export async function getOwnerExpenses(ownerId: string): Promise<Expense[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerExpenses"); return []; }
  const supabase = await getClient();

  const { data: properties } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  const expenses: Expense[] = [];

  if (propertyIds.length > 0) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .in("apartment_id", propertyIds)
      .order("expense_date", { ascending: false });
    if (error) {
      logger.error(`getOwnerExpenses by apartment failed: ${error?.message ?? String(error)}`);
    } else if (data) {
      expenses.push(...(data as Expense[]));
    }
  }

  const { data: directExpenses, error: directError } = await supabase
    .from("expenses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("expense_date", { ascending: false });
  if (directError) {
    logger.error(`getOwnerExpenses direct failed: ${directError?.message ?? String(directError)}`);
  } else if (directExpenses) {
    const existingIds = new Set(expenses.map((e) => e.id));
    for (const e of directExpenses as Expense[]) {
      if (!existingIds.has(e.id)) {
        expenses.push(e);
      }
    }
  }

  expenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  return expenses;
}

export async function getOwnerReservations(ownerId: string): Promise<Reservation[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerReservations"); return []; }
  const supabase = await getClient();

  const { data: properties } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  if (propertyIds.length === 0) return [];

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .in("apartment_id", propertyIds)
    .order("check_in", { ascending: false });
  if (error) {
    logger.error(`getOwnerReservations failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return data as Reservation[];
}

// ─── Maintenance ───

export async function getMaintenanceTasks(apartmentId?: string, ownerId?: string): Promise<MaintenanceTask[]> {
  if (isDemo()) { demoWarning("getMaintenanceTasks"); return []; }
  const supabase = await getClient();
  try {
    let query = supabase.from("maintenance_tasks").select("*").order("created_at", { ascending: false });
    if (apartmentId) {
      if (!isUUID(apartmentId)) return [];
      query = query.eq("apartment_id", apartmentId);
    }
    if (ownerId) {
      if (!isUUID(ownerId)) return [];
      query = query.eq("owner_id", ownerId);
    }
    const { data, error } = await query;
    if (error) {
      logger.error(`getMaintenanceTasks failed: ${error?.message ?? String(error)}`);
      return [];
    }
    return data as MaintenanceTask[];
  } catch (err) {
    logger.error(`getMaintenanceTasks threw: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function createMaintenanceTask(input: Partial<MaintenanceTask>): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createMaintenanceTask"); return { error: "Supabase n'est pas configure." }; }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("maintenance_tasks").insert([input]).select("id").single();
  if (error) {
    logger.error(`createMaintenanceTask failed: ${error?.message ?? String(error)}`);
    return { error: error.message };
  }
  logger.info("Maintenance task created", { id: data.id, title: input.title });
  return { id: data.id };
}

export async function updateMaintenanceTask(id: string, input: Partial<MaintenanceTask>): Promise<{ ok: boolean; error?: string }> {
  if (!isUUID(id)) return { ok: false, error: "ID invalide." };
  if (isDemo()) { demoWarning("updateMaintenanceTask"); return { ok: true }; }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("maintenance_tasks").update(input).eq("id", id);
  if (error) {
    logger.error(`updateMaintenanceTask failed: ${error?.message ?? String(error)}`);
    return { ok: false, error: error.message };
  }
  logger.info("Maintenance task updated", { id });
  return { ok: true };
}

// ─── Owner Statements & Payouts ───

export async function getOwnerStatements(ownerId: string): Promise<OwnerStatement[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerStatements"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("owner_statements").select("*").eq("owner_id", ownerId).order("period_start", { ascending: false });
  if (error) {
    logger.error(`getOwnerStatements failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return data as OwnerStatement[];
}

export async function createOwnerStatement(input: Partial<OwnerStatement>): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createOwnerStatement"); return { error: "Supabase n'est pas configure." }; }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("owner_statements").insert([input]).select("id").single();
  if (error) {
    logger.error(`createOwnerStatement failed: ${error?.message ?? String(error)}`);
    return { error: error.message };
  }
  logger.info("Owner statement created", { id: data.id });
  return { id: data.id };
}

export async function getOwnerPayouts(ownerId: string): Promise<OwnerPayout[]> {
  if (!isUUID(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerPayouts"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("owner_payouts").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) {
    logger.error(`getOwnerPayouts failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return data as OwnerPayout[];
}

export async function createOwnerPayout(input: Partial<OwnerPayout>): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createOwnerPayout"); return { error: "Supabase n'est pas configure." }; }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("owner_payouts").insert([input]).select("id").single();
  if (error) {
    logger.error(`createOwnerPayout failed: ${error?.message ?? String(error)}`);
    return { error: error.message };
  }
  logger.info("Owner payout created", { id: data.id });
  return { id: data.id };
}

// ─── Lead Conversion ───

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-_().]/g, "").replace(/^00212/, "+212").replace(/^0/, "+212");
}

function cleanText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function leadMetadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return String(value);
  return cleanText(value);
}

function buildOwnerNotesFromLead(lead: Record<string, unknown>): string {
  const metadata = lead.metadata;
  const lines = [
    cleanText(lead.message) ? `Message: ${cleanText(lead.message)}` : null,
    leadMetadataValue(metadata, "property_type") ? `Type de bien: ${leadMetadataValue(metadata, "property_type")}` : null,
    leadMetadataValue(metadata, "district") || cleanText(lead.district) ? `Quartier: ${leadMetadataValue(metadata, "district") ?? cleanText(lead.district)}` : null,
    leadMetadataValue(metadata, "bedrooms") ? `Chambres: ${leadMetadataValue(metadata, "bedrooms")}` : null,
    leadMetadataValue(metadata, "furnished") ? `Meuble: ${leadMetadataValue(metadata, "furnished")}` : null,
    leadMetadataValue(metadata, "already_listed") ? `Deja liste: ${leadMetadataValue(metadata, "already_listed")}` : null,
    leadMetadataValue(metadata, "owner_goal") ? `Objectif: ${leadMetadataValue(metadata, "owner_goal")}` : null,
    leadMetadataValue(metadata, "callback_availability") ? `Disponibilite rappel: ${leadMetadataValue(metadata, "callback_availability")}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : "Cree depuis un lead proprietaire.";
}

export async function findOwnerByEmailOrPhone(email?: string, phone?: string): Promise<Owner | null> {
  if (isDemo()) { demoWarning("findOwnerByEmailOrPhone"); return null; }
  if (!email && !phone) return null;
  const admin = createSupabaseAdminClient();

  if (email) {
    const { data, error } = await admin.from("owners").select("*").eq("email", email).maybeSingle();
    if (!error && data) return data as Owner;
  }

  if (phone) {
    const normalized = normalizePhone(phone);
    const { data, error } = await admin.from("owners").select("*").eq("phone", normalized).maybeSingle();
    if (!error && data) return data as Owner;
  }

  return null;
}

export async function convertLeadToOwner(leadId: string): Promise<{ ownerId?: string; error?: string }> {
  if (!isUUID(leadId)) return { error: "ID de lead invalide." };
  if (isDemo()) { demoWarning("convertLeadToOwner"); return { error: "Supabase n'est pas configure." }; }

  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (leadError) {
    logger.error(`convertLeadToOwner: lead introuvable: ${leadError?.message ?? String(leadError)}`);
    return { error: leadError.message };
  }
  if (!lead) {
    return { error: "Lead introuvable." };
  }

  const leadRecord = lead as Record<string, unknown>;

  const linkedOwnerId = cleanText(leadRecord.owner_id);
  if (linkedOwnerId && isUUID(linkedOwnerId)) {
    const { data: linkedOwner, error: linkedOwnerError } = await admin.from("owners").select("id").eq("id", linkedOwnerId).maybeSingle();
    if (linkedOwnerError) {
      logger.error(`convertLeadToOwner: verification proprietaire lie echouee: ${linkedOwnerError.message}`);
      return { error: linkedOwnerError.message };
    }
    if (linkedOwner?.id) {
      return { ownerId: linkedOwner.id as string };
    }
  }

  const existing = await findOwnerByEmailOrPhone(
    cleanText(leadRecord.email),
    cleanText(leadRecord.phone),
  );
  if (existing) {
    const update = { owner_id: existing.id, status: "converted", converted_at: new Date().toISOString() };
    const { error: updateError } = await admin.from("leads").update(update).eq("id", leadId);
    if (updateError) {
      logger.error(`convertLeadToOwner: liaison lead/proprietaire existant echouee: ${updateError.message}`);
      return { error: updateError.message };
    }
    logger.info("Lead converted to existing owner", { leadId, ownerId: existing.id });
    return { ownerId: existing.id };
  }

  const phone = cleanText(leadRecord.phone);
  if (!phone) return { error: "Le telephone du lead est requis pour creer un proprietaire." };
  const companyId = cleanText(leadRecord.company_id);
  if (!companyId) return { error: "Aucune entreprise n'est rattachee a ce lead. Rattachez d'abord la demande a Yakout." };

  const { data: newOwner, error: createError } = await admin.from("owners").insert([{
    full_name: cleanText(leadRecord.name) ?? "Proprietaire Yakout",
    phone: normalizePhone(phone),
    email: cleanText(leadRecord.email) ?? null,
    city: leadMetadataValue(leadRecord.metadata, "city") ?? "Marrakech",
    country: "Maroc",
    preferred_contact_channel: "whatsapp",
    source: cleanText(leadRecord.source) ?? "Lead conversion",
    status: "lead_received",
    lead_id: leadId,
    notes: buildOwnerNotesFromLead(leadRecord),
    company_id: companyId,
  }]).select("id").single();

  if (createError || !newOwner) {
    logger.error(`convertLeadToOwner: creation proprietaire echouee: ${createError?.message ?? String(createError)}`);
    return { error: createError?.message ?? "Echec creation proprietaire." };
  }
  if (!newOwner.id || !isUUID(newOwner.id as string)) {
    return { error: "Proprietaire cree sans identifiant valide retourne." };
  }

  const { error: updateError } = await admin.from("leads").update({ owner_id: newOwner.id, status: "converted", converted_at: new Date().toISOString() }).eq("id", leadId);
  if (updateError) {
    logger.error(`convertLeadToOwner: mise a jour lead apres creation echouee: ${updateError.message}`);
    return { error: updateError.message };
  }

  logger.info("Lead converted to new owner", { leadId, ownerId: newOwner.id });
  return { ownerId: newOwner.id };
}

// ─── Dashboard KPIs ───

export async function getOwnersKpi(): Promise<{ activeOwners: number; totalProperties: number; contractsPending: number; readyToPublish: number }> {
  const fallback = { activeOwners: 0, totalProperties: 0, contractsPending: 0, readyToPublish: 0 };
  if (isDemo()) { demoWarning("getOwnersKpi"); return fallback; }
  const supabase = await getClient();

  try {
    let activeOwners = 0;
    let totalProperties = 0;
    let contractsPending = 0;
    let readyToPublish = 0;

    const { count: ac, error: ae } = await supabase
      .from("owners")
      .select("*", { count: "exact", head: true })
      .in("status", ["active_management", "published"]);
    if (!ae) activeOwners = ac ?? 0;

    try {
      const { count: tp, error: pe } = await supabase
        .from("apartments")
        .select("*", { count: "exact", head: true })
        .not("owner_id", "is", null);
      if (!pe) totalProperties = tp ?? 0;
    } catch { /* column may not exist */ }

    const { count: cp, error: ce } = await supabase
      .from("owners")
      .select("*", { count: "exact", head: true })
      .eq("status", "contract_pending");
    if (!ce) contractsPending = cp ?? 0;

    const { count: rp, error: re } = await supabase
      .from("owners")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_to_publish");
    if (!re) readyToPublish = rp ?? 0;

    return { activeOwners, totalProperties, contractsPending, readyToPublish };
  } catch (err) {
    logger.error(`getOwnersKpi failed: ${err instanceof Error ? err.message : String(err)}`);
    return fallback;
  }
}

export async function getUnassignedApartments(): Promise<Apartment[]> {
  if (isDemo()) { demoWarning("getUnassignedApartments"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .is("owner_id", null)
    .order("created_at", { ascending: false });
  if (error) {
    logger.error(`getUnassignedApartments failed: ${error?.message ?? String(error)}`);
    return [];
  }
  return (data ?? []) as Apartment[];
}

