import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { getReservationFinancialSummaries } from "@/lib/data/reservation-financial";
import type { ReservationFinancialSummary } from "@/lib/finance/reservation-financial-summary";

export type CalendarReservationStatus = "option" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "other";
export type CalendarPaymentStatus = "paid" | "partial" | "unpaid" | "overpaid" | "refunded" | "unknown";
export type CalendarApartment = { id: string; title: string; district: string | null; capacity: number; imageUrl: string | null; operationalStatus: string | null };
export type CalendarBlock = { id: string; apartmentId: string | null; title: string; date: string; type: "maintenance"; priority: string; status: string };
export type CalendarWarning = { code: string; message: string };
export type ReservationCalendarEvent = {
  id: string; reservationId: string; reservationNumber: string; apartmentId: string | null; apartmentTitle: string;
  guestName: string; guestPhone: string | null; checkIn: string; checkOut: string; nights: number; guests: number;
  reservationStatus: CalendarReservationStatus; rawStatus: string; paymentStatus: CalendarPaymentStatus;
  totalAmount: number | null; paidAmount: number | null; refundedAmount: number | null; balanceDue: number | null; currency: string;
  source: string | null; isConflict: boolean; isUnassigned: boolean; requiresAttention: boolean;
};
export type CalendarDataResult =
  | { ok: true; reservations: ReservationCalendarEvent[]; apartments: CalendarApartment[]; blocks: CalendarBlock[]; warnings: CalendarWarning[]; loadedAt: string }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

export type CalendarFilters = { from: string; to: string; apartmentId?: string; status?: string; paymentStatus?: string; search?: string };

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : Number.NaN;
}
export function calendarNights(checkIn: string, checkOut: string) { return Math.max(0, Math.round((parseDateOnly(checkOut) - parseDateOnly(checkIn)) / 86_400_000)); }
export function intersectsPeriod(checkIn: string, checkOut: string, from: string, to: string) { return checkIn < to && checkOut > from; }
export function normalizeReservationStatus(value: unknown): CalendarReservationStatus {
  const status = String(value ?? "").toLowerCase().replace(/[ _-]/g, "");
  if (["option", "prereservation", "draft", "pending"].includes(status)) return "option";
  if (["confirmed", "confirme", "confirmée", "confirmee"].includes(status)) return "confirmed";
  if (["checkedin", "ensejour", "inprogress"].includes(status)) return "checked_in";
  if (["checkedout", "termine", "terminée", "complete", "completed"].includes(status)) return "checked_out";
  if (["cancelled", "canceled", "annule", "annulée", "annulee"].includes(status)) return "cancelled";
  return "other";
}
export function normalizePaymentStatus(value: unknown): CalendarPaymentStatus {
  const status = String(value ?? "").toLowerCase().replace(/[ _-]/g, "");
  if (["paye", "payé", "paid"].includes(status)) return "paid";
  if (["partiel", "partial", "partiallypaid"].includes(status)) return "partial";
  if (["nonpaye", "nonpayé", "unpaid"].includes(status)) return "unpaid";
  if (["refunded", "rembourse", "remboursé"].includes(status)) return "refunded";
  return "unknown";
}
export function barGeometry(checkIn: string, checkOut: string, from: string, dayCount: number) {
  const start = Math.max(0, Math.round((parseDateOnly(checkIn) - parseDateOnly(from)) / 86_400_000));
  const end = Math.min(dayCount, Math.round((parseDateOnly(checkOut) - parseDateOnly(from)) / 86_400_000));
  return { start, span: Math.max(1, end - start) };
}

type RawReservation = Record<string, unknown>;
export function mapReservationToCalendarEvent(row: RawReservation, financial?: ReservationFinancialSummary): ReservationCalendarEvent {
  const client = row.client as { full_name?: string; phone?: string } | null;
  const apartment = row.apartment as { id?: string; internal_name?: string; public_name?: string } | null;
  const id = String(row.id);
  const total = row.total_amount == null ? null : Number(row.total_amount);
  const available = financial?.state === "available" ? financial : null;
  const paymentStatus: CalendarPaymentStatus = !financial || financial.state === "unavailable" ? "unknown" : financial.paymentStatus === "partially_paid" ? "partial" : financial.paymentStatus;
  const status = normalizeReservationStatus(row.reservation_status);
  return {
    id, reservationId: id, reservationNumber: `RES-${id.slice(0, 8).toUpperCase()}`,
    apartmentId: apartment?.id ? String(apartment.id) : row.apartment_id ? String(row.apartment_id) : null,
    apartmentTitle: apartment?.internal_name ?? apartment?.public_name ?? "Non affectée",
    guestName: client?.full_name?.trim() || "Voyageur non renseigné", guestPhone: client?.phone ?? null,
    checkIn: String(row.check_in), checkOut: String(row.check_out), nights: calendarNights(String(row.check_in), String(row.check_out)),
    guests: Number(row.people_count ?? 1), reservationStatus: status, rawStatus: String(row.reservation_status ?? "Non renseigné"),
    paymentStatus, totalAmount: available?.reservationTotal ?? total, paidAmount: available?.netPaid ?? null, refundedAmount: available?.refundedAmount ?? null, balanceDue: available?.balanceDue ?? null,
    currency: available?.currency ?? "MAD", source: null, isConflict: false, isUnassigned: !row.apartment_id,
    requiresAttention: !row.apartment_id || status === "option" || !available || available.balanceDue > 0,
  };
}

function markConflicts(events: ReservationCalendarEvent[]) {
  const ids = new Set<string>();
  const blocking = events.filter((event) => event.apartmentId && event.reservationStatus !== "cancelled" && event.reservationStatus !== "checked_out");
  for (let i = 0; i < blocking.length; i += 1) for (let j = i + 1; j < blocking.length; j += 1) {
    const a = blocking[i], b = blocking[j];
    if (a.apartmentId === b.apartmentId && a.checkIn < b.checkOut && a.checkOut > b.checkIn) { ids.add(a.id); ids.add(b.id); }
  }
  return events.map((event) => ids.has(event.id) ? { ...event, isConflict: true, requiresAttention: true } : event);
}

export async function getReservationCalendarData(filters: CalendarFilters): Promise<CalendarDataResult> {
  try {
    const supabase = await createSupabaseServerClient();
    let reservationQuery = supabase.from("reservations").select(`
      id, client_id, apartment_id, check_in, check_out, nights, people_count,
      total_amount, currency, reservation_status, created_at,
      client:clients(id,full_name,phone,email),
      apartment:apartments(id,internal_name,public_name,district,capacity,image_url,management_status)
    `).lt("check_in", filters.to).gt("check_out", filters.from).order("check_in", { ascending: true });
    if (filters.apartmentId) reservationQuery = reservationQuery.eq("apartment_id", filters.apartmentId);
    if (filters.status) reservationQuery = reservationQuery.eq("reservation_status", filters.status);

    const [reservationResult, apartmentResult, maintenanceResult] = await Promise.all([
      reservationQuery,
      supabase.from("apartments").select("id,internal_name,public_name,district,capacity,image_url,management_status").order("internal_name", { ascending: true }),
      supabase.from("maintenance_tasks").select("id,apartment_id,title,due_date,priority,status").gte("due_date", filters.from).lt("due_date", filters.to).neq("status", "cancelled"),
    ]);
    if (reservationResult.error) {
      logger.error("getReservationCalendarData:reservations failed", reservationResult.error);
      return { ok: false, error: { code: reservationResult.error.code || "RESERVATIONS_LOAD_FAILED", message: "Le planning n’a pas pu être chargé.", retryable: true } };
    }
    if (apartmentResult.error) {
      logger.error("getReservationCalendarData:apartments failed", apartmentResult.error);
      return { ok: false, error: { code: apartmentResult.error.code || "APARTMENTS_LOAD_FAILED", message: "Les appartements du planning n’ont pas pu être chargés.", retryable: true } };
    }
    const warnings: CalendarWarning[] = [];
    if (maintenanceResult.error) warnings.push({ code: "MAINTENANCE_UNAVAILABLE", message: "Les interventions de maintenance sont indisponibles." });
    const reservationRows = (reservationResult.data ?? []) as unknown as RawReservation[];
    const financials = await getReservationFinancialSummaries(reservationRows.map((row) => ({ id: String(row.id), totalAmount: row.total_amount, currency: row.currency })));
    let events = markConflicts(reservationRows.map((row) => mapReservationToCalendarEvent(row, financials.get(String(row.id)))));
    if (filters.paymentStatus) events = events.filter((event) => event.paymentStatus === filters.paymentStatus);
    const query = filters.search?.trim().toLowerCase();
    if (query) events = events.filter((event) => [event.reservationNumber,event.guestName,event.guestPhone,event.apartmentTitle,event.source].some((value) => value?.toLowerCase().includes(query)));
    return {
      ok: true, reservations: events,
      apartments: (apartmentResult.data ?? []).map((row) => ({ id: row.id, title: row.internal_name || row.public_name || "Appartement sans titre", district: row.district, capacity: Number(row.capacity ?? 1), imageUrl: row.image_url, operationalStatus: row.management_status })),
      blocks: maintenanceResult.error ? [] : (maintenanceResult.data ?? []).filter((row) => row.due_date).map((row) => ({ id: row.id, apartmentId: row.apartment_id, title: row.title, date: row.due_date!, type: "maintenance" as const, priority: row.priority, status: row.status })),
      warnings, loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("getReservationCalendarData unexpected failure", error);
    return { ok: false, error: { code: "CALENDAR_UNEXPECTED", message: "Le planning n’a pas pu être chargé.", retryable: true } };
  }
}
