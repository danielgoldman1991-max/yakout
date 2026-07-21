import { notFound } from "next/navigation";
import { getReportDefinition } from "@/lib/reports/definitions";
import { getReportData } from "@/lib/reports/data";
import { ReportView } from "@/components/dashboard/reports/report-view";
import { BarChart3, Building2, Car, FileText, Package, Shield, TrendingUp, Truck, UserCheck, Users, Wallet, Wrench } from "lucide-react";
import type { ReportCategory } from "@/lib/reports/definitions";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { canViewReport } from "@/lib/reports/permissions";

const CATEGORY_ICONS: Record<ReportCategory, LucideIcon> = {
  executive: BarChart3 as LucideIcon,
  sales: TrendingUp as LucideIcon,
  accommodation: Building2 as LucideIcon,
  owners: Users as LucideIcon,
  finance: Wallet as LucideIcon,
  operations: Wrench as LucideIcon,
  transport: Car as LucideIcon,
  fleet: Truck as LucideIcon,
  packages: Package as LucideIcon,
  clients: UserCheck as LucideIcon,
  compliance: FileText as LucideIcon,
  data_quality: Shield as LucideIcon,
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  executive: "Direction",
  sales: "Commercial",
  accommodation: "Hébergement",
  owners: "Propriétaires",
  finance: "Finance",
  operations: "Exploitation",
  transport: "Transport",
  fleet: "Véhicules et partenaires",
  packages: "Packs et séjours",
  clients: "Clients",
  compliance: "Contrats et documents",
  data_quality: "Qualité des données",
};

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { reportId } = await params;
  const sp = await searchParams;

  const def = getReportDefinition(reportId);
  if (!def) notFound();
  if (!(await canViewReport(def.permission))) return <div role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-6"><h1 className="text-xl font-semibold">Accès refusé</h1><p className="mt-2 text-sm text-muted-foreground">Vous ne disposez pas de la permission nécessaire pour consulter ce rapport.</p></div>;

  const periodStart = (sp.period_start as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = (sp.period_end as string) || new Date().toISOString().slice(0, 10);

  const data = await getReportData(reportId, {
    period_start: periodStart,
    period_end: periodEnd,
    owner_id: sp.owner_id as string | undefined,
    apartment_id: sp.apartment_id as string | undefined,
    client_id: sp.client_id as string | undefined,
    status: sp.status as string | undefined,
    source: sp.source as string | undefined,
    activity: sp.activity as string | undefined,
    currency: sp.currency as string | undefined,
  });

  const Icon = CATEGORY_ICONS[def.category];
  const catLabel = CATEGORY_LABELS[def.category];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <Link href="/dashboard/reports" className="hover:text-gold transition-colors">Rapports</Link>
        <span>/</span>
        <span>{catLabel}</span>
        <span>/</span>
        <span className="text-foreground/80">{def.title}</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
            <Icon className="h-5 w-5 text-gold" />
          </div>
          <h1 className="text-2xl font-semibold">{def.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground/70 ml-11">{def.description}</p>
      </div>

      <form id="report-filters" method="get" className="rounded-sm border border-border/60 bg-card p-4 shadow-elevation-1">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">Début de période</label>
            <input type="date" name="period_start" defaultValue={periodStart}
              className="rounded-sm border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:border-gold/40" />
          </div>
          {def.filters.filter((filter) => filter.type !== "date_range").map((filter) => <div key={filter.id}><label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">{filter.label}</label><input name={filter.id} defaultValue={typeof sp[filter.id] === "string" ? sp[filter.id] as string : ""} className="rounded-sm border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:border-gold/40" /></div>)}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">Fin de période</label>
            <input type="date" name="period_end" defaultValue={periodEnd}
              className="rounded-sm border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:border-gold/40" />
          </div>
          <button type="submit"
            className="rounded-sm bg-gold px-4 py-1.5 text-sm font-medium text-black hover:bg-gold-light transition-colors">
            Actualiser
          </button>
        </div>
      </form>

      <ReportView report={data} reportId={reportId} supportedFormats={def.supportedFormats} />
    </div>
  );
}
