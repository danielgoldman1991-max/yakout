import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
if (!dryRun) {
  console.error("Migration refusée sans --dry-run. Une sauvegarde, une revue des cas ambigus et l’application de la migration LOT 1 sont obligatoires.");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Variables Supabase serveur manquantes.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: expenses, error } = await supabase.from("expenses").select("id,company_id,amount,currency,expense_date,category,expense_status,payment_method,apartment_id,vehicle_id,trip_id,transfer_id,package_id,partner_id,owner_id,supplier_name,title,description");
if (error) throw error;

const paid = [];
const pending = [];
const ambiguous = [];
for (const expense of expenses ?? []) {
  const status = String(expense.expense_status ?? "").toLowerCase();
  const amount = Number(expense.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !expense.currency || !expense.expense_date) {
    ambiguous.push({ id: expense.id, reason: "montant, devise ou date invalide" });
    continue;
  }
  if (status === "paid") paid.push({
    legacy_source_table: "expenses", legacy_source_id: expense.id,
    idempotency_key: `legacy:expenses:${expense.id}:outflow`, direction: "outflow", status: "paid",
    category: mapCategory(expense.category), amount: amount.toFixed(2), currency: String(expense.currency).toUpperCase(),
    occurred_on: expense.expense_date, payment_method: expense.payment_method || "other",
  });
  else if (["pending", "draft", "approved", "partial"].includes(status)) pending.push({ id: expense.id, status });
  else ambiguous.push({ id: expense.id, reason: `statut inconnu: ${status || "vide"}` });
}

const totals = paid.reduce((map, row) => map.set(row.currency, (map.get(row.currency) ?? 0) + Number(row.amount)), new Map());
console.log(JSON.stringify({ mode: "dry-run", expenseCount: expenses?.length ?? 0, paidCandidates: paid.length, pendingDocuments: pending.length, ambiguous: ambiguous.length, totalsByCurrency: Object.fromEntries(totals), candidates: paid, ambiguousRows: ambiguous }, null, 2));

function mapCategory(category) {
  const value = String(category ?? "").toLowerCase();
  if (value.includes("maintenance")) return "maintenance";
  if (value.includes("clean" ) || value.includes("ménage") || value.includes("menage")) return "cleaning";
  if (value.includes("partner") || value.includes("partenaire")) return "partner_payment";
  if (value.includes("commission")) return "yakout_commission";
  if (value.includes("apartment") || value.includes("appartement")) return "apartment_expense";
  return "operating_expense";
}
