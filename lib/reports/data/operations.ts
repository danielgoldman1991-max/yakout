import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatInteger, formatReportDate } from "../formatters";
import { optionalNumber } from "../safe-values";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getOperationsMaintenance(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("maintenance_tasks")
    .select("id, title, priority, status, category, estimated_cost, actual_cost, due_date, created_at, apartment_id")
    .order("created_at", { ascending: false });
  assertSupabaseResults("Maintenance et incidents", [{ error: tasksError }]);

  if (!tasks) {
    return {
      metadata: { reportId: "operations-maintenance", title: "Maintenance et incidents", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  let filtered = tasks;
  if (filters.status) filtered = tasks.filter((t) => t.status === filters.status);

  const open = filtered.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "waiting_owner");
  const completed = filtered.filter((t) => t.status === "completed");
  const urgent = filtered.filter((t) => t.priority === "urgent");

  const totalEstimated = filtered.reduce((s, t) => s + optionalNumber(t.estimated_cost), 0);
  const totalActual = filtered.reduce((s, t) => s + optionalNumber(t.actual_cost), 0);

  const tables: ReportTable[] = [{
    title: "Tâches de maintenance",
    columns: [
      { key: "title", label: "Tâche" },
      { key: "priority", label: "Priorité" },
      { key: "status", label: "Statut" },
      { key: "category", label: "Catégorie" },
      { key: "estimatedCost", label: "Coût estimé", align: "right", format: "currency" },
      { key: "actualCost", label: "Coût réel", align: "right", format: "currency" },
      { key: "dueDate", label: "Échéance" },
    ],
    rows: filtered.map((t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      category: t.category,
      estimatedCost: optionalNumber(t.estimated_cost),
      actualCost: optionalNumber(t.actual_cost),
      dueDate: t.due_date ? formatReportDate(t.due_date) : "-",
    })),
    totals: { estimatedCost: totalEstimated, actualCost: totalActual },
  }];

  const byStatus: Record<string, number> = {};
  for (const t of filtered) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;

  if (Object.keys(byStatus).length > 0) {
    tables.push({
      title: "Répartition par statut",
      columns: [
        { key: "status", label: "Statut" },
        { key: "count", label: "Nombre", align: "right", format: "integer" },
      ],
      rows: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    });
  }

  return {
    metadata: {
      reportId: "operations-maintenance", title: "Maintenance et incidents",
      generatedAt: new Date().toISOString(), status: "ready",
    },
    kpis: [
      { label: "Tâches ouvertes", value: formatInteger(open.length) },
      { label: "Terminées", value: formatInteger(completed.length) },
      { label: "Urgentes", value: formatInteger(urgent.length), trend: urgent.length > 0 ? { value: `${urgent.length} urgentes`, positive: false } : undefined },
      { label: "Coût total estimé", value: formatCurrency(totalEstimated) },
      { label: "Coût total réel", value: formatCurrency(totalActual) },
    ],
    tables,
    totals: { estimated: totalEstimated, actual: totalActual },
    warnings: filtered.length === 0 ? ["Aucune tâche de maintenance trouvée."] : [],
    sourceCounts: { tasks: tasks.length },
  };
}
