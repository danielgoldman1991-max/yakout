import { expect, test } from "@playwright/test";
import { computeReservationFinancialSummary, normalizePaymentStatus } from "../lib/finance/reservation-financial-summary";

test("normalise les statuts historiques et canoniques", () => {
  for (const value of ["Paye", "Payé", "paid", "completed", "encaissé"]) expect(normalizePaymentStatus(value)).toBe("paid");
  for (const value of ["pending", "En attente", "draft"]) expect(normalizePaymentStatus(value)).toBe("pending");
  expect(normalizePaymentStatus("refunded")).toBe("refunded");
});

test.describe("résumé financier officiel", () => {
  const summary = (payments: Array<{amount:number;status:string;currency?:string;payment_type?:string}>) => computeReservationFinancialSummary({ reservationTotal: 1500, currency: "MAD", payments });
  test("aucun paiement", () => expect(summary([])).toMatchObject({ state:"available", netPaid:0, balanceDue:1500, paymentStatus:"unpaid" }));
  test("pending ignoré", () => expect(summary([{amount:1500,status:"pending"}])).toMatchObject({ netPaid:0, paymentStatus:"unpaid" }));
  test("acompte", () => expect(summary([{amount:500,status:"paid"}])).toMatchObject({ netPaid:500, balanceDue:1000, paymentStatus:"partially_paid" }));
  test("paiement complet", () => expect(summary([{amount:1500,status:"paid"}])).toMatchObject({ netPaid:1500, balanceDue:0, paymentStatus:"paid" }));
  test("plusieurs paiements", () => expect(summary([{amount:500,status:"paid"},{amount:1000,status:"paid"}])).toMatchObject({ netPaid:1500, paymentCount:2 }));
  test("remboursement partiel", () => expect(summary([{amount:1500,status:"paid"},{amount:500,status:"refunded"}])).toMatchObject({ refundedAmount:500, netPaid:1000, balanceDue:500 }));
  test("remboursement total", () => expect(summary([{amount:1500,status:"paid"},{amount:1500,status:"refunded"}])).toMatchObject({ netPaid:0, paymentStatus:"refunded" }));
  test("trop-perçu", () => expect(summary([{amount:1600,status:"paid"}])).toMatchObject({ netPaid:1600, balanceDue:0, paymentStatus:"overpaid" }));
  test("devise différente indisponible", () => expect(summary([{amount:1500,status:"paid",currency:"EUR"}])).toMatchObject({ state:"unavailable", errorCode:"CURRENCY_MISMATCH" }));
  test("montant invalide indisponible", () => expect(computeReservationFinancialSummary({reservationTotal:1500,payments:[{amount:Number.NaN,status:"paid"}]})).toMatchObject({state:"unavailable",errorCode:"INVALID_PAYMENT_AMOUNT"}));
});
