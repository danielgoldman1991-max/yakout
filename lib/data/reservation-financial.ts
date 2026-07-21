import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReservationFinancialSummary, ReservationComputedPaymentStatus } from "@/lib/finance/reservation-financial-summary";
import { logger } from "@/lib/utils/logger";
import type { Payment } from "@/types/business";

type ReservationInput = { id: string; totalAmount: unknown; currency?: unknown };

export async function getReservationFinancialSummaries(reservations: ReservationInput[]): Promise<Map<string, ReservationFinancialSummary>> {
  const summaries = new Map<string, ReservationFinancialSummary>();
  if (!reservations.length) return summaries;
  const supabase = await createSupabaseServerClient();
  const ids = reservations.map((reservation) => reservation.id);
  const { data, error } = await supabase.from("reservation_financial_summary_v")
    .select("reservation_id,reservation_total,gross_paid,refunded_amount,net_paid,balance_due,computed_payment_status,currency,payment_count,currency_mismatch")
    .in("reservation_id", ids);
  if (error) {
    logger.error("getReservationFinancialSummaries failed", { code: error.code, message: error.message, details: error.details, reservationCount: ids.length });
    for (const reservation of reservations) summaries.set(reservation.id, { state: "unavailable", reason: "Les paiements liés sont indisponibles.", errorCode: error.code });
    return summaries;
  }
  for (const reservation of reservations) {
    const row = (data ?? []).find((item) => item.reservation_id === reservation.id);
    if (!row) { summaries.set(reservation.id, { state: "unavailable", reason: "Synthèse financière introuvable.", errorCode: "SUMMARY_MISSING" }); continue; }
    if (row.currency_mismatch) { summaries.set(reservation.id, { state: "unavailable", reason: "Les paiements liés utilisent une devise incompatible.", errorCode: "CURRENCY_MISMATCH" }); continue; }
    const values = [row.reservation_total, row.gross_paid, row.refunded_amount, row.net_paid, row.balance_due].map(Number);
    if (values.some((value) => !Number.isFinite(value))) { summaries.set(reservation.id, { state: "unavailable", reason: "La synthèse financière contient une valeur invalide.", errorCode: "INVALID_SUMMARY" }); continue; }
    summaries.set(reservation.id, { state: "available", reservationTotal: values[0], grossPaid: values[1], refundedAmount: values[2], netPaid: values[3], balanceDue: values[4], paymentStatus: row.computed_payment_status as ReservationComputedPaymentStatus, currency: String(row.currency), paymentCount: Number(row.payment_count) });
  }
  return summaries;
}

export async function getReservationFinancialSummary(reservationId: string) {
  const summaries = await getReservationFinancialSummaries([{ id: reservationId, totalAmount: null }]);
  return summaries.get(reservationId) ?? { state: "unavailable" as const, reason: "Synthèse financière introuvable.", errorCode: "SUMMARY_MISSING" };
}

export async function getReservationLinkedPayments(reservationId: string): Promise<Payment[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: allocations, error: allocationError }, { data: legacy, error: legacyError }] = await Promise.all([
    supabase.from("payment_allocations").select("payment:payments!inner(id,amount,currency,status,direction,category,paid_at,payment_method,title,transaction_number)").eq("reservation_id", reservationId),
    supabase.from("payments").select("id,amount,currency,status,direction,category,paid_at,payment_method,title,transaction_number,reservation_id").eq("reservation_id", reservationId),
  ]);
  if (allocationError || legacyError) {
    logger.error("getReservationLinkedPayments failed", { reservationId, allocationError, legacyError });
    return [];
  }
  const canonical = (allocations ?? []).flatMap((row) => row.payment ? [row.payment as unknown as Payment] : []);
  return [...new Map([...canonical, ...((legacy ?? []) as Payment[])].map((payment) => [payment.id, payment])).values()];
}
