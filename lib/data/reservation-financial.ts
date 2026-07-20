import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeReservationFinancialSummary, type ReservationFinancialSummary } from "@/lib/finance/reservation-financial-summary";
import { logger } from "@/lib/utils/logger";

type ReservationInput = { id: string; totalAmount: unknown; currency?: unknown };

export async function getReservationFinancialSummaries(reservations: ReservationInput[]): Promise<Map<string, ReservationFinancialSummary>> {
  const summaries = new Map<string, ReservationFinancialSummary>();
  if (!reservations.length) return summaries;
  const supabase = await createSupabaseServerClient();
  const ids = reservations.map((reservation) => reservation.id);
  const { data, error } = await supabase.from("payments")
    .select("id,reservation_id,amount,currency,status,payment_type")
    .in("reservation_id", ids);
  if (error) {
    logger.error("getReservationFinancialSummaries failed", { code: error.code, message: error.message, details: error.details, reservationCount: ids.length });
    for (const reservation of reservations) summaries.set(reservation.id, { state: "unavailable", reason: "Les paiements liés sont indisponibles.", errorCode: error.code });
    return summaries;
  }
  const rows = data ?? [];
  for (const reservation of reservations) {
    summaries.set(reservation.id, computeReservationFinancialSummary({
      reservationTotal: reservation.totalAmount,
      currency: reservation.currency || "MAD",
      payments: rows.filter((payment) => payment.reservation_id === reservation.id),
    }));
  }
  return summaries;
}

export async function getReservationFinancialSummary(reservationId: string, reservationTotal: unknown, currency = "MAD") {
  const summaries = await getReservationFinancialSummaries([{ id: reservationId, totalAmount: reservationTotal, currency }]);
  return summaries.get(reservationId) ?? { state: "unavailable" as const, reason: "Synthèse financière introuvable.", errorCode: "SUMMARY_MISSING" };
}
