import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  apartments as mockApartments,
  payments as mockPayments,
  expenses as mockExpenses,
  blogPosts as mockBlogPosts,
  services as mockServices,
  sitePages as mockSitePages,
} from "@/lib/constants/mock-data";
import type { Lead, Client, Apartment, Vehicle, VehicleImage, Trip, Payment, Expense, Partner, Document } from "@/types/business";
import type { BlogPost, PublicService, SitePage } from "@/types/cms";
import { normalizeApartmentImage } from "@/lib/data/apartments";

type ApartmentRow = Apartment & {
  apartment_images?: Array<{ url?: string | null; alt_text?: string | null; display_order?: number | null; image_url?: string | null; image_alt_text?: string | null; sort_order?: number | null; is_cover?: boolean | null }>;
};

const publicApartmentViewSelect = [
  "id", "public_name", "slug", "district", "public_district", "property_type",
  "bedrooms", "bathrooms", "capacity", "price_from", "price_per_night", "currency",
  "short_description", "detailed_description", "amenities", "image_url", "image_alt_text",
  "public_status", "is_published", "is_featured", "published_at", "meta_title", "meta_description",
  "created_at", "updated_at",
].join(", ");

type ApartmentImageRow = {
  apartment_id: string;
  url?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
  image_alt_text?: string | null;
  display_order?: number | null;
  sort_order?: number | null;
  is_cover?: boolean | null;
};

type PublicApartmentQueryResult = {
  client: SupabaseClient;
  rows: ApartmentRow[];
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

async function queryPublicApartments(slug?: string): Promise<PublicApartmentQueryResult> {
  const publicClient = await getClient();
  let viewQuery = publicClient.from("public_apartments_v").select(publicApartmentViewSelect);
  if (slug) viewQuery = viewQuery.eq("slug", slug);
  const viewResult = slug
    ? await viewQuery.maybeSingle()
    : await viewQuery.order("created_at", { ascending: false });

  if (!viewResult.error) {
    const rows = slug
      ? (viewResult.data ? [viewResult.data as ApartmentRow] : [])
      : ((viewResult.data ?? []) as ApartmentRow[]);
    return { client: publicClient, rows };
  }

  if (!isServer()) throw new Error("DATA_UNAVAILABLE:public_apartments_v");

  const admin = await getServerAdminClient();
  if (!admin) throw new Error("DATA_UNAVAILABLE:public_apartments_v");

  logger.warn("public_apartments_v absente; lecture serveur temporaire à colonnes publiques", viewResult.error);
  let baseQuery = admin.from("apartments").select(publicApartmentViewSelect);
  if (slug) baseQuery = baseQuery.eq("slug", slug);
  baseQuery = baseQuery.eq("is_published", true);
  const baseResult = slug
    ? await baseQuery.maybeSingle()
    : await baseQuery.order("created_at", { ascending: false });

  if (baseResult.error) {
    logger.error("Lecture publique temporaire des appartements impossible", baseResult.error);
    throw new Error("DATA_UNAVAILABLE:apartments");
  }

  const rows = slug
    ? (baseResult.data ? [baseResult.data as unknown as ApartmentRow] : [])
    : ((baseResult.data ?? []) as unknown as ApartmentRow[]);
  return { client: admin, rows };
}

function isDemo(): boolean {
  return false;
}

function demoWarning(_entity: string) {
  void _entity;
}

function publicFallback<T>(entity: string, error: unknown, fallback: T): T {
  void fallback;
  logger.error(`${entity} indisponible dans Supabase`, error);
  throw new Error(`DATA_UNAVAILABLE:${entity}`);
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return uuidRegex.test(value);
}

function mapApartment(row: ApartmentRow): Apartment {
  const primaryImage = row.apartment_images
    ?.map((image) => normalizeApartmentImage(image as never))
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  const publicStatus = row.public_status ?? (row.is_published ? "published" : "draft");
  const pricePerNight = row.price_per_night ?? row.price_from;
  return {
    ...row,
    public_status: publicStatus,
    is_published: row.is_published || publicStatus === "published",
    price_per_night: pricePerNight,
    price_from: row.price_from ?? pricePerNight ?? 0,
    detailed_description: row.detailed_description ?? row.description,
    image_url: row.image_url ?? primaryImage?.image_url ?? undefined,
    image_alt_text: row.image_alt_text ?? primaryImage?.image_alt_text ?? undefined,
  };
}

async function mapApartmentsWithImagesFrom(supabase: SupabaseClient, rows: ApartmentRow[]): Promise<Apartment[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from("apartment_images")
    .select("apartment_id, url, alt_text, display_order, image_url, image_alt_text, sort_order, is_cover")
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
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) {
    logger.error("getLeadById failed", {
      id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  return (data as Lead | null) ?? null;
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
  const result = await queryPublicApartments();
  return mapApartmentsWithImagesFrom(result.client, result.rows);
}

export async function getPublicApartments(): Promise<Apartment[]> {
  const result = await queryPublicApartments();
  return mapApartmentsWithImagesFrom(result.client, result.rows);
}

export function extractDistricts(apartments: Apartment[]): string[] {
  const seen = new Set<string>();
  return apartments.reduce<string[]>((acc, a) => {
    const d = a.public_district || a.district;
    if (d && !seen.has(d)) { seen.add(d); acc.push(d); }
    return acc;
  }, []).sort();
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  const result = await queryPublicApartments(slug);
  if (result.rows.length === 0) return null;
  const [apartment] = await mapApartmentsWithImagesFrom(result.client, result.rows);
  return apartment ?? null;
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

type VehicleRow = Vehicle & { vehicle_images?: VehicleImage[] };

function mapVehicle(row: VehicleRow): Vehicle {
  const images = (row.vehicle_images ?? [])
    .map((image) => ({
      ...image,
      image_url: image.image_url ?? image.url,
      image_alt_text: image.image_alt_text ?? image.alt_text,
      sort_order: image.sort_order ?? image.display_order ?? 0,
    }))
    .filter((image) => image.image_url)
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const cover = images[0];
  const publicStatus = row.public_status ?? (row.is_published ? "published" : "draft");
  const publicName = row.public_title ?? row.public_name ?? row.title ?? row.internal_name;
  const internalName = row.title ?? row.internal_name ?? publicName;

  return {
    ...row,
    internal_name: internalName,
    public_name: publicName,
    title: row.title ?? internalName,
    public_title: row.public_title ?? publicName,
    brand: row.brand ?? "",
    model: row.model ?? "",
    category: row.category ?? "other",
    capacity: row.capacity ?? 1,
    luggage_capacity: row.luggage_capacity ?? 0,
    price_from: row.price_from ?? row.price_transfer ?? 0,
    price_transfer: row.price_transfer ?? row.price_from ?? 0,
    currency: row.currency ?? "MAD",
    with_driver: row.with_driver ?? true,
    driver_required: row.driver_required ?? row.with_driver ?? true,
    public_status: publicStatus,
    is_published: publicStatus === "published" || Boolean(row.is_published),
    short_description: row.short_description ?? row.public_description,
    description: row.description ?? row.public_description,
    public_description: row.public_description ?? row.description ?? row.short_description,
    plate_number: row.plate_number ?? row.registration,
    internal_notes: row.internal_notes ?? row.private_notes,
    image_url: row.image_url ?? cover?.image_url,
    image_alt_text: row.image_alt_text ?? cover?.image_alt_text,
    vehicle_images: images,
  };
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (!isUUID(id)) return null;
  if (isDemo()) { demoWarning("getVehicleById"); return null; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("id", id).single();
  if (error) return publicFallback("getVehicleById", error, null);
  return mapVehicle(data as VehicleRow);
}

export async function getVehicles(): Promise<Vehicle[]> {
  if (isDemo()) { demoWarning("getVehicles"); return []; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  const { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").order("created_at", { ascending: false });
  if (error) return publicFallback("getVehicles", error, []);
  return ((data ?? []) as VehicleRow[]).map(mapVehicle);
}

export async function getPublishedVehicles(): Promise<Vehicle[]> {
  if (isDemo()) { demoWarning("getPublishedVehicles"); return []; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  let { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("public_status", "published").order("created_at", { ascending: false });
  if (error) {
    const fallback = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("is_published", true).order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return publicFallback("getPublishedVehicles", error, []);
  return ((data ?? []) as VehicleRow[]).map(mapVehicle).filter((vehicle) => vehicle.image_url);
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (isDemo()) { demoWarning("getVehicleBySlug"); return null; }
  const supabase = (await getServerAdminClient()) ?? (await getClient());
  let { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("slug", slug).eq("public_status", "published").single();
  if (error) {
    const fallback = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("slug", slug).eq("is_published", true).single();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return publicFallback("getVehicleBySlug", error, null);
  return mapVehicle(data as VehicleRow);
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

// ─── Reservations (re-exported from dedicated module) ───
export {
  getReservationById,
  getReservations,
  getReservationEvents,
  getReservationItems,
  getApartmentReservations,
  getClientReservations,
  getLeadReservations,
  getPackageReservations,
  getReservationsForSelect,
  checkAvailability,
} from "@/lib/data/reservations";

// ─── Trips ───

export async function getTripById(id: string): Promise<Trip | null> {
  if (!isUUID(id)) return null;
  if (isDemo()) { demoWarning("getTripById"); return null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error) return publicFallback("getTripById", error, null);
  return data as Trip;
}

export async function getTrips(): Promise<Trip[]> {
  if (isDemo()) { demoWarning("getTrips"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("trips").select("*").order("trip_date", { ascending: false });
  if (error) return publicFallback("getTrips", error, []);
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

async function getCompanyIdForBlog(): Promise<string | null> {
  const serverClient = await getClient();
  const { data: { user }, error: userError } = await serverClient.auth.getUser();
  if (userError || !user) {
    logger.warn("getCompanyIdForBlog: utilisateur non authentifie", userError);
    return null;
  }
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    if (profileError || !profile?.company_id) {
      logger.warn("getCompanyIdForBlog: profil entreprise introuvable", profileError);
      return null;
    }
    return profile.company_id as string;
  } catch (err) {
    logger.error("getCompanyIdForBlog: admin client indisponible", err);
    return null;
  }
}

async function getAdminClientForBlog() {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  if (isDemo()) { demoWarning("getBlogPostById"); return mockBlogPosts.find((p) => p.id === id) ?? null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (error) {
    // Fallback: try admin client with company_id filter
    const admin = await getAdminClientForBlog();
    if (!admin) return null;
    const companyId = await getCompanyIdForBlog();
    if (!companyId) return null;
    const { data: adminData } = await admin.from("blog_posts").select("*").eq("id", id).eq("company_id", companyId).single();
    return adminData as BlogPost | null;
  }
  return data as BlogPost;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (isDemo()) { demoWarning("getBlogPosts"); return [...mockBlogPosts]; }
  const admin = await getAdminClientForBlog();
  if (admin) {
    const companyId = await getCompanyIdForBlog();
    if (companyId) {
      const { data, error } = await admin.from("blog_posts").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (!error) return data as BlogPost[];
    }
  }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (error) return publicFallback("getBlogPosts", error, [...mockBlogPosts]);
  return data as BlogPost[];
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const admin = await getAdminClientForBlog();
  if (admin) {
    const { data, error } = await admin.from("blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false });
    if (!error) return data as BlogPost[];
    logger.error("getPublishedBlogPosts (admin) failed", error);
  }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error) { logger.error("getPublishedBlogPosts failed", error); return []; }
  return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const admin = await getAdminClientForBlog();
  if (admin) {
    const { data, error } = await admin.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
    if (!error && data) return data as BlogPost;
  }
  const supabase = await getClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).single();
  if (error) return null;
  if (data && data.status !== "published") return null;
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

export async function getPublishedStayComposerServices(): Promise<Array<{ id: string; title: string; short_description?: string }>> {
  if (isDemo()) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("services")
    .select("id,title,short_description")
    .eq("is_published", true)
    .order("display_order", { ascending: true });
  if (error) {
    logger.error("getPublishedStayComposerServices failed", error);
    return [];
  }
  return (data ?? []) as Array<{ id: string; title: string; short_description?: string }>;
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

export async function getPartnersForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getPartnersForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, partner_type, phone, city, status")
    .order("name", { ascending: true });
  if (error) { logger.error(`getPartnersForSelect failed: ${error?.message ?? String(error)}`); return []; }
  const LABELS: Record<string, string> = {
    transport_company: "Transport", vehicle_owner: "Véhicule", driver: "Chauffeur",
    guide: "Guide", tour_provider: "Excursion", restaurant: "Restaurant",
    activity_provider: "Activité", cleaning: "Ménage", laundry: "Blanchisserie",
    maintenance: "Maintenance", repair: "Réparation", real_estate_service: "Immobilier",
    admin_supplier: "Fournisseur", other: "Autre",
  };
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    label: p.name as string,
    description: [LABELS[p.partner_type as string] ?? (p.partner_type as string), p.phone as string, p.city as string].filter(Boolean).join(" · "),
  }));
}

// ─── Documents ───

// ─── Document Relation Select Loaders ───

export type SelectOption = { id: string; label: string; description?: string };

export async function getOwnersForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getOwnersForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("owners").select("id, full_name, phone, email").order("created_at", { ascending: false });
  if (error) { logger.error(`getOwnersForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    label: o.full_name as string,
    description: [o.phone as string, o.email as string].filter(Boolean).join(" · "),
  }));
}

export async function getApartmentsForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getApartmentsForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("apartments").select("id, internal_name, district, management_status").order("created_at", { ascending: false });
  if (error) { logger.error(`getApartmentsForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    label: a.internal_name as string,
    description: [a.district as string, a.management_status as string].filter(Boolean).join(" · "),
  }));
}

export async function getClientsForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getClientsForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("clients").select("id, full_name, phone, email").order("created_at", { ascending: false });
  if (error) { logger.error(`getClientsForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    label: c.full_name as string,
    description: [c.phone as string, c.email as string].filter(Boolean).join(" · "),
  }));
}

export async function getVehiclesForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getVehiclesForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("vehicles").select("id, internal_name, capacity").order("created_at", { ascending: false });
  if (error) { logger.error(`getVehiclesForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((v: Record<string, unknown>) => ({
    id: v.id as string,
    label: v.internal_name as string,
    description: v.capacity ? `${v.capacity} pers.` : undefined,
  }));
}

// getReservationsForSelect is re-exported from @/lib/data/reservations

export async function getPaymentsForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getPaymentsForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("payments").select("id, title, amount, status").order("created_at", { ascending: false });
  if (error) { logger.error(`getPaymentsForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    label: (p.title as string) ?? "Paiement",
    description: p.amount ? `${p.amount} DH` : undefined,
  }));
}

export async function getExpensesForSelect(): Promise<SelectOption[]> {
  if (isDemo()) { demoWarning("getExpensesForSelect"); return []; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("expenses").select("id, title, amount, category").order("created_at", { ascending: false });
  if (error) { logger.error(`getExpensesForSelect failed: ${error?.message ?? String(error)}`); return []; }
  return (data ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    label: (e.title as string) ?? "Dépense",
    description: e.amount ? `${e.amount} DH` : undefined,
  }));
}

function logSupabaseError(source: string, error: unknown) {
  const ctor = (error as Record<string, unknown>)?.constructor?.name ?? typeof error;
  const msg = (error as Record<string, unknown>)?.message ?? String(error);
  console.error(`[Yakout] [${source}]`, { ctor, msg, raw: error });
}

export async function getDocuments(options?: { type?: string; relatedType?: string; relatedId?: string }): Promise<Document[]> {
  if (isDemo()) { demoWarning("getDocuments"); return []; }
  const supabase = await getClient();
  try {
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (options?.type) query = query.eq("type", options.type);
    if (options?.relatedType) query = query.eq("related_type", options.relatedType);
    if (options?.relatedId) query = query.eq("related_id", options.relatedId);
    const { data, error } = await query;
    if (error) {
      logSupabaseError("getDocuments", error);
      return [];
    }
    return (data ?? []) as Document[];
  } catch (err) {
    console.error(`[Yakout] [getDocuments] threw`, err);
    return [];
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  if (isDemo()) { demoWarning("getDocumentById"); return null; }
  const supabase = await getClient();
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
  if (error) { logSupabaseError("getDocumentById", error); return null; }
  return data as Document;
}

export async function createDocument(input: Partial<Document>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("createDocument"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("documents").insert([input]);
  if (error) { logger.error("createDocument failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function updateDocument(id: string, input: Partial<Document>): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("updateDocument"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("documents").update(input).eq("id", id);
  if (error) { logger.error("updateDocument failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemo()) { demoWarning("deleteDocument"); return { ok: true }; }
  const supabase = await getClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) { logger.error("deleteDocument failed", error); return { ok: false, error: error.message }; }
  return { ok: true };
}
