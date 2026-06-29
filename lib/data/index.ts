import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  apartments as mockApartments,
  vehicles as mockVehicles,
  reservations as mockReservations,
  trips as mockTrips,
  payments as mockPayments,
  expenses as mockExpenses,
  blogPosts as mockBlogPosts,
  services as mockServices,
  sitePages as mockSitePages,
} from "@/lib/constants/mock-data";
import type { Lead, Client, Apartment, Vehicle, Reservation, Trip, Payment, Expense, Partner } from "@/types/business";
import type { BlogPost, PublicService, SitePage } from "@/types/cms";

type ApartmentRow = Apartment & {
  apartment_images?: Array<{ url: string; alt_text?: string | null; display_order?: number | null }>;
};

type ApartmentImageRow = {
  apartment_id: string;
  url: string;
  alt_text?: string | null;
  display_order?: number | null;
};

function isServer() {
  return typeof window === "undefined";
}

async function getClient() {
  if (isServer()) {
    return createSupabaseServerClient();
  }
  return getSupabaseBrowserClient();
}

async function getServerAdminClient(): Promise<SupabaseClient | null> {
  if (!isServer() || isDemo()) return null;

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    return createSupabaseAdminClient();
  } catch (error) {
    logger.warn("Client Supabase serveur indisponible, lecture publique standard utilisee", error);
    return null;
  }
}

function isDemo(): boolean {
  return false;
}

function demoWarning(_entity: string) {
  void _entity;
}

function publicFallback<T>(entity: string, error: unknown, fallback: T): T {
  logger.warn(`${entity} indisponible dans Supabase, fallback local utilise`, error);
  return fallback;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return uuidRegex.test(value);
}

function mapApartment(row: ApartmentRow): Apartment {
  const primaryImage = row.apartment_images?.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
  return {
    ...row,
    image_url: row.image_url ?? primaryImage?.url,
    image_alt_text: row.image_alt_text ?? primaryImage?.alt_text ?? undefined,
  };
}

async function mapApartmentsWithImagesFrom(supabase: SupabaseClient, rows: ApartmentRow[]): Promise<Apartment[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from("apartment_images")
    .select("apartment_id, url, alt_text, display_order")
    .in("apartment_id", ids);

  if (error) {
    logger.warn("apartment_images indisponible, appartements affiches sans images liees", error);
    return rows.map(mapApartment);
  }

  const imagesByApartment = new Map<string, ApartmentImageRow[]>();
  for (const image of (data ?? []) as ApartmentImageRow[]) {
    const existing = imagesByApartment.get(image.apartment_id) ?? [];
    existing.push(image);
    imagesByApartment.set(image.apartment_id, existing);
  }

  return rows.map((row) => mapApartment({ ...row, apartment_images: imagesByApartment.get(row.id) ?? [] }));
}

// ─── Leads ───

export async function getLeads(): Promise<Lead[]> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    logger.error("getLeads failed", error);
    return [];
  }
  return data as Lead[];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) {
    logger.error("getLeadById failed", error);
    return null;
  }
  return data as Lead;
}

export async function createLead(input: Partial<Lead>): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getClient();
  const { error } = await supabase.from("leads").insert([{ ...input, status: "new" }]);
  if (error) { logger.error("createLead failed", error); return { ok: false, error: error.message }; }
  logger.info("Lead created", { name: input.name, type: input.request_type });
  return { ok: true };
}

export async function updateLead(id: string, input: Partial<Lead>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateLead"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("leads").update(input).eq("id", id);
  if (error) { logger.error("updateLead failed", error); return { ok: false, error: error.message }; }
  logger.info("Lead updated", { id });
  return { ok: true };
}

export async function deleteLead(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteLead"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) { logger.error("deleteLead failed", error); return { ok: false, error: error.message }; }
  logger.info("Lead deleted", { id });
  return { ok: true };
}

// ─── Clients ───

export async function getClients(): Promise<Client[]> {
  if (isDemo()) { demoWarning("getClients"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getClients", error, []);
  return data as Client[];
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!isUUID(id)) return null;
  if (isDemo()) { demoWarning("getClientById"); return null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) return publicFallback("getClientById", error, null);
  return data as Client;
}

export async function createClient(input: Partial<Client>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createClient"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("clients").insert([input]);
  if (error) { logger.error("createClient failed", error); return { ok: false, error: error.message }; }
  logger.info("Client created", { name: input.full_name });
  return { ok: true };
}

export async function updateClient(id: string, input: Partial<Client>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateClient"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("clients").update(input).eq("id", id);
  if (error) { logger.error("updateClient failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteClient(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteClient"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) { logger.error("deleteClient failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Apartments ───

export async function getApartmentById(id: string): Promise<Apartment | null> {
  if (isDemo()) { demoWarning("getApartmentById"); return mockApartments.find((a) => a.id === id) ?? null; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  if (!isUUID(id)) {
    const { data: bySlug } = await supabase.from("apartments").select("*").eq("slug", id).single();
    if (!bySlug) return null;
    return (await mapApartmentsWithImagesFrom(supabase, [bySlug as ApartmentRow]))[0] ?? null;
  }
  const { data, error } = await supabase.from("apartments").select("*").eq("id", id).single();
  if (error) return publicFallback("getApartmentById", error, mockApartments.find((a) => a.id === id) ?? null);
  const [apartment] = await mapApartmentsWithImagesFrom(supabase, [data as ApartmentRow]);
  return apartment;
}

export async function getApartments(): Promise<Apartment[]> {
  if (isDemo()) { demoWarning("getApartments"); return [...mockApartments]; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("apartments").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getApartments", error, [...mockApartments]);
  return mapApartmentsWithImagesFrom(supabase, data as ApartmentRow[]);
}

export async function getDashboardApartments(): Promise<Apartment[]> {
  if (isDemo()) { demoWarning("getDashboardApartments"); return [...mockApartments]; }

  const serverClient = await getClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError || !user) {
    logger.warn("getDashboardApartments: session introuvable", userError);
    return [];
  }

  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    logger.warn("getDashboardApartments: profil entreprise introuvable", profileError);
    return [];
  }

  const { data, error } = await admin
    .from("apartments")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("getDashboardApartments failed", error);
    return [];
  }

  return mapApartmentsWithImagesFrom(admin, data as ApartmentRow[]);
}

export async function getDashboardApartmentById(id: string): Promise<Apartment | null> {
  if (isDemo()) { demoWarning("getDashboardApartmentById"); return mockApartments.find((a) => a.id === id) ?? null; }

  const serverClient = await getClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError || !user) {
    logger.warn("getDashboardApartmentById: session introuvable", userError);
    return null;
  }

  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    logger.warn("getDashboardApartmentById: profil entreprise introuvable", profileError);
    return null;
  }

  const { data, error } = await admin
    .from("apartments")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (error) {
    logger.warn("getDashboardApartmentById: appartement introuvable", error);
    return null;
  }

  const [apartment] = await mapApartmentsWithImagesFrom(admin, [data as ApartmentRow]);
  return apartment ?? null;
}

export async function getPublishedApartments(): Promise<Apartment[]> {
  if (isDemo()) { demoWarning("getPublishedApartments"); return mockApartments.filter((a) => a.is_published); }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("apartments").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (error) return publicFallback("getPublishedApartments", error, mockApartments.filter((a) => a.is_published));
  return mapApartmentsWithImagesFrom(supabase, data as ApartmentRow[]);
}

export async function getPublicApartments(): Promise<Apartment[]> {
  if (isDemo()) { demoWarning("getPublicApartments"); return [...mockApartments]; }

  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return publicFallback("getPublicApartments", error, [...mockApartments]);
  return mapApartmentsWithImagesFrom(supabase, data as ApartmentRow[]);
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  if (isDemo()) { demoWarning("getApartmentBySlug"); return mockApartments.find((a) => a.slug === slug) ?? null; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("apartments").select("*").eq("slug", slug).single();
  if (error) return publicFallback("getApartmentBySlug", error, mockApartments.find((a) => a.slug === slug) ?? null);
  const [apartment] = await mapApartmentsWithImagesFrom(supabase, [data as ApartmentRow]);
  return apartment;
}

export async function createApartment(input: Partial<Apartment>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createApartment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("apartments").insert([input]);
  if (error) { logger.error("createApartment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateApartment(id: string, input: Partial<Apartment>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateApartment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("apartments").update(input).eq("id", id);
  if (error) { logger.error("updateApartment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteApartment(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteApartment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("apartments").delete().eq("id", id);
  if (error) { logger.error("deleteApartment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Vehicles ───

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (isDemo()) { demoWarning("getVehicleById"); return mockVehicles.find((v) => v.id === id) ?? null; }
  const supabase = await getClient();
  if (!isUUID(id)) {
    const { data: bySlug } = await supabase.from("vehicles").select("*").eq("slug", id).single();
    if (!bySlug) return null;
    return bySlug as Vehicle;
  }
  const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (error) return publicFallback("getVehicleById", error, mockVehicles.find((v) => v.id === id) ?? null);
  return data as Vehicle;
}

export async function getVehicles(): Promise<Vehicle[]> {
  if (isDemo()) { demoWarning("getVehicles"); return [...mockVehicles]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getVehicles", error, [...mockVehicles]);
  return data as Vehicle[];
}

export async function getPublishedVehicles(): Promise<Vehicle[]> {
  if (isDemo()) { demoWarning("getPublishedVehicles"); return mockVehicles.filter((v) => v.is_published); }
  const supabase = await getClient();
  const { data, error } = await supabase.from("vehicles").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (error) return publicFallback("getPublishedVehicles", error, mockVehicles.filter((v) => v.is_published));
  return data as Vehicle[];
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (isDemo()) { demoWarning("getVehicleBySlug"); return mockVehicles.find((v) => v.slug === slug) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("vehicles").select("*").eq("slug", slug).single();
  if (error) return publicFallback("getVehicleBySlug", error, mockVehicles.find((v) => v.slug === slug) ?? null);
  return data as Vehicle;
}

export async function createVehicle(input: Partial<Vehicle>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createVehicle"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("vehicles").insert([input]);
  if (error) { logger.error("createVehicle failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateVehicle(id: string, input: Partial<Vehicle>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateVehicle"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("vehicles").update(input).eq("id", id);
  if (error) { logger.error("updateVehicle failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteVehicle(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteVehicle"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) { logger.error("deleteVehicle failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Reservations ───

export async function getReservationById(id: string): Promise<Reservation | null> {
  if (isDemo()) { demoWarning("getReservationById"); return mockReservations.find((r) => r.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("reservations").select("*").eq("id", id).single();
  if (error) return publicFallback("getReservationById", error, mockReservations.find((r) => r.id === id) ?? null);
  return data as Reservation;
}

export async function getReservations(): Promise<Reservation[]> {
  if (isDemo()) { demoWarning("getReservations"); return [...mockReservations]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("reservations").select("*").order("check_in", { ascending: false });
  if (error) return publicFallback("getReservations", error, [...mockReservations]);
  return data as Reservation[];
}

export async function createReservation(input: Partial<Reservation>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createReservation"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("reservations").insert([input]);
  if (error) { logger.error("createReservation failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateReservation(id: string, input: Partial<Reservation>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateReservation"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("reservations").update(input).eq("id", id);
  if (error) { logger.error("updateReservation failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteReservation(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteReservation"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) { logger.error("deleteReservation failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Trips ───

export async function getTripById(id: string): Promise<Trip | null> {
  if (isDemo()) { demoWarning("getTripById"); return mockTrips.find((t) => t.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error) return publicFallback("getTripById", error, mockTrips.find((t) => t.id === id) ?? null);
  return data as Trip;
}

export async function getTrips(): Promise<Trip[]> {
  if (isDemo()) { demoWarning("getTrips"); return [...mockTrips]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("trips").select("*").order("trip_date", { ascending: false });
  if (error) return publicFallback("getTrips", error, [...mockTrips]);
  return data as Trip[];
}

export async function createTrip(input: Partial<Trip>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createTrip"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").insert([input]);
  if (error) { logger.error("createTrip failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateTrip(id: string, input: Partial<Trip>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateTrip"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").update(input).eq("id", id);
  if (error) { logger.error("updateTrip failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteTrip(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteTrip"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) { logger.error("deleteTrip failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Payments ───

export async function getPayments(): Promise<Payment[]> {
  if (isDemo()) { demoWarning("getPayments"); return [...mockPayments]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("payments").select("*").order("paid_at", { ascending: false });
  if (error) return publicFallback("getPayments", error, [...mockPayments]);
  return data as Payment[];
}

export async function createPayment(input: Partial<Payment>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createPayment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("payments").insert([input]);
  if (error) { logger.error("createPayment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  if (isDemo()) { demoWarning("getPaymentById"); return mockPayments.find((p) => p.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("payments").select("*").eq("id", id).single();
  if (error) return publicFallback("getPaymentById", error, mockPayments.find((p) => p.id === id) ?? null);
  return data as Payment;
}

export async function updatePayment(id: string, input: Partial<Payment>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updatePayment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("payments").update(input).eq("id", id);
  if (error) { logger.error("updatePayment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deletePayment(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deletePayment"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) { logger.error("deletePayment failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Expenses ───

export async function getExpenses(): Promise<Expense[]> {
  if (isDemo()) { demoWarning("getExpenses"); return [...mockExpenses]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
  if (error) return publicFallback("getExpenses", error, [...mockExpenses]);
  return data as Expense[];
}

export async function createExpense(input: Partial<Expense>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createExpense"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("expenses").insert([input]);
  if (error) { logger.error("createExpense failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  if (isDemo()) { demoWarning("getExpenseById"); return mockExpenses.find((e) => e.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (error) return publicFallback("getExpenseById", error, mockExpenses.find((e) => e.id === id) ?? null);
  return data as Expense;
}

export async function updateExpense(id: string, input: Partial<Expense>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateExpense"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("expenses").update(input).eq("id", id);
  if (error) { logger.error("updateExpense failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteExpense"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) { logger.error("deleteExpense failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Blog Posts ───

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  if (isDemo()) { demoWarning("getBlogPostById"); return mockBlogPosts.find((p) => p.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (error) return publicFallback("getBlogPostById", error, mockBlogPosts.find((p) => p.id === id) ?? null);
  return data as BlogPost;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (isDemo()) { demoWarning("getBlogPosts"); return [...mockBlogPosts]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getBlogPosts", error, [...mockBlogPosts]);
  return data as BlogPost[];
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  if (isDemo()) { demoWarning("getPublishedBlogPosts"); return mockBlogPosts.filter((p) => p.status === "published"); }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error) return publicFallback("getPublishedBlogPosts", error, mockBlogPosts.filter((p) => p.status === "published"));
  return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isDemo()) { demoWarning("getBlogPostBySlug"); return mockBlogPosts.find((p) => p.slug === slug) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).single();
  if (error) return publicFallback("getBlogPostBySlug", error, mockBlogPosts.find((p) => p.slug === slug) ?? null);
  return data as BlogPost;
}

export async function createBlogPost(input: Partial<BlogPost>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createBlogPost"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").insert([input]);
  if (error) { logger.error("createBlogPost failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateBlogPost(id: string, input: Partial<BlogPost>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateBlogPost"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").update(input).eq("id", id);
  if (error) { logger.error("updateBlogPost failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteBlogPost"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) { logger.error("deleteBlogPost failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Services ───

export async function getServiceById(id: string): Promise<PublicService | null> {
  if (isDemo()) { demoWarning("getServiceById"); return mockServices.find((s) => s.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
  if (error) return publicFallback("getServiceById", error, mockServices.find((s) => s.id === id) ?? null);
  return data as PublicService;
}

export async function getPublishedServices(): Promise<PublicService[]> {
  if (isDemo()) { demoWarning("getPublishedServices"); return mockServices.filter((s) => s.is_published); }
  const supabase = await getClient();
  const { data, error } = await supabase.from("services").select("*").eq("is_published", true).order("display_order", { ascending: true });
  if (error) return publicFallback("getPublishedServices", error, mockServices.filter((s) => s.is_published));
  return data as PublicService[];
}

export async function getServices(): Promise<PublicService[]> {
  if (isDemo()) { demoWarning("getServices"); return [...mockServices]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("services").select("*").order("display_order", { ascending: true });
  if (error) return publicFallback("getServices", error, [...mockServices]);
  return data as PublicService[];
}

export async function createService(input: Partial<PublicService>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createService"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("services").insert([input]);
  if (error) { logger.error("createService failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateService(id: string, input: Partial<PublicService>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateService"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("services").update(input).eq("id", id);
  if (error) { logger.error("updateService failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteService(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteService"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) { logger.error("deleteService failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

// ─── Site Pages ───

export async function getSitePages(): Promise<SitePage[]> {
  if (isDemo()) { demoWarning("getSitePages"); return [...mockSitePages]; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("site_pages").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getSitePages", error, [...mockSitePages]);
  return data as SitePage[];
}

export async function getSitePageById(id: string): Promise<SitePage | null> {
  if (isDemo()) { demoWarning("getSitePageById"); return mockSitePages.find((p) => p.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("site_pages").select("*").eq("id", id).single();
  if (error) return publicFallback("getSitePageById", error, mockSitePages.find((p) => p.id === id) ?? null);
  return data as SitePage;
}

export async function createSitePage(input: Partial<SitePage>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createSitePage"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("site_pages").insert([input]);
  if (error) { logger.error("createSitePage failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteSitePage(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteSitePage"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("site_pages").delete().eq("id", id);
  if (error) { logger.error("deleteSitePage failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function getSitePageBySlug(slug: string): Promise<SitePage | null> {
  if (isDemo()) { demoWarning("getSitePageBySlug"); return mockSitePages.find((p) => p.slug === slug) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("site_pages").select("*").eq("slug", slug).single();
  if (error) { logger.error("getSitePageBySlug failed", error); return null; }
  return data as SitePage;
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  if (isDemo()) { demoWarning("getPartnerById"); return null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("partners").select("*").eq("id", id).single();
  if (error) { logger.error("getPartnerById failed", error); return null; }
  return data as Partner;
}

export async function getPartners(): Promise<Partner[]> {
  if (isDemo()) { demoWarning("getPartners"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("partners").select("*").order("name", { ascending: true });
  if (error) return publicFallback("getPartners", error, []);
  return (data ?? []) as Partner[];
}
