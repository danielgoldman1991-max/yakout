import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatInteger } from "../formatters";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable, ReportChart } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getClientsPortfolio(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, nationality, acquisition_source, created_at")
    .order("created_at", { ascending: false });
  assertSupabaseResults("Portefeuille clients", [{ error: clientsError }]);

  if (!clients) {
    return {
      metadata: { reportId: "clients-portfolio", title: "Portefeuille clients", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id, client_id, total_amount, reservation_status, check_in");
  assertSupabaseResults("Portefeuille clients - réservations", [{ error: reservationsError }]);

  const byClient: Record<string, { reservations: number; revenue: number; lastStay: string | null }> = {};
  for (const r of reservations ?? []) {
    if (!r.client_id) continue;
    if (!byClient[r.client_id]) byClient[r.client_id] = { reservations: 0, revenue: 0, lastStay: null };
    byClient[r.client_id].reservations++;
    if (r.reservation_status !== "cancelled") {
      byClient[r.client_id].revenue += Number(r.total_amount);
    }
    if (!byClient[r.client_id].lastStay || r.check_in > byClient[r.client_id].lastStay!) {
      byClient[r.client_id].lastStay = r.check_in;
    }
  }

  const ps = filters.period_start;
  const pe = filters.period_end;
  const filtered = clients.filter((c) => {
    if (ps && c.created_at < ps) return false;
    if (pe && c.created_at > pe) return false;
    return true;
  });

  const byNationality: Record<string, number> = {};
  for (const c of clients) {
    const n = c.nationality || "Non renseigné";
    byNationality[n] = (byNationality[n] ?? 0) + 1;
  }

  const bySource: Record<string, number> = {};
  for (const c of clients) {
    const s = c.acquisition_source || "Non renseigné";
    bySource[s] = (bySource[s] ?? 0) + 1;
  }

  const totalRevenue = Object.values(byClient).reduce((s, d) => s + d.revenue, 0);
  const recurringClients = Object.values(byClient).filter((d) => d.reservations > 1).length;
  const newClients = ps
    ? clients.filter((c) => c.created_at >= ps && (!pe || c.created_at <= `${pe}T23:59:59`)).length
    : clients.length;

  const tables: ReportTable[] = [{
    title: "Clients récents",
    columns: [
      { key: "name", label: "Nom" },
      { key: "phone", label: "Téléphone" },
      { key: "nationality", label: "Nationalité" },
      { key: "reservations", label: "Réservations", align: "right", format: "integer" },
      { key: "revenue", label: "CA", align: "right", format: "currency" },
      { key: "lastStay", label: "Dernier séjour" },
    ],
    rows: filtered.slice(0, 50).map((c) => {
      const data = byClient[c.id] ?? { reservations: 0, revenue: 0, lastStay: null };
      return {
        name: c.full_name,
        phone: c.phone || "-",
        nationality: c.nationality || "-",
        reservations: data.reservations,
        revenue: data.revenue,
        lastStay: data.lastStay ?? "-",
      };
    }),
  }];

  const charts: ReportChart[] = [];

  if (Object.keys(byNationality).length > 0) {
    charts.push({
      type: "pie",
      title: "Clients par nationalité",
      labels: Object.keys(byNationality),
      datasets: [{ label: "Clients", values: Object.values(byNationality) }],
    });
  }

  return {
    metadata: {
      reportId: "clients-portfolio", title: "Portefeuille clients",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Total clients", value: formatInteger(clients.length) },
      { label: "Nouveaux (période)", value: formatInteger(newClients) },
      { label: "Récurrents", value: formatInteger(recurringClients), description: "+ d'1 réservation" },
      { label: "CA total clients", value: formatCurrency(totalRevenue) },
    ],
    tables,
    charts: charts.length > 0 ? charts : undefined,
    totals: { clients: clients.length, revenue: totalRevenue },
    warnings: clients.length === 0 ? ["Aucun client trouvé."] : [],
    sourceCounts: { clients: clients.length, reservations: (reservations ?? []).length },
  };
}
