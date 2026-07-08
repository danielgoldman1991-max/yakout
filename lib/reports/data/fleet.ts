import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatInteger } from "../formatters";
import { computeMargin } from "../calculations";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getFleetVehicleUsage(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [vehiclesRes, tripsRes] = await Promise.all([
    supabase.from("vehicles").select("id, internal_name, brand, model, plate_number, capacity, availability_status"),
    supabase.from("trips").select("id, vehicle_id, sold_price, cost_price, margin, trip_status, trip_date")
      .gte("trip_date", ps).lte("trip_date", pe),
  ]);
  assertSupabaseResults("Utilisation des véhicules", [vehiclesRes, tripsRes]);

  const vehicles = vehiclesRes.data ?? [];
  const trips = (tripsRes.data ?? []).filter((t) => t.trip_status !== "cancelled");

  const byVehicle: Record<string, { trips: number; revenue: number; cost: number; margin: number }> = {};
  for (const t of trips) {
    if (!t.vehicle_id) continue;
    if (!byVehicle[t.vehicle_id]) byVehicle[t.vehicle_id] = { trips: 0, revenue: 0, cost: 0, margin: 0 };
    byVehicle[t.vehicle_id].trips++;
    byVehicle[t.vehicle_id].revenue += Number(t.sold_price);
    byVehicle[t.vehicle_id].cost += Number(t.cost_price);
    byVehicle[t.vehicle_id].margin += Number(t.margin ?? Number(t.sold_price) - Number(t.cost_price));
  }

  const totalTrips = trips.length;
  let totalRevenue = 0;
  let totalCost = 0;

  const rows = vehicles.map((v) => {
    const data = byVehicle[v.id] ?? { trips: 0, revenue: 0, cost: 0, margin: 0 };
    totalRevenue += data.revenue;
    totalCost += data.cost;
    return {
      vehicle: `${v.internal_name}${v.brand ? ` (${v.brand})` : ""}`,
      plate: v.plate_number || "-",
      capacity: v.capacity ?? "-",
      trips: data.trips,
      revenue: data.revenue,
      cost: data.cost,
      margin: data.margin,
      marginRate: computeMargin(data.revenue, data.cost),
      status: v.availability_status || "-",
    };
  });

  const tables: ReportTable[] = [{
    title: "Utilisation des véhicules",
    columns: [
      { key: "vehicle", label: "Véhicule" },
      { key: "plate", label: "Immatriculation" },
      { key: "capacity", label: "Capacité", align: "right" },
      { key: "trips", label: "Trajets", align: "right", format: "integer" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "marginRate", label: "Taux", align: "right", format: "percent" },
    ],
    rows,
    totals: { trips: totalTrips, revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost, marginRate: computeMargin(totalRevenue, totalCost) },
  }];

  return {
    metadata: {
      reportId: "fleet-vehicle-usage", title: "Utilisation des véhicules",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Véhicules", value: formatInteger(vehicles.length) },
      { label: "Trajets", value: formatInteger(totalTrips) },
      { label: "CA total", value: formatCurrency(totalRevenue) },
      { label: "Marge totale", value: formatCurrency(totalRevenue - totalCost) },
    ],
    tables,
    totals: { revenue: totalRevenue, cost: totalCost },
    warnings: vehicles.length === 0 ? ["Aucun véhicule trouvé."] : [],
    sourceCounts: { vehicles: vehicles.length, trips: trips.length },
  };
}

export async function getFleetPartnerPerformance(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [partnersRes, tripsRes] = await Promise.all([
    supabase.from("partners").select("id, name, partner_type, city, status").eq("partner_type", "transport_company"),
    supabase.from("trips").select("id, partner_id, sold_price, cost_price, margin, trip_status")
      .gte("trip_date", ps).lte("trip_date", pe),
  ]);
  assertSupabaseResults("Performance partenaires", [partnersRes, tripsRes]);

  const partners = partnersRes.data ?? [];
  const trips = (tripsRes.data ?? []).filter((t) => t.trip_status !== "cancelled");

  const byPartner: Record<string, { trips: number; revenue: number; cost: number }> = {};
  for (const t of trips) {
    if (!t.partner_id) continue;
    if (!byPartner[t.partner_id]) byPartner[t.partner_id] = { trips: 0, revenue: 0, cost: 0 };
    byPartner[t.partner_id].trips++;
    byPartner[t.partner_id].revenue += Number(t.sold_price);
    byPartner[t.partner_id].cost += Number(t.cost_price);
  }

  const totalRevenue = Object.values(byPartner).reduce((s, d) => s + d.revenue, 0);
  const totalCost = Object.values(byPartner).reduce((s, d) => s + d.cost, 0);

  const rows = partners.map((p) => {
    const data = byPartner[p.id] ?? { trips: 0, revenue: 0, cost: 0 };
    return {
      partner: p.name,
      city: p.city || "-",
      trips: data.trips,
      revenue: data.revenue,
      cost: data.cost,
      margin: data.revenue - data.cost,
      marginRate: computeMargin(data.revenue, data.cost),
    };
  });

  const tables: ReportTable[] = [{
    title: "Performance partenaires transport",
    columns: [
      { key: "partner", label: "Partenaire" },
      { key: "city", label: "Ville" },
      { key: "trips", label: "Trajets", align: "right", format: "integer" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "marginRate", label: "Taux", align: "right", format: "percent" },
    ],
    rows,
    totals: { trips: Object.values(byPartner).reduce((s, d) => s + d.trips, 0), revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost, marginRate: computeMargin(totalRevenue, totalCost) },
  }];

  return {
    metadata: {
      reportId: "fleet-partner-performance", title: "Performance partenaires",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Partenaires", value: formatInteger(partners.length) },
      { label: "CA transport", value: formatCurrency(totalRevenue) },
      { label: "Marge nette", value: formatCurrency(totalRevenue - totalCost) },
    ],
    tables,
    totals: {},
    warnings: partners.length === 0 ? ["Aucun partenaire transport trouvé."] : [],
    sourceCounts: { partners: partners.length, trips: trips.length },
  };
}
