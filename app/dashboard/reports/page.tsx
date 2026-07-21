import type { ReactNode } from "react";
import { REPORT_DEFINITIONS, REPORT_CATEGORIES } from "@/lib/reports/definitions";
import { ReportCard } from "@/components/dashboard/reports/report-card";
import { getReportingHealth } from "@/lib/reports/health";
import { AlertTriangle, CheckCircle2, Clock3, Search, ShieldCheck } from "lucide-react";
import { formatReportDateTime } from "@/lib/reports/formatters";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const health = await getReportingHealth();
  const permittedIds = new Set(health.permittedReportIds);
  const healthById = new Map(health.reports.map((report) => [report.reportId, report]));
  const statusLabel = health.systemStatus === "operational" ? "Système opérationnel" : health.systemStatus === "degraded" ? "Système opérationnel avec réserves" : "Système indisponible";
  return <div className="space-y-8">
    <div className="flex flex-col gap-2"><h1 className="text-3xl font-semibold">Rapports</h1><p className="max-w-4xl text-sm text-muted-foreground">Analysez les performances commerciales, opérationnelles et financières de Yakout à partir des données réelles de votre activité.</p></div>
    <section className="rounded-sm border border-border bg-card p-5 shadow-elevation-1" aria-label="État du reporting">
      <div className="flex items-center gap-3">{health.systemStatus === "operational" ? <ShieldCheck className="size-5 text-emerald-500" /> : <AlertTriangle className="size-5 text-amber-500" />}<div><p className="font-semibold">{statusLabel}</p><p className="text-xs text-muted-foreground">Chaque état provient du résultat réel de son loader.</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><HealthMetric label="Disponibles" value={health.availableReports} icon={<CheckCircle2 className="size-4" />} /><HealthMetric label="Avec réserves" value={health.warningReports} icon={<AlertTriangle className="size-4" />} /><HealthMetric label="Indisponibles" value={health.unavailableReports} /><HealthMetric label="Configuration incomplète" value={health.notConfiguredReports} /><HealthMetric label="Anomalies à traiter" value={health.criticalAnomalies + health.majorAnomalies} /><HealthMetric label="Actualisé" value={formatReportDateTime(health.checkedAt)} icon={<Clock3 className="size-4" />} text /></div>
    </section>
    <div className="flex items-center gap-3 rounded-sm border border-border bg-card p-3"><Search className="size-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">{health.permittedReportIds.length} rapports autorisés et contrôlés individuellement</span></div>
    {REPORT_CATEGORIES.map((category) => { const reports = REPORT_DEFINITIONS.filter((report) => report.category === category.id && permittedIds.has(report.id)); return reports.length ? <section key={category.id}><h2 className="mb-4 text-lg font-medium">{category.label} <span className="text-xs text-muted-foreground">({reports.length})</span></h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{reports.map((report) => <ReportCard key={report.id} report={report} health={healthById.get(report.id)} />)}</div></section> : null; })}
  </div>;
}

function HealthMetric({ label, value, icon, text = false }: { label: string; value: number | string; icon?: ReactNode; text?: boolean }) {
  return <div className="rounded-sm border border-border/60 bg-background p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div><p className={`mt-1 font-semibold ${text ? "text-sm" : "text-2xl"}`}>{value}</p></div>;
}
