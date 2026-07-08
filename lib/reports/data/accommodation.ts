import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger, formatReportDate } from "../formatters";
import { computeOccupancyRate, computeADR, computeRevPAR } from "../calculations";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable, ReportChart } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getAccommodationPerformance(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);
  const periodDays = Math.max(1, Math.round((new Date(pe).getTime() - new Date(ps).getTime()) / 86400000) + 1);

  const { data: apartments, error: apartmentsError } = await supabase.from("apartments").select("id, internal_name, public_name, district");
  assertSupabaseResults("Performance du portefeuille", [{ error: apartmentsError }]);
  if (!apartments) {
    return {
      metadata: { reportId: "accommodation-performance", title: "Performance du portefeuille", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: ["Impossible de charger les appartements."], sourceCounts: {},
    };
  }

  const rows: Record<string, unknown>[] = [];
  let totalRevenue = 0;
  let totalNights = 0;
  let totalReservations = 0;
  let totalCancellations = 0;

  for (const apt of apartments) {
    if (filters.apartment_id && apt.id !== filters.apartment_id) continue;

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, check_in, check_out, nights, total_amount, reservation_status")
      .eq("apartment_id", apt.id);
    assertSupabaseResults("Performance du portefeuille - réservations", [{ error: reservationsError }]);

    const active = (reservations ?? []).filter((r) => r.reservation_status !== "cancelled");
    const cancelled = (reservations ?? []).filter((r) => r.reservation_status === "cancelled");

    let occupiedNights = 0;
    for (const r of active) {
      const cin = new Date(r.check_in);
      const cout = new Date(r.check_out);
      const start = cin < new Date(ps) ? new Date(ps) : cin;
      const end = cout > new Date(pe) ? new Date(pe) : cout;
      occupiedNights += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
    }

    const revenue = active.reduce((s, r) => s + Number(r.total_amount), 0);
    const occRate = computeOccupancyRate(occupiedNights, periodDays);
    const adr = computeADR(revenue, occupiedNights);
    const revpar = computeRevPAR(revenue, periodDays);

    rows.push({
      apartment: apt.internal_name || apt.public_name || "Sans titre",
      district: apt.district || "-",
      occupiedNights,
      occRate: occRate,
      adr,
      revpar,
      revenue,
      reservations: active.length,
      cancellations: cancelled.length,
    });

    totalRevenue += revenue;
    totalNights += occupiedNights;
    totalReservations += active.length;
    totalCancellations += cancelled.length;
  }

  const tables: ReportTable[] = [{
    title: "Performance par appartement",
    columns: [
      { key: "apartment", label: "Appartement" },
      { key: "district", label: "Quartier" },
      { key: "occupiedNights", label: "Nuits", align: "right", format: "integer" },
      { key: "occRate", label: "Occupation", align: "right", format: "percent" },
      { key: "adr", label: "ADR", align: "right", format: "currency" },
      { key: "revpar", label: "RevPAR", align: "right", format: "currency" },
      { key: "revenue", label: "Revenus", align: "right", format: "currency" },
      { key: "reservations", label: "Réservations", align: "right", format: "integer" },
      { key: "cancellations", label: "Annulations", align: "right", format: "integer" },
    ],
    rows,
    totals: {
      occupiedNights: totalNights,
      occRate: computeOccupancyRate(totalNights, periodDays * Math.max(1, rows.length)),
      adr: computeADR(totalRevenue, totalNights),
      revpar: computeRevPAR(totalRevenue, periodDays * Math.max(1, rows.length)),
      revenue: totalRevenue,
      reservations: totalReservations,
      cancellations: totalCancellations,
    },
  }];

  const charts: ReportChart[] = [{
    type: "bar",
    title: "Revenus par appartement",
    labels: rows.map((r) => String(r.apartment)),
    datasets: [{ label: "Revenus", values: rows.map((r) => Number(r.revenue)) }],
  }];

  return {
    metadata: {
      reportId: "accommodation-performance", title: "Performance du portefeuille",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Appartements", value: formatInteger(rows.length) },
      { label: "Revenus totaux", value: formatCurrency(totalRevenue) },
      { label: "Occupation moyenne", value: formatPercent(computeOccupancyRate(totalNights, periodDays * Math.max(1, rows.length))) },
      { label: "ADR moyen", value: formatCurrency(computeADR(totalRevenue, totalNights)) },
    ],
    tables,
    charts,
    totals: { revenue: totalRevenue, nights: totalNights },
    warnings: rows.length === 0 ? ["Aucun appartement trouvé."] : [],
    sourceCounts: { apartments: apartments.length },
  };
}

export async function getAccommodationReservations(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("reservations")
    .select("id, check_in, check_out, nights, total_amount, deposit_amount, remaining_amount, reservation_status, payment_status, people_count, apartment_id, client_id, created_at")
    .lte("check_in", pe).gte("check_out", ps);

  if (filters.status) query = query.eq("reservation_status", filters.status);
  if (filters.apartment_id) query = query.eq("apartment_id", filters.apartment_id);

  const { data: reservations, error: reservationsError } = await query.order("check_in", { ascending: false });
  assertSupabaseResults("Réservations détaillées", [{ error: reservationsError }]);
  if (!reservations) {
    return {
      metadata: { reportId: "accommodation-reservations", title: "Réservations détaillées", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const totalAmount = reservations.reduce((s, r) => s + Number(r.total_amount), 0);
  const depositAmount = reservations.reduce((s, r) => s + Number(r.deposit_amount), 0);
  const pendingAmount = reservations.filter((r) => r.payment_status !== "Paye").reduce((s, r) => s + Number(r.remaining_amount), 0);

  const tables: ReportTable[] = [{
    title: "Réservations",
    columns: [
      { key: "id", label: "ID" },
      { key: "checkIn", label: "Arrivée", format: "date" },
      { key: "checkOut", label: "Départ", format: "date" },
      { key: "nights", label: "Nuits", align: "right", format: "integer" },
      { key: "totalAmount", label: "Total", align: "right", format: "currency" },
      { key: "depositAmount", label: "Acompte", align: "right", format: "currency" },
      { key: "remainingAmount", label: "Restant", align: "right", format: "currency" },
      { key: "status", label: "Statut" },
      { key: "paymentStatus", label: "Paiement" },
    ],
    rows: reservations.map((r) => ({
      id: r.id.slice(0, 8),
      checkIn: formatReportDate(r.check_in),
      checkOut: formatReportDate(r.check_out),
      nights: Number(r.nights),
      totalAmount: Number(r.total_amount),
      depositAmount: Number(r.deposit_amount),
      remainingAmount: Number(r.remaining_amount),
      status: r.reservation_status,
      paymentStatus: r.payment_status,
    })),
    totals: { totalAmount, depositAmount, remainingAmount: pendingAmount },
  }];

  return {
    metadata: {
      reportId: "accommodation-reservations", title: "Réservations détaillées",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Réservations", value: formatInteger(reservations.length) },
      { label: "Montant total", value: formatCurrency(totalAmount) },
      { label: "Acomptes encaissés", value: formatCurrency(depositAmount) },
      { label: "Restant à percevoir", value: formatCurrency(pendingAmount) },
      { label: "Annulées", value: formatInteger(reservations.filter((r) => r.reservation_status === "cancelled").length) },
    ],
    tables,
    totals: { totalAmount, depositAmount, pendingAmount },
    warnings: reservations.length === 0 ? ["Aucune réservation trouvée sur la période."] : [],
    sourceCounts: { reservations: reservations.length },
  };
}

export async function getAccommodationArrivalsDepartures(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date().toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date(new Date(Date.now() + 30 * 86400000)).toISOString().slice(0, 10);

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id, check_in, check_out, total_amount, reservation_status, people_count, apartment_id, client_id, nights")
    .gte("check_in", ps).lte("check_in", pe)
    .in("reservation_status", ["confirmed", "Pre-reservation", "Confirmée"])
    .order("check_in", { ascending: true });
  assertSupabaseResults("Arrivées et départs", [{ error: reservationsError }]);

  const arrivals = (reservations ?? []).map((r) => ({
    date: formatReportDate(r.check_in),
    id: r.id.slice(0, 8),
    nights: Number(r.nights),
    amount: Number(r.total_amount),
  }));

  const departures = (reservations ?? []).map((r) => ({
    date: formatReportDate(r.check_out),
    id: r.id.slice(0, 8),
    nights: Number(r.nights),
    amount: Number(r.total_amount),
  }));

  const byArrival: Record<string, number> = {};
  const byDeparture: Record<string, number> = {};
  for (const a of arrivals) byArrival[a.date] = (byArrival[a.date] ?? 0) + 1;
  for (const d of departures) byDeparture[d.date] = (byDeparture[d.date] ?? 0) + 1;

  const allDates = [...new Set([...Object.keys(byArrival), ...Object.keys(byDeparture)])].sort();

  const tables: ReportTable[] = [{
    title: "Arrivées par jour",
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "count", label: "Arrivées", align: "right", format: "integer" },
      { key: "departures", label: "Départs", align: "right", format: "integer" },
    ],
    rows: allDates.map((d) => ({ date: d, count: byArrival[d] ?? 0, departures: byDeparture[d] ?? 0 })),
    totals: { count: arrivals.length, departures: departures.length },
  }];

  return {
    metadata: {
      reportId: "accommodation-arrivals-departures", title: "Arrivées et départs",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Arrivées", value: formatInteger(arrivals.length) },
      { label: "Départs", value: formatInteger(departures.length) },
      { label: "CA estimé", value: formatCurrency((reservations ?? []).reduce((s, r) => s + Number(r.total_amount), 0)) },
    ],
    tables,
    warnings: !reservations || reservations.length === 0 ? ["Aucune arrivée prévue sur la période."] : [],
    sourceCounts: { reservations: (reservations ?? []).length },
  };
}
