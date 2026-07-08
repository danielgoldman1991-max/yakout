import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger } from "../formatters";
import { optionalNumber } from "../safe-values";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getOwnerMonthlyStatement(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ownerId = filters.owner_id;
  if (!ownerId) {
    return {
      metadata: { reportId: "owners-monthly-statement", title: "Relevé mensuel propriétaire", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: undefined, warnings: ["Veuillez sélectionner un propriétaire."], sourceCounts: {},
    };
  }

  const ps = filters.period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [ownerRes, propertiesRes] = await Promise.all([
    supabase.from("owners").select("id, full_name, phone, email, city").eq("id", ownerId).single(),
    supabase.from("apartments").select("id, internal_name, district, commission_rate").eq("owner_id", ownerId),
  ]);
  assertSupabaseResults("Relevé mensuel propriétaire", [ownerRes, propertiesRes]);

  if (ownerRes.error || !ownerRes.data) {
    return {
      metadata: { reportId: "owners-monthly-statement", title: "Relevé mensuel propriétaire", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: undefined, warnings: ["Propriétaire introuvable."], sourceCounts: {},
    };
  }

  const owner = ownerRes.data;
  const properties = propertiesRes.data ?? [];
  const propertyIds = properties.map((p) => p.id);

  if (propertyIds.length === 0) {
    return {
      metadata: { reportId: "owners-monthly-statement", title: `Relevé — ${owner.full_name}`, generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready" },
      kpis: [
        { label: "Propriétaire", value: owner.full_name },
        { label: "Biens", value: "0" },
        { label: "Revenus", value: formatCurrency(0) },
      ],
      tables: [], totals: undefined,
      warnings: ["Ce propriétaire n'a aucun bien."],
      sourceCounts: { properties: 0 },
    };
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id, check_in, check_out, total_amount, reservation_status, nights")
    .in("apartment_id", propertyIds)
    .lte("check_in", pe).gte("check_out", ps);
  assertSupabaseResults("Relevé mensuel propriétaire - réservations", [{ error: reservationsError }]);

  const activeRes = (reservations ?? []).filter((r) => r.reservation_status !== "cancelled");
  const totalRevenue = activeRes.reduce((s, r) => s + Number(r.total_amount), 0);

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("id, amount, category, expense_date, notes")
    .in("apartment_id", propertyIds)
    .gte("expense_date", ps).lte("expense_date", pe);
  assertSupabaseResults("Relevé mensuel propriétaire - dépenses", [{ error: expensesError }]);

  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const commissionRate = 0.20;
  const commissionAmount = totalRevenue * commissionRate;
  const netAmount = totalRevenue - expenseTotal - commissionAmount;

  const tables: ReportTable[] = [];

  if (activeRes.length > 0) {
    tables.push({
      title: "Réservations sur la période",
      columns: [
        { key: "id", label: "ID" },
        { key: "checkIn", label: "Arrivée" },
        { key: "checkOut", label: "Départ" },
        { key: "nights", label: "Nuits", align: "right", format: "integer" },
        { key: "amount", label: "Montant", align: "right", format: "currency" },
      ],
      rows: activeRes.map((r) => ({
        id: r.id.slice(0, 8),
        checkIn: r.check_in,
        checkOut: r.check_out,
        nights: optionalNumber(r.nights),
        amount: Number(r.total_amount),
      })),
      totals: { nights: activeRes.reduce((s, r) => s + optionalNumber(r.nights), 0), amount: totalRevenue },
    });
  }

  if ((expenses ?? []).length > 0) {
    tables.push({
      title: "Dépenses sur la période",
      columns: [
        { key: "date", label: "Date" },
        { key: "category", label: "Catégorie" },
        { key: "amount", label: "Montant", align: "right", format: "currency" },
      ],
      rows: (expenses ?? []).map((e) => ({
        date: e.expense_date,
        category: e.category,
        amount: Number(e.amount),
      })),
      totals: { amount: expenseTotal },
    });
  }

  tables.push({
    title: "Synthèse financière",
    columns: [
      { key: "item", label: "" },
      { key: "amount", label: "Montant", align: "right", format: "currency" },
    ],
    rows: [
      { item: "Revenus bruts", amount: totalRevenue },
      { item: "Dépenses", amount: expenseTotal },
      { item: "Commission Yakout (20%)", amount: commissionAmount },
      { item: "Net propriétaire", amount: netAmount },
    ],
  });

  return {
    metadata: {
      reportId: "owners-monthly-statement", title: `Relevé — ${owner.full_name}`,
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Propriétaire", value: owner.full_name, description: `${owner.city || ""}` },
      { label: "Biens", value: formatInteger(properties.length) },
      { label: "Revenus", value: formatCurrency(totalRevenue) },
      { label: "Net", value: formatCurrency(netAmount), trend: { value: `${formatPercent(netAmount / (totalRevenue || 1) * 100)} de marge nette`, positive: netAmount >= 0 } },
    ],
    tables,
    totals: { revenue: totalRevenue, expenses: expenseTotal, commission: commissionAmount, net: netAmount },
    warnings: activeRes.length === 0 ? ["Aucune réservation active sur la période."] : [],
    sourceCounts: { reservations: (reservations ?? []).length, expenses: (expenses ?? []).length },
  };
}

export async function getOwnersConsolidated(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: owners, error: ownersError } = await supabase.from("owners").select("id, full_name, status, city").order("full_name", { ascending: true });
  assertSupabaseResults("Rapport consolidé propriétaires", [{ error: ownersError }]);

  if (!owners || owners.length === 0) {
    return {
      metadata: { reportId: "owners-consolidated", title: "Rapport consolidé propriétaires", generatedAt: new Date().toISOString(), status: "ready" },
      kpis: [{ label: "Propriétaires", value: "0" }], tables: [], totals: undefined, warnings: ["Aucun propriétaire trouvé."], sourceCounts: {},
    };
  }

  const rows: Record<string, unknown>[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const owner of owners) {
    const { data: properties, error: propertiesError } = await supabase.from("apartments").select("id").eq("owner_id", owner.id);
    assertSupabaseResults("Rapport consolidé propriétaires - biens", [{ error: propertiesError }]);
    const propertyIds = (properties ?? []).map((p) => p.id);
    if (propertyIds.length === 0) {
      rows.push({ owner: owner.full_name, status: owner.status || "-", properties: 0, revenue: 0, expenses: 0, net: 0 });
      continue;
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("total_amount, reservation_status, check_in, check_out")
      .in("apartment_id", propertyIds)
      .lte("check_in", pe).gte("check_out", ps);
    assertSupabaseResults("Rapport consolidé propriétaires - réservations", [{ error: reservationsError }]);

    const revenue = (reservations ?? []).filter((r) => r.reservation_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);

    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("amount")
      .in("apartment_id", propertyIds)
      .gte("expense_date", ps).lte("expense_date", pe);
    assertSupabaseResults("Rapport consolidé propriétaires - dépenses", [{ error: expensesError }]);

    const expenses = (expensesData ?? []).reduce((s, e) => s + Number(e.amount), 0);

    const commission = revenue * 0.2;
    const net = revenue - expenses - commission;

    rows.push({
      owner: owner.full_name,
      status: owner.status || "-",
      properties: propertyIds.length,
      revenue,
      expenses,
      commission,
      net,
    });

    totalRevenue += revenue;
    totalExpenses += expenses;
  }

  const totalCommission = totalRevenue * 0.2;

  const tables: ReportTable[] = [{
    title: "Portefeuille propriétaires",
    columns: [
      { key: "owner", label: "Propriétaire" },
      { key: "status", label: "Statut" },
      { key: "properties", label: "Biens", align: "right", format: "integer" },
      { key: "revenue", label: "Revenus", align: "right", format: "currency" },
      { key: "expenses", label: "Dépenses", align: "right", format: "currency" },
      { key: "commission", label: "Commission", align: "right", format: "currency" },
      { key: "net", label: "Net", align: "right", format: "currency" },
    ],
    rows,
    totals: { properties: rows.reduce((s, r) => s + optionalNumber(r.properties), 0), revenue: totalRevenue, expenses: totalExpenses, commission: totalCommission, net: totalRevenue - totalExpenses - totalCommission },
  }];

  const activeOwners = owners.filter((o) => o.status === "active_management" || o.status === "published").length;

  return {
    metadata: {
      reportId: "owners-consolidated", title: "Rapport consolidé propriétaires",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Propriétaires", value: formatInteger(owners.length), description: `${formatInteger(activeOwners)} en gestion active` },
      { label: "Revenus totaux", value: formatCurrency(totalRevenue) },
      { label: "Dépenses", value: formatCurrency(totalExpenses) },
      { label: "Net consolidé", value: formatCurrency(totalRevenue - totalExpenses - totalCommission) },
    ],
    tables,
    totals: { revenue: totalRevenue, expenses: totalExpenses },
    warnings: [],
    sourceCounts: { owners: owners.length },
  };
}

export async function getOwnerPayouts(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start;
  const pe = filters.period_end;

  let query = supabase
    .from("owner_payouts")
    .select("id, owner_id, amount, payout_status, paid_at, notes");
  if (ps) query = query.gte("created_at", `${ps}T00:00:00`);
  if (pe) query = query.lte("created_at", `${pe}T23:59:59`);

  const { data: payouts, error: payoutsError } = await query.order("created_at", { ascending: false });
  assertSupabaseResults("Reversements propriétaires", [{ error: payoutsError }]);

  if (!payouts) {
    return {
      metadata: { reportId: "owners-payouts", title: "Reversements propriétaires", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: undefined, warnings: ["Données indisponibles ou non certifiées."], sourceCounts: {},
    };
  }

  const totalPaid = payouts.filter((p) => p.payout_status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payouts.filter((p) => p.payout_status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  const tables: ReportTable[] = [{
    title: "Reversements",
    columns: [
      { key: "id", label: "ID" },
      { key: "amount", label: "Montant", align: "right", format: "currency" },
      { key: "status", label: "Statut" },
      { key: "paidAt", label: "Payé le" },
      { key: "notes", label: "Notes" },
    ],
    rows: payouts.map((p) => ({
      id: p.id.slice(0, 8),
      amount: Number(p.amount),
      status: p.payout_status,
      paidAt: p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "-",
      notes: p.notes || "-",
    })),
    totals: { amount: totalPaid + totalPending },
  }];

  return {
    metadata: {
      reportId: "owners-payouts", title: "Reversements propriétaires",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Total versé", value: formatCurrency(totalPaid) },
      { label: "En attente", value: formatCurrency(totalPending) },
      { label: "Nombre de reversements", value: formatInteger(payouts.length) },
    ],
    tables,
    totals: { paid: totalPaid, pending: totalPending },
    warnings: payouts.length === 0 ? ["Aucun reversement trouvé pour la période."] : [],
    sourceCounts: { payouts: payouts.length },
  };
}
