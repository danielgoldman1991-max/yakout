import Link from "next/link";
import {
  TrendingUp, CreditCard, DollarSign, Gauge, Users, CalendarCheck, Car, AlertCircle,
  ArrowRight, BarChart3, Building2, Luggage, MessageCircle,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getLeads, getReservations, getTrips, getPayments, getExpenses } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DashboardCharts } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/ui/empty-state";

const quickActions = [
  { label: "Nouveau lead", href: "/dashboard/leads/new", icon: MessageCircle },
  { label: "Nouveau client", href: "/dashboard/clients/new", icon: Users },
  { label: "Nouvel appartement", href: "/dashboard/apartments/new", icon: Building2 },
  { label: "Nouvelle réservation", href: "/dashboard/reservations/new", icon: Luggage },
  { label: "Nouveau trajet", href: "/dashboard/trips/new", icon: Car },
  { label: "Ajouter un paiement", href: "/dashboard/payments/new", icon: CreditCard },
  { label: "Ajouter une dépense", href: "/dashboard/expenses/new", icon: DollarSign },
  { label: "Nouvel article blog", href: "/dashboard/site/blog/new", icon: BarChart3 },
];

export default async function DashboardPage() {
  const [leads, reservations, trips, payments, expenses] = await Promise.all([
    getLeads(), getReservations(), getTrips(), getPayments(), getExpenses(),
  ]);

  const revenue = payments.filter((p) => p.status === "Paye").reduce((sum, item) => sum + item.amount, 0);
  const pending = payments.filter((p) => p.status === "En attente").reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const margin = revenue - expenseTotal;
  const marginRate = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const newLeads = leads.filter((l) => l.status === "Nouveau").length;
  const confirmedReservations = reservations.filter((r) => r.status === "confirmed").length;
  const confirmedTrips = trips.filter((t) => t.status === "Confirme").length;
  const conversion = leads.length ? Math.round((leads.filter((l) => l.status === "Confirme").length / leads.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">Votre activité en un coup d&apos;œil</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="CA du mois" value={formatCurrency(revenue)} icon={TrendingUp} description="Paiements encaissés" />
        <KpiCard title="Dépenses du mois" value={formatCurrency(expenseTotal)} icon={DollarSign} />
        <KpiCard title="Marge estimée" value={`${formatCurrency(margin)} (${marginRate}%)`} icon={Gauge} trend={margin > 0 ? { value: `+${formatCurrency(margin)}`, positive: true } : { value: formatCurrency(margin), positive: false }} />
        <KpiCard title="Leads nouveaux" value={String(newLeads)} icon={Users} />
        <KpiCard title="Réservations confirmées" value={String(confirmedReservations)} icon={CalendarCheck} />
        <KpiCard title="Trajets confirmés" value={String(confirmedTrips)} icon={Car} />
        <KpiCard title="Taux de conversion" value={`${conversion}%`} icon={BarChart3} />
        <KpiCard title="Restes à payer" value={formatCurrency(pending)} icon={AlertCircle} trend={pending > 0 ? { value: `${leads.filter(l => l.status === "Confirme").length} clients concernés`, positive: false } : undefined} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Actions rapides</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-card px-3.5 py-2 text-[11px] font-medium text-muted-foreground/80 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold hover:shadow-elevation-2"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <DashboardCharts payments={payments} expenses={expenses} leads={leads} />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Derniers leads</p>
            <Link href="/dashboard/leads" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold transition hover:text-gold-light">
              Voir tout <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {leads.length === 0 ? (
              <EmptyState title="Aucun lead" description="Les leads apparaîtront ici." />
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between rounded-sm border border-border/50 bg-accent/5 px-4 py-3 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground/70">{lead.request_type} — {formatDate(lead.created_at)}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Prochaines réservations</p>
            <Link href="/dashboard/reservations" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold transition hover:text-gold-light">
              Voir tout <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {reservations.length === 0 ? (
              <EmptyState title="Aucune réservation" description="Les réservations apparaîtront ici." />
            ) : (
              <div className="space-y-3">
                {reservations.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-sm border border-border/50 bg-accent/5 px-4 py-3 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.guest_name ?? r.reservation_number}</p>
                      <p className="text-xs text-muted-foreground/70">{formatDate(r.check_in)} — {formatDate(r.check_out)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Prochains trajets</p>
            <Link href="/dashboard/trips" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold transition hover:text-gold-light">
              Voir tout <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {trips.length === 0 ? (
              <EmptyState title="Aucun trajet" description="Les trajets apparaîtront ici." />
            ) : (
              <div className="space-y-3">
                {trips.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-sm border border-border/50 bg-accent/5 px-4 py-3 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.client_name}</p>
                      <p className="text-xs text-muted-foreground/70">{t.departure} → {t.destination} — {formatDate(t.trip_date)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Paiements en attente</p>
            <Link href="/dashboard/payments" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold transition hover:text-gold-light">
              Voir tout <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {payments.filter((p) => p.status !== "Paye").length === 0 ? (
              <EmptyState title="Aucun paiement en attente" description="Tout est à jour." />
            ) : (
              <div className="space-y-3">
                {payments.filter((p) => p.status !== "Paye").slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-sm border border-border/50 bg-accent/5 px-4 py-3 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.client_name}</p>
                      <p className="text-xs text-muted-foreground/70">{p.activity_type} — {formatDate(p.paid_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gold">{formatCurrency(p.amount)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
