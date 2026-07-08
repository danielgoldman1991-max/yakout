import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger } from "../formatters";
import { computeMargin } from "../calculations";
import { optionalNumber } from "../safe-values";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportKPI, ReportTable, ReportChart } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getExecutiveDashboard(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [paymentsRes, expensesRes, leadsRes, reservationsRes, tripsRes] = await Promise.all([
    supabase.from("payments").select("amount, status, paid_at").gte("paid_at", ps).lte("paid_at", pe),
    supabase.from("expenses").select("amount, expense_date").gte("expense_date", ps).lte("expense_date", pe),
    supabase.from("leads").select("id, status, source, request_type, created_at").gte("created_at", `${ps}T00:00:00`).lte("created_at", `${pe}T23:59:59`),
    supabase.from("reservations").select("id, total_amount, reservation_status, check_in, check_out, nights").lte("check_in", pe).gte("check_out", ps),
    supabase.from("trips").select("id, sold_price, cost_price, trip_status, trip_date").gte("trip_date", ps).lte("trip_date", pe),
  ]);
  assertSupabaseResults("Tableau de bord exécutif", [paymentsRes, expensesRes, leadsRes, reservationsRes, tripsRes]);

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const reservations = reservationsRes.data ?? [];
  const trips = tripsRes.data ?? [];

  const confirmedPayments = payments.filter((p) => p.status === "Paye" || p.status === "confirmed" || p.status === "completed");
  const revenue = confirmedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const margin = computeMargin(revenue, expenseTotal);

  const activeReservations = reservations.filter((r) => r.reservation_status !== "cancelled");
  const reservationRevenue = activeReservations.reduce((s, r) => s + Number(r.total_amount), 0);

  const tripRevenue = trips.filter((t) => t.trip_status !== "cancelled").reduce((s, t) => s + Number(t.sold_price), 0);
  const tripCost = trips.filter((t) => t.trip_status !== "cancelled").reduce((s, t) => s + Number(t.cost_price), 0);
  const tripMargin = computeMargin(tripRevenue, tripCost);

  const newLeads = leads.length;
  const confirmedLeads = leads.filter((l) => l.status === "Confirme" || l.status === "confirmed").length;

  const kpis: ReportKPI[] = [
    { label: "CA total", value: formatCurrency(revenue), description: "Paiements encaissés sur la période" },
    { label: "Dépenses", value: formatCurrency(expenseTotal), description: "Dépenses enregistrées" },
    { label: "Marge brute", value: formatCurrency(revenue - expenseTotal), trend: { value: formatPercent(margin), positive: margin >= 0 } },
    { label: "Réservations actives", value: formatInteger(activeReservations.length) },
    { label: "Revenus hébergement", value: formatCurrency(reservationRevenue) },
    { label: "CA transport", value: formatCurrency(tripRevenue), description: `Coût ${formatCurrency(tripCost)} · Marge ${formatPercent(tripMargin)}` },
    { label: "Nouveaux leads", value: formatInteger(newLeads), description: `${formatInteger(confirmedLeads)} confirmés (${formatPercent((confirmedLeads / (newLeads || 1)) * 100)})` },
    { label: "Trajets", value: formatInteger(trips.length) },
  ];

  const tables: ReportTable[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalReservationNights = activeReservations.reduce((s: number, r: any) => s + optionalNumber(r.nights), 0);
  const avgStay = activeReservations.length > 0 ? (totalReservationNights / activeReservations.length) : 0;
  const adr = totalReservationNights > 0 ? reservationRevenue / totalReservationNights : 0;

  tables.push({
    title: "Synthèse des activités",
    columns: [
      { key: "metric", label: "Indicateur" },
      { key: "value", label: "Valeur", align: "right" },
    ],
    rows: [
      { metric: "Occupation estimée (nuits)", value: formatInteger(totalReservationNights) },
      { metric: "Durée moyenne de séjour", value: `${avgStay.toFixed(1)} nuits` },
      { metric: "Prix moyen par nuit (ADR)", value: formatCurrency(adr) },
      { metric: "Réservations annulées", value: formatInteger(reservations.filter((r) => r.reservation_status === "cancelled").length) },
      { metric: "Leads perdus", value: formatInteger(leads.filter((l) => l.status === "Perdu").length) },
    ],
  });

  const charts: ReportChart[] = [];

  if (payments.length > 0) {
    const byMonth: Record<string, number> = {};
    for (const p of confirmedPayments) {
      const m = String(p.paid_at).slice(0, 7);
      byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount);
    }
    const sortedMonths = Object.keys(byMonth).sort();
    charts.push({
      type: "line",
      title: "Évolution du CA",
      labels: sortedMonths,
      datasets: [{ label: "CA encaissé", values: sortedMonths.map((m) => byMonth[m]) }],
    });
  }

  if (leads.length > 0) {
    const bySource: Record<string, number> = {};
    for (const l of leads) {
      const s = l.source || "Inconnue";
      bySource[s] = (bySource[s] ?? 0) + 1;
    }
    charts.push({
      type: "pie",
      title: "Leads par source",
      labels: Object.keys(bySource),
      datasets: [{ label: "Leads", values: Object.values(bySource) }],
    });
  }

  if (reservations.length > 0 || trips.length > 0) {
    const byActivity: Record<string, number> = {};
    byActivity["Hébergement"] = reservationRevenue;
    byActivity["Transport"] = tripRevenue;
    charts.push({
      type: "bar",
      title: "CA par activité",
      labels: Object.keys(byActivity),
      datasets: [{ label: "CA", values: Object.values(byActivity) }],
    });
  }

  return {
    metadata: {
      reportId: "executive-dashboard",
      title: "Tableau de bord exécutif",
      generatedAt: new Date().toISOString(),
      periodStart: ps,
      periodEnd: pe,
      status: paymentsRes.error || expensesRes.error ? "partial" : "ready",
    },
    kpis,
    charts: charts.length > 0 ? charts : undefined,
    tables,
    totals: { revenue, expenses: expenseTotal, margin: revenue - expenseTotal },
    warnings: payments.length === 0 ? ["Aucun paiement trouvé sur la période — vérifiez les filtres."] : [],
    sourceCounts: { payments: payments.length, expenses: expenses.length, leads: leads.length, reservations: reservations.length, trips: trips.length },
  };
}

export async function getExecutivePerformance(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [paymentsRes, tripsRes] = await Promise.all([
    supabase.from("payments").select("amount, activity_type, paid_at, status").gte("paid_at", ps).lte("paid_at", pe),
    supabase.from("trips").select("sold_price, cost_price, trip_status").gte("trip_date", ps).lte("trip_date", pe),
  ]);
  assertSupabaseResults("Performance par activité", [paymentsRes, tripsRes]);

  const payments = (paymentsRes.data ?? []).filter((p) => p.status === "Paye" || p.status === "confirmed" || p.status === "completed");
  const trips = (tripsRes.data ?? []).filter((t) => t.trip_status !== "cancelled");

  const byActivity: Record<string, { revenue: number; cost: number }> = {};

  for (const p of payments) {
    const a = p.activity_type || "Autre";
    if (!byActivity[a]) byActivity[a] = { revenue: 0, cost: 0 };
    byActivity[a].revenue += Number(p.amount);
  }

  byActivity["Transport"] = byActivity["Transport"] ?? { revenue: 0, cost: 0 };
  for (const t of trips) {
    byActivity["Transport"].revenue += Number(t.sold_price);
    byActivity["Transport"].cost += Number(t.cost_price);
  }

  const totalRevenue = Object.values(byActivity).reduce((s, a) => s + a.revenue, 0);
  const totalCost = Object.values(byActivity).reduce((s, a) => s + a.cost, 0);

  const tables: ReportTable[] = [{
    title: "Performance par activité",
    columns: [
      { key: "activity", label: "Activité" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "marginRate", label: "Taux", align: "right", format: "percent" },
    ],
    rows: Object.entries(byActivity).map(([activity, data]) => ({
      activity,
      revenue: data.revenue,
      cost: data.cost,
      margin: data.revenue - data.cost,
      marginRate: computeMargin(data.revenue, data.cost),
    })),
    totals: {
      revenue: totalRevenue,
      cost: totalCost,
      margin: totalRevenue - totalCost,
      marginRate: computeMargin(totalRevenue, totalCost),
    },
  }];

  return {
    metadata: {
      reportId: "executive-performance",
      title: "Performance par activité",
      generatedAt: new Date().toISOString(),
      periodStart: ps,
      periodEnd: pe,
      status: "ready",
    },
    kpis: [
      { label: "CA total", value: formatCurrency(totalRevenue) },
      { label: "Coût total", value: formatCurrency(totalCost) },
      { label: "Marge globale", value: formatCurrency(totalRevenue - totalCost), trend: { value: formatPercent(computeMargin(totalRevenue, totalCost)), positive: totalRevenue > totalCost } },
    ],
    tables,
    totals: { revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost },
    warnings: [],
    sourceCounts: { payments: payments.length, trips: trips.length },
  };
}
