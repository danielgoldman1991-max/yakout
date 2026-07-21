import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Variables Supabase serveur manquantes.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: rows, error }, { data: legacyExpenses, error: expenseError }] = await Promise.all([
  supabase.from("payment_allocation_reconciliation_v").select("payment_id,company_id,transaction_number,amount,currency,direction,status,allocated_amount,allocation_difference,allocation_count"),
  supabase.from("expenses").select("id,amount,currency,expense_status"),
]);
if (error) throw error;
if (expenseError) throw expenseError;

const anomalies = [];
const totals = {};
for (const row of rows ?? []) {
  if (Number(row.allocation_difference) !== 0) anomalies.push({ type: "allocation_difference", paymentId: row.payment_id, difference: row.allocation_difference });
  if (Number(row.allocation_count) === 0) anomalies.push({ type: "missing_allocation", paymentId: row.payment_id });
  const currency = String(row.currency);
  totals[currency] ??= { inflows: 0, outflows: 0 };
  if (row.status === "paid") totals[currency][row.direction === "inflow" ? "inflows" : "outflows"] += Number(row.amount);
}
const paidLegacyWithoutMarker = (legacyExpenses ?? []).filter((expense) => expense.expense_status === "paid").length;
console.log(JSON.stringify({ paymentCount: rows?.length ?? 0, totalsByCurrency: totals, anomalies, paidLegacyExpensesToReview: paidLegacyWithoutMarker, unexplainedDifferenceCount: anomalies.length }, null, 2));
process.exitCode = anomalies.length ? 1 : 0;
