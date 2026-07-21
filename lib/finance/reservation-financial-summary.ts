export type CanonicalPaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type ReservationComputedPaymentStatus = "unpaid" | "partially_paid" | "paid" | "overpaid" | "refunded";

export type ReservationFinancialSummary =
  | { state: "available"; reservationTotal: number; grossPaid: number; refundedAmount: number; netPaid: number; balanceDue: number; paymentStatus: ReservationComputedPaymentStatus; currency: string; paymentCount: number }
  | { state: "unavailable"; reason: string; errorCode?: string };

export type FinancialPaymentRow = { amount: unknown; status: unknown; currency?: unknown; payment_type?: unknown; direction?: unknown; category?: unknown };

function key(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ _-]/g, "");
}

export function normalizePaymentStatus(rawStatus: unknown): CanonicalPaymentStatus {
  const status = key(rawStatus);
  if (["paid", "paye", "completed", "complete", "confirmed", "encaisse", "succeeded", "success"].includes(status)) return "paid";
  if (["refunded", "rembourse", "refund"].includes(status)) return "refunded";
  if (["failed", "echec", "echoue", "rejected"].includes(status)) return "failed";
  if (["cancelled", "canceled", "annule", "voided", "void"].includes(status)) return "cancelled";
  return "pending";
}

export function computeReservationFinancialSummary(input: { reservationTotal: unknown; currency?: unknown; payments: FinancialPaymentRow[] }): ReservationFinancialSummary {
  const total = Number(input.reservationTotal);
  if (!Number.isFinite(total) || total < 0) return { state: "unavailable", reason: "Montant de réservation invalide.", errorCode: "INVALID_RESERVATION_TOTAL" };
  const currency = String(input.currency || "MAD").toUpperCase();
  let grossPaid = 0, refunded = 0;
  for (const payment of input.payments) {
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { state: "unavailable", reason: "Un paiement lié possède un montant invalide.", errorCode: "INVALID_PAYMENT_AMOUNT" };
    const paymentCurrency = String(payment.currency || currency).toUpperCase();
    if (paymentCurrency !== currency) return { state: "unavailable", reason: `Devise incompatible : ${paymentCurrency}.`, errorCode: "CURRENCY_MISMATCH" };
    const status = normalizePaymentStatus(payment.status);
    const isRefund = status === "refunded" || (key(payment.direction) === "outflow" && ["refund", "remboursement"].includes(key(payment.category ?? payment.payment_type)));
    if (isRefund) refunded += amount;
    else if (status === "paid") grossPaid += amount;
  }
  const netPaid = grossPaid - refunded;
  const balanceDue = Math.max(total - netPaid, 0);
  let paymentStatus: ReservationComputedPaymentStatus = "unpaid";
  if (refunded > 0 && netPaid <= 0) paymentStatus = "refunded";
  else if (netPaid > total) paymentStatus = "overpaid";
  else if (netPaid === total && total > 0) paymentStatus = "paid";
  else if (netPaid > 0) paymentStatus = "partially_paid";
  return { state: "available", reservationTotal: total, grossPaid, refundedAmount: refunded, netPaid, balanceDue, paymentStatus, currency, paymentCount: input.payments.length };
}

export const reservationPaymentStatusLabels: Record<ReservationComputedPaymentStatus, string> = {
  unpaid: "Non payé", partially_paid: "Partiellement payé", paid: "Payé", overpaid: "Trop-perçu", refunded: "Remboursé",
};
