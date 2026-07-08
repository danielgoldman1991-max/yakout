import { REPORT_DEFINITIONS, REPORT_CATEGORIES } from "@/lib/reports/definitions";
import { ReportCard } from "@/components/dashboard/reports/report-card";
import { REPORTS_UNCERTIFIED_MESSAGE, canExportReports, getReportCertificationStatus, isReportTestingModeEnabled } from "@/lib/reports/certification";
import { Search, Filter, ShieldAlert } from "lucide-react";

export default async function ReportsPage() {
  const categories = REPORT_CATEGORIES;
  const certificationStatus = getReportCertificationStatus();
  const locked = !canExportReports();
  const testingMode = isReportTestingModeEnabled() && certificationStatus !== "certified";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Rapports</h1>
        <p className="text-sm text-muted-foreground/70">
          Centre de reporting transversal — analysez la performance commerciale, opérationnelle et financière de Yakout.
        </p>
      </div>

      <div className="rounded-sm border border-amber-500/45 bg-amber-500/10 p-4 text-amber-900 shadow-elevation-1 dark:text-amber-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{testingMode ? "Mode test - données non certifiées" : "Reporting suspendu - données non certifiées"}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {testingMode ? "Les rapports sont réactivés pour tests. Les résultats restent non certifiés et ne doivent pas servir à une décision financière ou opérationnelle." : REPORTS_UNCERTIFIED_MESSAGE}
              </p>
            </div>
          </div>
          <div className="grid gap-1 text-xs md:min-w-[240px]">
            <div className="flex justify-between gap-3"><span>État</span><strong>{certificationStatus}</strong></div>
            <div className="flex justify-between gap-3"><span>Exports</span><strong>{locked ? "désactivés" : testingMode ? "actifs en test" : "actifs"}</strong></div>
            <div className="flex justify-between gap-3"><span>Rapports certifiés</span><strong>0</strong></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border/60 bg-card p-3 shadow-elevation-1">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            className="w-full rounded-sm border border-border/40 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{REPORT_DEFINITIONS.length} rapports disponibles</span>
        </div>
      </div>

      {categories.map((cat) => {
        const catReports = REPORT_DEFINITIONS.filter((r) => r.category === cat.id);
        if (catReports.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
              {cat.label}
              <span className="text-xs font-normal text-muted-foreground/50">({catReports.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {catReports.map((report) => (
                <ReportCard key={report.id} report={report} locked={locked} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
