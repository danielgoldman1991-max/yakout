import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPercent, formatInteger } from "../formatters";
import { computeConversionRate } from "../calculations";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable, ReportChart } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getSalesLeadFunnel(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  let query = supabase.from("leads").select("id, status, request_type, source, created_at")
    .gte("created_at", `${ps}T00:00:00`).lte("created_at", `${pe}T23:59:59`);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.activity) query = query.eq("request_type", filters.activity);

  const { data: leads, error: leadsError } = await query;
  assertSupabaseResults("Entonnoir des leads", [{ error: leadsError }]);
  if (!leads) {
    return {
      metadata: { reportId: "sales-lead-funnel", title: "Entonnoir des leads", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: ["Impossible de charger les leads."], sourceCounts: {},
    };
  }

  const byStatus: Record<string, number> = {};
  for (const l of leads) {
    const s = l.status || "new";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }

  const byType: Record<string, number> = {};
  for (const l of leads) {
    const t = l.request_type || "general";
    byType[t] = (byType[t] ?? 0) + 1;
  }

  const bySource: Record<string, number> = {};
  for (const l of leads) {
    const s = l.source || "Inconnue";
    bySource[s] = (bySource[s] ?? 0) + 1;
  }

  const total = leads.length;
  const confirmed = leads.filter((l) => l.status === "Confirme" || l.status === "confirmed").length;
  const lost = leads.filter((l) => l.status === "Perdu").length;
  const conversionRate = computeConversionRate(confirmed, total);

  const statusOrder = ["new", "Nouveau", "A qualifier", "Contacte", "Devis envoye", "Confirme", "Perdu", "A relancer"];
  const statusRows = statusOrder.filter((s) => byStatus[s]).map((s) => ({
    status: s,
    count: byStatus[s],
    percent: formatPercent((byStatus[s] / total) * 100),
  }));

  const tables: ReportTable[] = [
    {
      title: "Leads par statut",
      columns: [
        { key: "status", label: "Statut" },
        { key: "count", label: "Nombre", align: "right", format: "integer" },
        { key: "percent", label: "%", align: "right" },
      ],
      rows: statusRows,
      totals: { count: total },
    },
    {
      title: "Leads par type de demande",
      columns: [
        { key: "type", label: "Type" },
        { key: "count", label: "Nombre", align: "right", format: "integer" },
        { key: "percent", label: "%", align: "right" },
      ],
      rows: Object.entries(byType).map(([type, count]) => ({
        type, count, percent: formatPercent((count / total) * 100),
      })),
      totals: { count: total },
    },
    {
      title: "Leads par source",
      columns: [
        { key: "source", label: "Source" },
        { key: "count", label: "Nombre", align: "right", format: "integer" },
        { key: "percent", label: "%", align: "right" },
      ],
      rows: Object.entries(bySource).map(([source, count]) => ({
        source, count, percent: formatPercent((count / total) * 100),
      })),
      totals: { count: total },
    },
  ];

  const charts: ReportChart[] = [{
    type: "funnel",
    title: "Entonnoir de conversion",
    labels: statusRows.map((r) => r.status),
    datasets: [{ label: "Leads", values: statusRows.map((r) => Number(r.count)) }],
  }];

  if (Object.keys(bySource).length > 0) {
    charts.push({
      type: "pie",
      title: "Répartition par source",
      labels: Object.keys(bySource),
      datasets: [{ label: "Leads", values: Object.values(bySource) }],
    });
  }

  return {
    metadata: {
      reportId: "sales-lead-funnel", title: "Entonnoir des leads",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Total leads", value: formatInteger(total) },
      { label: "Confirmés", value: formatInteger(confirmed), trend: { value: formatPercent(conversionRate), positive: conversionRate > 0 } },
      { label: "Perdus", value: formatInteger(lost) },
    ],
    charts,
    tables,
    totals: { total, confirmed, lost },
    warnings: total === 0 ? ["Aucun lead trouvé sur la période."] : [],
    sourceCounts: { leads: total },
  };
}

export async function getSalesConversion(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: leads, error: leadsError } = await supabase.from("leads").select("id, status, source, created_at")
    .gte("created_at", `${ps}T00:00:00`).lte("created_at", `${pe}T23:59:59`);
  assertSupabaseResults("Conversion par source", [{ error: leadsError }]);
  if (!leads) {
    return {
      metadata: { reportId: "sales-conversion", title: "Conversion par source", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const bySource: Record<string, { total: number; confirmed: number; lost: number }> = {};
  for (const l of leads) {
    const s = l.source || "Inconnue";
    if (!bySource[s]) bySource[s] = { total: 0, confirmed: 0, lost: 0 };
    bySource[s].total++;
    if (l.status === "Confirme" || l.status === "confirmed") bySource[s].confirmed++;
    if (l.status === "Perdu") bySource[s].lost++;
  }

  const tables: ReportTable[] = [{
    title: "Taux de conversion par source",
    columns: [
      { key: "source", label: "Source" },
      { key: "total", label: "Total", align: "right", format: "integer" },
      { key: "confirmed", label: "Confirmés", align: "right", format: "integer" },
      { key: "lost", label: "Perdus", align: "right", format: "integer" },
      { key: "rate", label: "Taux", align: "right", format: "percent" },
    ],
    rows: Object.entries(bySource).map(([source, data]) => ({
      source,
      total: data.total,
      confirmed: data.confirmed,
      lost: data.lost,
      rate: computeConversionRate(data.confirmed, data.total),
    })),
  }];

  return {
    metadata: {
      reportId: "sales-conversion", title: "Conversion par source",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Sources", value: formatInteger(Object.keys(bySource).length) },
      { label: "Taux global", value: formatPercent(computeConversionRate(
        Object.values(bySource).reduce((s, d) => s + d.confirmed, 0),
        Object.values(bySource).reduce((s, d) => s + d.total, 0)
      )) },
    ],
    tables,
    totals: {},
    warnings: [],
    sourceCounts: { leads: leads.length },
  };
}
