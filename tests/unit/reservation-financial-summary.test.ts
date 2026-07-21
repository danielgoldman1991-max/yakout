import assert from "node:assert/strict";
import test from "node:test";
import { computeReservationFinancialSummary, normalizePaymentStatus } from "../../lib/finance/reservation-financial-summary";

test("normalise tous les anciens statuts encaissés", () => {
  for (const status of ["paid", "Paye", "Payé", "completed", "confirmed"]) assert.equal(normalizePaymentStatus(status), "paid");
});

test("un paiement complet solde la réservation", () => {
  assert.deepEqual(computeReservationFinancialSummary({ reservationTotal: 1500, currency: "MAD", payments: [{ amount: 1500, status: "paid", direction: "inflow", currency: "MAD" }] }), {
    state: "available", reservationTotal: 1500, grossPaid: 1500, refundedAmount: 0, netPaid: 1500,
    balanceDue: 0, paymentStatus: "paid", currency: "MAD", paymentCount: 1,
  });
});

test("un acompte conserve le solde exact", () => {
  assert.match(JSON.stringify(computeReservationFinancialSummary({ reservationTotal: 1500, payments: [{ amount: 500, status: "paid", direction: "inflow" }] })), /"netPaid":500.*"balanceDue":1000.*"paymentStatus":"partially_paid"/);
});

test("une erreur de devise reste indisponible et ne devient pas unpaid", () => {
  assert.deepEqual(computeReservationFinancialSummary({ reservationTotal: 1500, currency: "MAD", payments: [{ amount: 500, status: "paid", currency: "EUR" }] }), {
    state: "unavailable", reason: "Devise incompatible : EUR.", errorCode: "CURRENCY_MISMATCH",
  });
});

test("un remboursement sortant réduit le net encaissé", () => {
  const summary = computeReservationFinancialSummary({ reservationTotal: 1500, payments: [
    { amount: 1500, status: "paid", direction: "inflow", category: "accommodation" },
    { amount: 500, status: "paid", direction: "outflow", category: "refund" },
  ] });
  assert.equal(summary.state, "available");
  if (summary.state === "available") assert.deepEqual({ refundedAmount: summary.refundedAmount, netPaid: summary.netPaid, balanceDue: summary.balanceDue }, { refundedAmount: 500, netPaid: 1000, balanceDue: 500 });
});
