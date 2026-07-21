import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const mode = apply ? "apply" : "dry-run";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises côté serveur.");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: reservations, error: reservationError }, { data: summaries, error: summaryError }, { data: payments, error: paymentError }, { data: allocations, error: allocationError }] = await Promise.all([
  supabase.from("reservations").select("id,total_amount,deposit_amount,remaining_amount,payment_status,currency,company_id"),
  supabase.from("reservation_financial_summary_v").select("reservation_id,reservation_total,gross_paid,refunded_amount,net_paid,balance_due,computed_payment_status,currency,payment_count,currency_mismatch"),
  supabase.from("payments").select("id,reservation_id,company_id,status,direction,category,amount,currency"),
  supabase.from("payment_allocations").select("payment_id,reservation_id,company_id,amount"),
]);
if (reservationError || paymentError || allocationError) {
  console.error({ reservationError, summaryError, paymentError, allocationError });
  process.exit(1);
}

function canonicalStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();
  if (["paid", "paye", "payé", "completed", "complete", "confirmed", "encaissé", "encaisse", "succeeded", "success"].includes(status)) return "paid";
  if (["refunded", "remboursé", "rembourse", "refund"].includes(status)) return "refunded";
  if (["partially_refunded", "partially refunded"].includes(status)) return "partially_refunded";
  return "pending";
}

function buildLocalSummaries() {
  const paymentById = new Map((payments ?? []).map((payment) => [payment.id, payment]));
  const links = [];
  const canonicalPairs = new Set();
  for (const allocation of allocations ?? []) {
    if (!allocation.reservation_id) continue;
    const payment = paymentById.get(allocation.payment_id);
    if (!payment) continue;
    links.push({ ...payment, reservation_id: allocation.reservation_id, amount: allocation.amount });
    canonicalPairs.add(`${payment.id}:${allocation.reservation_id}`);
  }
  for (const payment of payments ?? []) {
    if (payment.reservation_id && !canonicalPairs.has(`${payment.id}:${payment.reservation_id}`)) links.push(payment);
  }
  return (reservations ?? []).map((reservation) => {
    const related = links.filter((link) => link.reservation_id === reservation.id);
    const gross = related.filter((link) => link.direction === "inflow" && ["paid", "partially_refunded"].includes(canonicalStatus(link.status)) && link.category !== "refund").reduce((sum, link) => sum + Number(link.amount), 0);
    const refunded = related.filter((link) => canonicalStatus(link.status) === "refunded" || (link.direction === "outflow" && link.category === "refund" && ["paid", "partially_refunded"].includes(canonicalStatus(link.status)))).reduce((sum, link) => sum + Number(link.amount), 0);
    const net = gross - refunded;
    const total = Number(reservation.total_amount ?? 0);
    const currencies = new Set(related.map((link) => String(link.currency ?? "").toUpperCase()).filter(Boolean));
    const currency = String(reservation.currency || "MAD").toUpperCase();
    return { reservation_id: reservation.id, reservation_total: total, gross_paid: gross, refunded_amount: refunded, net_paid: net, balance_due: Math.max(total - net, 0), computed_payment_status: refunded > 0 && net <= 0 ? "refunded" : net > total ? "overpaid" : net === total && total > 0 ? "paid" : net > 0 ? "partially_paid" : "unpaid", currency, payment_count: related.length, currency_mismatch: currencies.size > 1 || (currencies.size === 1 && !currencies.has(currency)) };
  });
}

if (summaryError) console.warn(JSON.stringify({ warning: "deployed_view_unavailable", code: summaryError.code, message: summaryError.message, fallback: "local_canonical_projection" }));
const effectiveSummaries = summaryError ? buildLocalSummaries() : (summaries ?? []);
const summaryByReservation = new Map(effectiveSummaries.map((row) => [row.reservation_id, row]));
const allocatedPaymentIds = new Set((allocations ?? []).filter((row) => row.reservation_id).map((row) => row.payment_id));
let differences = 0;
let unexplained = 0;
let regularize = 0;
let updated = 0;

for (const reservation of reservations ?? []) {
  const summary = summaryByReservation.get(reservation.id);
  if (!summary || summary.currency_mismatch) {
    unexplained += 1;
    console.log(JSON.stringify({ reservationId: reservation.id, classification: "unavailable", reason: summary ? "currency_mismatch" : "summary_missing" }));
    continue;
  }
  const netPaid = Number(summary.net_paid);
  const balanceDue = Number(summary.balance_due);
  const paymentCount = Number(summary.payment_count);
  const snapshotDiffers = Number(reservation.deposit_amount ?? 0) !== netPaid
    || Number(reservation.remaining_amount ?? 0) !== balanceDue
    || ![summary.computed_payment_status, summary.computed_payment_status === "partially_paid" ? "Partiel" : "", summary.computed_payment_status === "paid" ? "Paye" : "", summary.computed_payment_status === "unpaid" ? "Non paye" : ""].includes(String(reservation.payment_status));
  if (!snapshotDiffers) continue;
  differences += 1;
  const requiresRegularization = paymentCount === 0 && Number(reservation.deposit_amount ?? 0) > 0;
  if (requiresRegularization) regularize += 1;
  console.log(JSON.stringify({
    reservationId: reservation.id,
    classification: requiresRegularization ? "À régulariser" : "snapshot_difference",
    totalCommercial: Number(summary.reservation_total), grossPaid: Number(summary.gross_paid), refundedAmount: Number(summary.refunded_amount),
    netPaid, balanceDue, previousDeposit: Number(reservation.deposit_amount ?? 0), previousRemaining: Number(reservation.remaining_amount ?? 0),
    previousStatus: reservation.payment_status, computedStatus: summary.computed_payment_status, paymentCount, currency: summary.currency,
  }));
  if (apply && !requiresRegularization) {
    const { error } = await supabase.from("reservations").update({ deposit_amount: netPaid }).eq("id", reservation.id).eq("company_id", reservation.company_id);
    if (error) { unexplained += 1; console.error(JSON.stringify({ reservationId: reservation.id, updateError: error })); }
    else updated += 1;
  }
}

const unlinkedPayments = (payments ?? []).filter((payment) => !payment.reservation_id && !allocatedPaymentIds.has(payment.id));
const statusBreakdown = Object.entries((payments ?? []).reduce((groups, payment) => {
  const key = `${payment.status ?? "null"}|${payment.direction ?? "null"}|${payment.category ?? "null"}`;
  groups[key] = (groups[key] ?? 0) + 1;
  return groups;
}, {})).map(([key, count]) => ({ combination: key, count }));
console.log(JSON.stringify({ statusBreakdown }));
console.log(JSON.stringify({ mode, reservations: (reservations ?? []).length, differences, updatedSnapshots: updated, toRegularize: regularize, unexplained, unlinkedPayments: unlinkedPayments.length }));
if (unexplained > 0) process.exitCode = 4;
