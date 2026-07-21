import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatInteger } from "../formatters";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportData, ReportFilters, ReportTable } from "./types";

type CanonicalPayment = {
  id: string;
  direction: "inflow" | "outflow";
  status: string;
  category: string;
  currency: string;
  occurred_on: string;
  title: string | null;
};

type OwnerAllocation = {
  id: string;
  amount: number | string;
  owner_id: string | null;
  apartment_id: string | null;
  allocation_category: string;
  payment: CanonicalPayment | CanonicalPayment[];
};

function paymentOf(allocation: OwnerAllocation): CanonicalPayment | null {
  return Array.isArray(allocation.payment) ? allocation.payment[0] ?? null : allocation.payment;
}

function summarize(allocations: OwnerAllocation[]) {
  let inflows = 0;
  let operatingOutflows = 0;
  let payouts = 0;
  for (const allocation of allocations) {
    const payment = paymentOf(allocation);
    if (!payment || payment.status !== "paid") continue;
    const amount = Number(allocation.amount);
    if (payment.direction === "inflow") inflows += amount;
    else if (payment.category === "owner_payout") payouts += amount;
    else operatingOutflows += amount;
  }
  return { inflows, operatingOutflows, payouts, balance: inflows - operatingOutflows - payouts };
}

async function getOwnerAllocations(ownerId: string, apartmentIds: string[], periodStart: string, periodEnd: string, currency: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("payment_allocations")
    .select("id,amount,owner_id,apartment_id,allocation_category,payment:payments!inner(id,direction,status,category,currency,occurred_on,title)")
    .eq("payment.status", "paid")
    .eq("payment.currency", currency)
    .gte("payment.occurred_on", periodStart)
    .lte("payment.occurred_on", periodEnd);
  query = apartmentIds.length > 0
    ? query.or(`owner_id.eq.${ownerId},apartment_id.in.(${apartmentIds.join(",")})`)
    : query.eq("owner_id", ownerId);
  const result = await query.order("created_at", { ascending: false });
  assertSupabaseResults("Flux propriétaire", [result]);
  return (result.data ?? []) as unknown as OwnerAllocation[];
}

export async function getOwnerMonthlyStatement(filters: ReportFilters): Promise<ReportData> {
  const ownerId = filters.owner_id;
  const generatedAt = new Date().toISOString();
  if (!ownerId) {
    return { metadata: { reportId: "owners-monthly-statement", title: "Relevé mensuel propriétaire", generatedAt, status: "error" }, kpis: [], tables: [], warnings: ["Veuillez sélectionner un propriétaire."], sourceCounts: {} };
  }

  const periodStart = filters.period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = filters.period_end ?? generatedAt.slice(0, 10);
  const currency = filters.currency ?? "MAD";
  const supabase = await createSupabaseServerClient();
  const [ownerResult, apartmentsResult] = await Promise.all([
    supabase.from("owners").select("id,full_name,city").eq("id", ownerId).maybeSingle(),
    supabase.from("apartments").select("id,internal_name,district").eq("owner_id", ownerId),
  ]);
  assertSupabaseResults("Relevé mensuel propriétaire", [ownerResult, apartmentsResult]);
  if (!ownerResult.data) {
    return { metadata: { reportId: "owners-monthly-statement", title: "Relevé mensuel propriétaire", generatedAt, status: "error" }, kpis: [], tables: [], warnings: ["Propriétaire introuvable."], sourceCounts: {} };
  }

  const apartments = apartmentsResult.data ?? [];
  const apartmentIds = apartments.map((apartment) => apartment.id);
  const allocations = await getOwnerAllocations(ownerId, apartmentIds, periodStart, periodEnd, currency);
  const totals = summarize(allocations);
  const tables: ReportTable[] = [{
    title: "Flux financiers comptabilisés",
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "title", label: "Libellé" },
      { key: "category", label: "Catégorie" },
      { key: "direction", label: "Sens" },
      { key: "amount", label: `Montant (${currency})`, align: "right", format: "currency" },
    ],
    rows: allocations.map((allocation) => {
      const payment = paymentOf(allocation);
      return { date: payment?.occurred_on, title: payment?.title ?? "Transaction", category: payment?.category ?? allocation.allocation_category, direction: payment?.direction === "inflow" ? "Entrée" : "Sortie", amount: Number(allocation.amount) };
    }),
  }];
  const warnings = allocations.length === 0 ? ["Aucun flux financier payé et ventilé vers ce propriétaire ou ses biens sur la période."] : [];

  return {
    metadata: { reportId: "owners-monthly-statement", title: `Relevé — ${ownerResult.data.full_name}`, generatedAt, periodStart, periodEnd, status: warnings.length ? "partial" : "ready", formulaVersion: "owner-cash-allocations-v1", dataSourceVersion: "payments+payment_allocations" },
    kpis: [
      { label: "Propriétaire", value: ownerResult.data.full_name, description: ownerResult.data.city ?? undefined },
      { label: "Biens", value: formatInteger(apartments.length) },
      { label: "Encaissements alloués", value: formatCurrency(totals.inflows, currency) },
      { label: "Solde après sorties", value: formatCurrency(totals.balance, currency) },
    ],
    tables,
    totals: { inflows: totals.inflows, expenses: totals.operatingOutflows, payouts: totals.payouts, balance: totals.balance },
    warnings,
    sourceCounts: { apartments: apartments.length, payment_allocations: allocations.length },
  };
}

export async function getOwnersConsolidated(filters: ReportFilters): Promise<ReportData> {
  const generatedAt = new Date().toISOString();
  const periodStart = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = filters.period_end ?? generatedAt.slice(0, 10);
  const currency = filters.currency ?? "MAD";
  const supabase = await createSupabaseServerClient();
  const [ownersResult, apartmentsResult, allocationsResult] = await Promise.all([
    supabase.from("owners").select("id,full_name,status").order("full_name"),
    supabase.from("apartments").select("id,owner_id"),
    supabase.from("payment_allocations").select("id,amount,owner_id,apartment_id,allocation_category,payment:payments!inner(id,direction,status,category,currency,occurred_on,title)").eq("payment.status", "paid").eq("payment.currency", currency).gte("payment.occurred_on", periodStart).lte("payment.occurred_on", periodEnd),
  ]);
  assertSupabaseResults("Rapport consolidé propriétaires", [ownersResult, apartmentsResult, allocationsResult]);

  const owners = ownersResult.data ?? [];
  const apartments = apartmentsResult.data ?? [];
  const allocations = (allocationsResult.data ?? []) as unknown as OwnerAllocation[];
  const apartmentOwner = new Map(apartments.map((apartment) => [apartment.id, apartment.owner_id]));
  const rows = owners.map((owner) => {
    const ownerAllocations = allocations.filter((allocation) => allocation.owner_id === owner.id || apartmentOwner.get(allocation.apartment_id ?? "") === owner.id);
    const totals = summarize(ownerAllocations);
    return { owner: owner.full_name, status: owner.status ?? "-", properties: apartments.filter((apartment) => apartment.owner_id === owner.id).length, inflows: totals.inflows, outflows: totals.operatingOutflows, payouts: totals.payouts, balance: totals.balance };
  });
  const totals = summarize(allocations);
  const warnings = allocations.length === 0 ? ["Aucun flux payé n’est ventilé vers les propriétaires ou les appartements sur la période."] : [];

  return {
    metadata: { reportId: "owners-consolidated", title: "Rapport consolidé propriétaires", generatedAt, periodStart, periodEnd, status: warnings.length ? "partial" : "ready", formulaVersion: "owner-cash-allocations-v1", dataSourceVersion: "payments+payment_allocations" },
    kpis: [
      { label: "Propriétaires", value: formatInteger(owners.length) },
      { label: "Encaissements alloués", value: formatCurrency(totals.inflows, currency) },
      { label: "Sorties d’exploitation", value: formatCurrency(totals.operatingOutflows, currency) },
      { label: "Solde consolidé", value: formatCurrency(totals.balance, currency) },
    ],
    tables: [{ title: "Portefeuille propriétaires", columns: [
      { key: "owner", label: "Propriétaire" }, { key: "status", label: "Statut" }, { key: "properties", label: "Biens", align: "right", format: "integer" },
      { key: "inflows", label: "Entrées", align: "right", format: "currency" }, { key: "outflows", label: "Sorties", align: "right", format: "currency" },
      { key: "payouts", label: "Reversements", align: "right", format: "currency" }, { key: "balance", label: "Solde", align: "right", format: "currency" },
    ], rows, totals: { properties: rows.reduce((sum, row) => sum + row.properties, 0), inflows: totals.inflows, outflows: totals.operatingOutflows, payouts: totals.payouts, balance: totals.balance } }],
    totals: { inflows: totals.inflows, expenses: totals.operatingOutflows, payouts: totals.payouts, balance: totals.balance }, warnings,
    sourceCounts: { owners: owners.length, apartments: apartments.length, payment_allocations: allocations.length },
  };
}

export async function getOwnerPayouts(filters: ReportFilters): Promise<ReportData> {
  const generatedAt = new Date().toISOString();
  const periodStart = filters.period_start;
  const periodEnd = filters.period_end;
  const currency = filters.currency ?? "MAD";
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("payments").select("id,owner_id,amount,status,occurred_on,paid_at,title,currency").eq("direction", "outflow").eq("category", "owner_payout").eq("currency", currency);
  if (periodStart) query = query.gte("occurred_on", periodStart);
  if (periodEnd) query = query.lte("occurred_on", periodEnd);
  const result = await query.order("occurred_on", { ascending: false });
  assertSupabaseResults("Reversements propriétaires", [result]);
  const payouts = result.data ?? [];
  const paid = payouts.filter((payout) => payout.status === "paid").reduce((sum, payout) => sum + Number(payout.amount), 0);
  const pending = payouts.filter((payout) => payout.status === "pending").reduce((sum, payout) => sum + Number(payout.amount), 0);
  return {
    metadata: { reportId: "owners-payouts", title: "Reversements propriétaires", generatedAt, periodStart, periodEnd, status: "ready", formulaVersion: "owner-payouts-v1", dataSourceVersion: "payments" },
    kpis: [{ label: "Total versé", value: formatCurrency(paid, currency) }, { label: "En attente", value: formatCurrency(pending, currency) }, { label: "Reversements", value: formatInteger(payouts.length) }],
    tables: [{ title: "Reversements", columns: [
      { key: "id", label: "ID" }, { key: "date", label: "Date", format: "date" }, { key: "amount", label: `Montant (${currency})`, align: "right", format: "currency" }, { key: "status", label: "Statut" }, { key: "title", label: "Libellé" },
    ], rows: payouts.map((payout) => ({ id: payout.id.slice(0, 8), date: payout.occurred_on, amount: Number(payout.amount), status: payout.status, title: payout.title ?? "-" })), totals: { amount: paid + pending } }],
    totals: { paid, pending }, warnings: [], sourceCounts: { payments: payouts.length },
  };
}
