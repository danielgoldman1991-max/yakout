export const PAYMENT_DIRECTIONS = ["inflow", "outflow"] as const;
export const PAYMENT_STATUSES = ["draft", "pending", "paid", "failed", "cancelled", "partially_refunded", "refunded", "reversed"] as const;
export const PAYMENT_CATEGORIES = [
  "accommodation", "transport", "package", "service", "deposit", "reservation_balance", "refund",
  "apartment_expense", "maintenance", "cleaning", "partner_payment", "driver_payment", "owner_payout",
  "yakout_commission", "operating_expense", "adjustment", "other",
] as const;

export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];
export type FinancialPaymentStatus = "unpaid" | "partially_paid" | "paid" | "overpaid" | "refunded" | "not_applicable";

export type FinancialAllocationInput = {
  amount: string;
  reservation_id?: string | null;
  apartment_id?: string | null;
  client_id?: string | null;
  owner_id?: string | null;
  trip_id?: string | null;
  transfer_id?: string | null;
  package_id?: string | null;
  maintenance_id?: string | null;
  partner_id?: string | null;
  service_id?: string | null;
  expense_id?: string | null;
  owner_payout_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  allocation_category?: string;
  description?: string | null;
};

export type FinancialTransactionInput = {
  direction: PaymentDirection;
  status: PaymentStatus;
  category: PaymentCategory;
  amount: string;
  currency: string;
  occurred_on: string;
  due_on?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
  reference?: string | null;
  external_reference?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  origin: string;
  source?: string;
  counterparty_type?: string | null;
  counterparty_id?: string | null;
  counterparty_name_snapshot?: string | null;
  reversed_payment_id?: string | null;
  idempotency_key: string;
  payment_part?: string | null;
  legacy_source_table?: string | null;
  legacy_source_id?: string | null;
  allocations: FinancialAllocationInput[];
};

export type FinancialSummary =
  | {
      state: "available";
      expectedAmount: number | null;
      grossInflows: number;
      grossOutflows: number;
      refunds: number;
      netCashFlow: number;
      balanceDue: number | null;
      currency: string;
      transactionCount: number;
      unreconciledCount: number;
      paymentStatus: FinancialPaymentStatus;
    }
  | { state: "unavailable"; reason: string; errorCode?: string };

type SummaryRow = {
  amount: unknown;
  currency: unknown;
  direction: unknown;
  status: unknown;
  category: unknown;
  is_reconciled?: unknown;
};

function moneyToMinorUnits(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("INVALID_MONEY");
  const [whole, decimals = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(decimals.padEnd(2, "0"));
}

export function validateFinancialTransaction(input: FinancialTransactionInput) {
  if (!PAYMENT_DIRECTIONS.includes(input.direction)) throw new Error("INVALID_DIRECTION");
  if (!PAYMENT_STATUSES.includes(input.status)) throw new Error("INVALID_STATUS");
  if (!PAYMENT_CATEGORIES.includes(input.category)) throw new Error("INVALID_CATEGORY");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("INVALID_CURRENCY");
  if (!input.idempotency_key.trim()) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  if (!input.allocations.length) throw new Error("ALLOCATION_REQUIRED");
  const amount = moneyToMinorUnits(input.amount);
  if (amount <= BigInt(0)) throw new Error("INVALID_AMOUNT");
  const allocated = input.allocations.reduce((sum, allocation) => sum + moneyToMinorUnits(allocation.amount), BigInt(0));
  if (allocated !== amount) throw new Error("ALLOCATION_MISMATCH");
  return input;
}

export function computeFinancialSummary(input: { expectedAmount?: unknown; currency: string; rows: SummaryRow[] }): FinancialSummary {
  const currency = input.currency.toUpperCase();
  const expected = input.expectedAmount == null ? null : Number(input.expectedAmount);
  if (expected !== null && (!Number.isFinite(expected) || expected < 0)) return { state: "unavailable", reason: "Montant commercial invalide.", errorCode: "INVALID_EXPECTED_AMOUNT" };
  let inflows = 0;
  let outflows = 0;
  let refunds = 0;
  let unreconciledCount = 0;
  let count = 0;
  for (const row of input.rows) {
    const rowCurrency = String(row.currency ?? "").toUpperCase();
    if (rowCurrency !== currency) return { state: "unavailable", reason: `Devise incompatible : ${rowCurrency || "inconnue"}.`, errorCode: "CURRENCY_MISMATCH" };
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { state: "unavailable", reason: "Transaction financière invalide.", errorCode: "INVALID_TRANSACTION_AMOUNT" };
    count += 1;
    if (row.is_reconciled !== true) unreconciledCount += 1;
    if (row.status !== "paid" && row.status !== "partially_refunded" && row.status !== "refunded") continue;
    if (row.direction === "inflow") inflows += amount;
    if (row.direction === "outflow") outflows += amount;
    if (row.category === "refund") refunds += amount;
  }
  const net = inflows - outflows;
  const balance = expected === null ? null : Math.max(expected - (inflows - refunds), 0);
  let paymentStatus: FinancialPaymentStatus = expected === null ? "not_applicable" : "unpaid";
  if (expected !== null) {
    const netPaid = inflows - refunds;
    if (refunds > 0 && netPaid <= 0) paymentStatus = "refunded";
    else if (netPaid > expected) paymentStatus = "overpaid";
    else if (netPaid === expected && expected > 0) paymentStatus = "paid";
    else if (netPaid > 0) paymentStatus = "partially_paid";
  }
  return {
    state: "available", expectedAmount: expected, grossInflows: inflows, grossOutflows: outflows,
    refunds, netCashFlow: net, balanceDue: balance, currency, transactionCount: count,
    unreconciledCount, paymentStatus,
  };
}
