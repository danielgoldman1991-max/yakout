import test from "node:test";
import assert from "node:assert/strict";
import { computeFinancialSummary, validateFinancialTransaction, type FinancialTransactionInput } from "../../lib/finance/unified-finance";

function transaction(overrides: Partial<FinancialTransactionInput> = {}): FinancialTransactionInput {
  return {
    direction: "inflow", status: "paid", category: "accommodation", amount: "1000.00", currency: "MAD",
    occurred_on: "2026-07-21", origin: "reservation", idempotency_key: "test:reservation:1:payment",
    allocations: [{ amount: "1000.00", reservation_id: "00000000-0000-4000-8000-000000000001" }],
    ...overrides,
  };
}

test("accepte une transaction équilibrée", () => assert.equal(validateFinancialTransaction(transaction()).amount, "1000.00"));
test("refuse une ventilation incomplète", () => assert.throws(() => validateFinancialTransaction(transaction({ allocations: [{ amount: "999.99" }] })), /ALLOCATION_MISMATCH/));
test("refuse une devise non ISO", () => assert.throws(() => validateFinancialTransaction(transaction({ currency: "DH" })), /INVALID_CURRENCY/));
test("refuse un montant à plus de deux décimales", () => assert.throws(() => validateFinancialTransaction(transaction({ amount: "1.001", allocations: [{ amount: "1.001" }] })), /INVALID_MONEY/));

test("calcule les entrées, sorties, remboursements et le solde", () => {
  const result = computeFinancialSummary({
    expectedAmount: 1000,
    currency: "MAD",
    rows: [
      { amount: 1000, currency: "MAD", direction: "inflow", status: "paid", category: "accommodation", is_reconciled: true },
      { amount: 200, currency: "MAD", direction: "outflow", status: "paid", category: "refund", is_reconciled: false },
    ],
  });
  assert.deepEqual(result, {
    state: "available", expectedAmount: 1000, grossInflows: 1000, grossOutflows: 200, refunds: 200,
    netCashFlow: 800, balanceDue: 200, currency: "MAD", transactionCount: 2, unreconciledCount: 1,
    paymentStatus: "partially_paid",
  });
});

test("n’additionne jamais des devises différentes", () => {
  const result = computeFinancialSummary({ expectedAmount: null, currency: "MAD", rows: [{ amount: 10, currency: "EUR", direction: "inflow", status: "paid", category: "other" }] });
  assert.equal(result.state, "unavailable");
  if (result.state === "unavailable") assert.equal(result.errorCode, "CURRENCY_MISMATCH");
});

test("ignore les flux pending dans la trésorerie réelle", () => {
  const result = computeFinancialSummary({ expectedAmount: 500, currency: "MAD", rows: [{ amount: 500, currency: "MAD", direction: "inflow", status: "pending", category: "accommodation" }] });
  assert.equal(result.state, "available");
  if (result.state === "available") assert.equal(result.grossInflows, 0);
});
