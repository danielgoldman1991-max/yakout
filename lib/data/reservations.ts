import "server-only";
import type { Reservation, ReservationEvent, ReservationItem } from "@/types/business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { isValidUuid } from "@/lib/utils/uuid";
import { BLOCKING_STATUSES } from "@/lib/constants/reservations";

// Columns available in the BASE schema (pre-migration).
// The enriched columns (reservation_number, lead_id, guest_name, etc.) require
// running database/migrations/20260711_fix_reservations_structure.sql
const RESERVATION_COLUMNS = `
  id, company_id, client_id, apartment_id,
  check_in, check_out, nights,
  people_count,
  total_amount, deposit_amount, remaining_amount, payment_status,
  reservation_status,
  check_in_notes, check_out_notes,
  created_at, updated_at
`;

function mapReservation(raw: Record<string, unknown>): Reservation {
  const row = { ...raw };
  // Map DB column reservation_status → code status
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
  if (options?.status) query = query.eq("status", options.status);
  if (options?.apartmentId) query = query.eq("apartment_id", options.apartmentId);
  if (options?.clientId) query = query.eq("client_id", options.clientId);
  if (options?.packageId) query = query.eq("package_id", options.packageId);
  if (options?.search) {
    query = query.or(
      `reservation_number.ilike.%${options.search}%,guest_name.ilike.%${options.search}%,guest_email.ilike.%${options.search}%,guest_phone.ilike.%${options.search}%`
    );
  }
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
