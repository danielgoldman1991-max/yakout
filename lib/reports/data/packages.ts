import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger } from "../formatters";
import { computeMargin } from "../calculations";
import { optionalNumber } from "../safe-values";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getPackagesSales(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start;
  const pe = filters.period_end;

  const [packagesRes, reservationsRes] = await Promise.all([
    supabase.from("packages").select("id, title, slug, public_status, price_from, currency"),
    supabase.from("reservations").select("id, package_id, total_amount, reservation_status, check_in, nights"),
  ]);
  assertSupabaseResults("Ventes de packs", [packagesRes, reservationsRes]);

  const packages = packagesRes.data ?? [];
  const reservations = (reservationsRes.data ?? []).filter((r) => r.reservation_status !== "cancelled");

  const filteredReservations = ps
    ? reservations.filter((r) => r.check_in >= ps)
    : reservations;
  const finalReservations = pe
    ? filteredReservations.filter((r) => r.check_in <= pe)
    : filteredReservations;

  const byPackage: Record<string, { reservations: number; revenue: number; nights: number }> = {};
  for (const r of finalReservations) {
    if (!r.package_id) continue;
    if (!byPackage[r.package_id]) byPackage[r.package_id] = { reservations: 0, revenue: 0, nights: 0 };
    byPackage[r.package_id].reservations++;
    byPackage[r.package_id].revenue += Number(r.total_amount);
    byPackage[r.package_id].nights += optionalNumber(r.nights);
  }

  const packageIdsWithData = Object.keys(byPackage);
  const itemsRes = packageIdsWithData.length > 0
    ? await supabase.from("package_items").select("package_id, cost_amount, price_amount").in("package_id", packageIdsWithData)
    : { data: [], error: null };
  assertSupabaseResults("Ventes de packs - éléments", [itemsRes]);
  const items = itemsRes.data;

  const costByPackage: Record<string, number> = {};
  for (const item of items ?? []) {
    if (!item.package_id) continue;
    costByPackage[item.package_id] = optionalNumber(costByPackage[item.package_id]) + optionalNumber(item.cost_amount);
  }

  const totalRevenue = Object.values(byPackage).reduce((s, d) => s + d.revenue, 0);
  const totalCost = Object.values(costByPackage).reduce((s, cost) => s + cost, 0);

  const rows = packages.map((pkg) => {
    const data = byPackage[pkg.id] ?? { reservations: 0, revenue: 0, nights: 0 };
    const cost = costByPackage[pkg.id] ?? 0;
    return {
      package: pkg.title,
      status: pkg.public_status || "-",
      reservations: data.reservations,
      revenue: data.revenue,
      cost,
      margin: data.revenue - cost,
      marginRate: computeMargin(data.revenue, cost),
      nights: data.nights,
      priceFrom: optionalNumber(pkg.price_from),
    };
  });

  const tables: ReportTable[] = [{
    title: "Ventes de packs",
    columns: [
      { key: "package", label: "Pack" },
      { key: "reservations", label: "Réservations", align: "right", format: "integer" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "cost", label: "Coût", align: "right", format: "currency" },
      { key: "margin", label: "Marge", align: "right", format: "currency" },
      { key: "marginRate", label: "Taux", align: "right", format: "percent" },
    ],
    rows,
    totals: { reservations: Object.values(byPackage).reduce((s, d) => s + d.reservations, 0), revenue: totalRevenue, cost: totalCost, margin: totalRevenue - totalCost, marginRate: computeMargin(totalRevenue, totalCost) },
  }];

  return {
    metadata: {
      reportId: "packages-sales", title: "Ventes de packs",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Packs", value: formatInteger(packages.length) },
      { label: "Réservations", value: formatInteger(Object.values(byPackage).reduce((s, d) => s + d.reservations, 0)) },
      { label: "CA total", value: formatCurrency(totalRevenue) },
      { label: "Marge", value: formatCurrency(totalRevenue - totalCost), trend: { value: formatPercent(computeMargin(totalRevenue, totalCost)), positive: totalRevenue > totalCost } },
    ],
    tables,
    totals: { revenue: totalRevenue, cost: totalCost },
    warnings: Object.keys(byPackage).length === 0 ? ["Aucune vente de pack sur la période."] : [],
    sourceCounts: { packages: packages.length, reservations: reservations.length },
  };
}
