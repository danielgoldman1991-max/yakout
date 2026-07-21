import "server-only";
import type { Reservation, ReservationEvent, ReservationItem, ReservationListItem } from "@/types/business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { isValidUuid } from "@/lib/utils/uuid";
import { BLOCKING_STATUSES } from "@/lib/constants/reservations";
import { getReservationFinancialSummaries } from "@/lib/data/reservation-financial";

// Base columns only (migrations NOT executed).
const RESERVATION_COLUMNS = `
  id, company_id, client_id, apartment_id,
  check_in, check_out, nights,
  people_count,
  total_amount,
  reservation_status,
  check_in_notes, check_out_notes,
  created_at, updated_at
`;

function mapReservation(raw: Record<string, unknown>): Reservation {
  const row = { ...raw };
  row.status = row.reservation_status ?? "draft";
  delete row.reservation_status;
  return row as unknown as Reservation;
}

function mapReservations(raw: Record<string, unknown>[]): Reservation[] {
  return raw.map(mapReservation);
}

async function getClient() {
  return createSupabaseServerClient();
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  if (!isValidUuid(id)) return null;
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("id", id)
    .single();
  if (error) { logger.warn("getReservationById failed", error); return null; }
  return mapReservation(data);
}

// ─── List loader with JOINs + batch payments ───

export type ReservationsListFilters = {
  status?: string;
  search?: string;
  apartmentId?: string;
  paymentStatus?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

const PAGE_SIZE_DEFAULT = 20;

function buildGuestName(client: { full_name?: string; phone?: string; email?: string } | null): string {
  if (!client) return "Voyageur non renseigné";
  return client.full_name?.trim() || "Voyageur non renseigné";
}

export async function getReservationsList(filters?: ReservationsListFilters): Promise<{
  items: ReservationListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await getClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? PAGE_SIZE_DEFAULT));
  const offset = (page - 1) * pageSize;
  let paymentReservationIds: string[] | null = null;
  if (filters?.paymentStatus) {
    const canonicalStatus = filters.paymentStatus === "partial" ? "partially_paid" : filters.paymentStatus;
    const { data: financialRows, error: financialError } = await supabase.from("reservation_financial_summary_v").select("reservation_id").eq("computed_payment_status", canonicalStatus);
    if (financialError) logger.error("getReservationsList:financial filter failed", financialError);
    paymentReservationIds = financialError ? [] : (financialRows ?? []).map((row) => row.reservation_id);
  }

  // Resolve search to client IDs first (base schema has no guest_name/reservation_number)
  let searchClientIds: string[] | null = null;
  if (filters?.search) {
    const s = `%${filters.search}%`;
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
    searchClientIds = (matchingClients ?? []).map((c: { id: string }) => c.id);
  }

  // Count query (simple, no joins)
  let countQuery = supabase.from("reservations").select("id", { count: "exact", head: true });
  if (filters?.status) countQuery = countQuery.eq("reservation_status", filters.status);
  if (filters?.apartmentId) countQuery = countQuery.eq("apartment_id", filters.apartmentId);
  if (paymentReservationIds !== null) countQuery = paymentReservationIds.length ? countQuery.in("id", paymentReservationIds) : countQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  if (searchClientIds !== null) {
    countQuery = searchClientIds.length > 0
      ? countQuery.in("client_id", searchClientIds)
      : countQuery.eq("client_id", "__NO_MATCH__");
  }

  const { count: total, error: countError } = await countQuery;
  if (countError) {
    logger.error("getReservationsList:count failed", countError);
    return { items: [], total: 0, page, pageSize };
  }

  // Data query with joins
  const selectFields = `
    id, client_id, apartment_id,
    check_in, check_out, nights,
    people_count,
    total_amount,
    reservation_status,
    created_at,
    client:clients!client_id(id, full_name, phone, email),
    apartment:apartments!apartment_id(id, internal_name, public_name, district, image_url)
  `;
  let dataQuery = supabase.from("reservations").select(selectFields);
  if (filters?.status) dataQuery = dataQuery.eq("reservation_status", filters.status);
  if (filters?.apartmentId) dataQuery = dataQuery.eq("apartment_id", filters.apartmentId);
  if (paymentReservationIds !== null) dataQuery = paymentReservationIds.length ? dataQuery.in("id", paymentReservationIds) : dataQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  if (searchClientIds !== null) {
    dataQuery = searchClientIds.length > 0
      ? dataQuery.in("client_id", searchClientIds)
      : dataQuery.eq("client_id", "__NO_MATCH__");
  }

  const { data, error } = await dataQuery
    .order("check_in", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    logger.error("getReservationsList failed", { code: error.code, message: error.message, details: error.details, hint: error.hint, filters });
    return { items: [], total: 0, page, pageSize };
  }

  const raw = (data ?? []) as Record<string, unknown>[];
  const financials = await getReservationFinancialSummaries(raw.map((row) => ({ id: String(row.id), totalAmount: row.total_amount, currency: "MAD" })));
  const items: ReservationListItem[] = raw.map((r) => {
    const client = r.client as { full_name?: string; phone?: string; email?: string } | null;
    const apt = r.apartment as { id?: string; internal_name?: string; public_name?: string; district?: string; image_url?: string } | null;
    const id = String(r.id ?? "");
    const financial = financials.get(id);
    return {
      id,
      reservationLabel: `RES-${id.slice(0, 8).toUpperCase()}`,
      status: String(r.reservation_status ?? "draft"),
      checkIn: String(r.check_in ?? ""),
      checkOut: String(r.check_out ?? ""),
      nights: Number(r.nights ?? 0),
      peopleCount: Number(r.people_count ?? 1),
      totalAmount: Number(r.total_amount ?? 0),
      depositAmount: financial?.state === "available" ? financial.netPaid : null,
      remainingAmount: financial?.state === "available" ? financial.balanceDue : null,
      paymentStatus: financial?.state === "available" ? financial.paymentStatus : "unknown",
      source: null,
      createdAt: String(r.created_at ?? ""),
      guest: client ? {
        name: buildGuestName(client),
        phone: client.phone ?? null,
        email: client.email ?? null,
      } : null,
      apartment: apt?.id ? {
        id: String(apt.id),
        title: apt.internal_name ?? apt.public_name ?? "Sans titre",
        district: apt.district ?? null,
        imageUrl: apt.image_url ?? null,
      } : null,
    };
  });

  return { items, total: total ?? 0, page, pageSize };
}

// ─── Legacy: used by dashboard overview, reports, calendar ───

export async function getReservations(options?: {
  limit?: number;
  status?: string;
  apartmentId?: string;
  clientId?: string;
  packageId?: string;
  search?: string;
}): Promise<Reservation[]> {
  const supabase = await getClient();
  let query = supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .order("check_in", { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  if (options?.status) query = query.eq("reservation_status", options.status);
  if (options?.apartmentId) query = query.eq("apartment_id", options.apartmentId);
  if (options?.clientId) query = query.eq("client_id", options.clientId);
  if (options?.packageId) query = query.eq("package_id", options.packageId);
  const { data, error } = await query;
  if (error) { logger.warn("getReservations failed", error); return []; }
  return mapReservations(data ?? []);
}

export async function getReservationsForSelect(): Promise<{ id: string; label: string; description: string }[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, reservation_status, check_in, check_out")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) { logger.warn("getReservationsForSelect failed", error); return []; }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    label: r.id as string,
    description: `${r.check_in as string} → ${r.check_out as string} · ${r.reservation_status as string}`,
  }));
}

export async function getApartmentReservations(apartmentId: string): Promise<Reservation[]> {
  if (!isValidUuid(apartmentId)) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("apartment_id", apartmentId)
    .order("check_in", { ascending: false });
  if (error) { logger.warn("getApartmentReservations failed", error); return []; }
  return mapReservations(data ?? []);
}

export async function getClientReservations(clientId: string): Promise<Reservation[]> {
  if (!isValidUuid(clientId)) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("client_id", clientId)
    .order("check_in", { ascending: false });
  if (error) { logger.warn("getClientReservations failed", error); return []; }
  return mapReservations(data ?? []);
}

export async function getLeadReservations(leadId: string): Promise<Reservation[]> {
  if (!isValidUuid(leadId)) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("lead_id", leadId)
    .order("check_in", { ascending: false });
  if (error) { logger.warn("getLeadReservations failed", error); return []; }
  return mapReservations(data ?? []);
}

export async function getPackageReservations(packageId: string): Promise<Reservation[]> {
  if (!isValidUuid(packageId)) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("package_id", packageId)
    .order("check_in", { ascending: false });
  if (error) { logger.warn("getPackageReservations failed", error); return []; }
  return mapReservations(data ?? []);
}

export async function getReservationEvents(reservationId: string): Promise<ReservationEvent[]> {
  if (!isValidUuid(reservationId)) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservation_events")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });
  if (error) { logger.warn("getReservationEvents failed", error); return []; }
  return (data ?? []) as ReservationEvent[];
}

export async function getReservationItems(reservationId: string): Promise<ReservationItem[]> {
  if (!isValidUuid(reservationId)) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("reservation_items")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("sort_order", { ascending: true });
  if (error) { logger.warn("getReservationItems failed", error); return []; }
  return (data ?? []) as ReservationItem[];
}

export async function checkAvailability(
  apartmentId: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string
): Promise<{ available: boolean; conflicts: Reservation[] }> {
  if (!isValidUuid(apartmentId)) return { available: false, conflicts: [] };
  const supabase = await getClient();
  let query = supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("apartment_id", apartmentId)
    .in("reservation_status", BLOCKING_STATUSES)
    .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data, error } = await query;

  if (error) { logger.warn("checkAvailability failed", error); return { available: false, conflicts: [] }; }
  return { available: (data ?? []).length === 0, conflicts: mapReservations(data ?? []) };
}
