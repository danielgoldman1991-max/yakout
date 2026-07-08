import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger, formatReportDate } from "../formatters";
import { computeMargin } from "../calculations";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getTransportPerformance(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [tripsRes, transfersRes] = await Promise.all([
    supabase.from("trips").select("id, sold_price, cost_price, margin, trip_status, trip_date")
      .gte("trip_date", ps).lte("trip_date", pe),
    supabase.from("transfers").select("id, amount, cost_amount, status, pickup_date")
      .gte("pickup_date", ps).lte("pickup_date", pe),
  ]);
  assertSupabaseResults("Performance transport", [tripsRes, transfersRes]);

  const trips = (tripsRes.data ?? []).filter((t) => t.trip_status !== "cancelled");
  const transfers = (transfersRes.data ?? []).filter((t) => t.status !== "cancelled");

  const tripRevenue = trips.reduce((s, t) => s + Number(t.sold_price), 0);
  const tripCost = trips.reduce((s, t) => s + Number(t.cost_price), 0);
  const tripMarginTotal = tripRevenue - tripCost;
  const tripMarginRate = computeMargin(tripRevenue, tripCost);

  const transferRevenue = transfers.reduce((s, t) => s + Number(t.amount), 0);
  const transferCost = transfers.reduce((s, t) => s + Number(t.cost_amount), 0);

  const totalRevenue = tripRevenue + transferRevenue;
  const totalCost = tripCost + transferCost;

  const tables: ReportTable[] = [{
    title: "Performance transport",
    columns: [
      { key: "type", label: "Type" },
      { key: "count", label: "Nombre", align: "right", format: "integer" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "marginRate", label: "Taux", align: "right", format: "percent" },
    ],
    rows: [
      {
        type: "Trajets",
        count: trips.length,
        revenue: tripRevenue,
        cost: tripCost,
        margin: tripMarginTotal,
        marginRate: tripMarginRate,
      },
      {
        type: "Transferts",
        count: transfers.length,
        revenue: transferRevenue,
        cost: transferCost,
        margin: transferRevenue - transferCost,
        marginRate: computeMargin(transferRevenue, transferCost),
      },
    ],
    totals: {
      count: trips.length + transfers.length,
      revenue: totalRevenue,
      cost: totalCost,
      margin: totalRevenue - totalCost,
      marginRate: computeMargin(totalRevenue, totalCost),
    },
  }];

  return {
    metadata: {
      reportId: "transport-performance", title: "Performance transport",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "CA transport", value: formatCurrency(totalRevenue) },
      { label: "Coûts", value: formatCurrency(totalCost) },
      { label: "Marge", value: formatCurrency(totalRevenue - totalCost), trend: { value: formatPercent(computeMargin(totalRevenue, totalCost)), positive: totalRevenue > totalCost } },
      { label: "Trajets", value: formatInteger(trips.length) },
      { label: "Transferts", value: formatInteger(transfers.length) },
    ],
    tables,
    totals: { revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost },
    warnings: trips.length === 0 && transfers.length === 0 ? ["Aucune activité transport sur la période."] : [],
    sourceCounts: { trips: trips.length, transfers: transfers.length },
  };
}

export async function getTransportTrips(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, title, trip_date, sold_price, cost_price, margin, trip_status, departure, destination, trip_type")
    .gte("trip_date", ps).lte("trip_date", pe)
    .order("trip_date", { ascending: false });

  assertSupabaseResults("Trajets détaillés", [{ error: tripsError }]);
  if (!trips) {
    return {
      metadata: { reportId: "transport-trips", title: "Trajets détaillés", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const totalRevenue = trips.filter((t) => t.trip_status !== "cancelled").reduce((s, t) => s + Number(t.sold_price), 0);
  const totalCost = trips.filter((t) => t.trip_status !== "cancelled").reduce((s, t) => s + Number(t.cost_price), 0);

  const tables: ReportTable[] = [{
    title: "Trajets",
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Trajet" },
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "status", label: "Statut" },
    ],
    rows: trips.map((t) => ({
      id: t.id.slice(0, 8),
      title: t.title || `${t.departure || ""} → ${t.destination || ""}`,
      date: formatReportDate(t.trip_date),
      type: t.trip_type || "-",
      revenue: Number(t.sold_price),
      cost: Number(t.cost_price),
      margin: Number(t.margin ?? Number(t.sold_price) - Number(t.cost_price)),
      status: t.trip_status || "-",
    })),
    totals: { revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost },
  }];

  return {
    metadata: {
      reportId: "transport-trips", title: "Trajets détaillés",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Trajets", value: formatInteger(trips.length) },
      { label: "CA total", value: formatCurrency(totalRevenue) },
      { label: "Coût total", value: formatCurrency(totalCost) },
      { label: "Marge totale", value: formatCurrency(totalRevenue - totalCost) },
    ],
    tables,
    totals: { revenue: totalRevenue, cost: totalCost },
    warnings: trips.length === 0 ? ["Aucun trajet trouvé sur la période."] : [],
    sourceCounts: { trips: trips.length },
  };
}
