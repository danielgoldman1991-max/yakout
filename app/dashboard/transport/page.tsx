import Link from "next/link";
import type { ComponentType } from "react";
import type { Transfer, Trip } from "@/types/business";
import { getTransportTrips, getTransfers, getTransportPartners, getTransportVehicles, getPackages } from "@/lib/data/transport";
import { getDocuments } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Plane, Luggage, Handshake, Sparkles, Car, DollarSign, FileText, AlertTriangle, TrendingUp, MessageCircle } from "lucide-react";

function getExpiringThreshold() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

async function getTransportFinance() {
  if (!hasSupabaseEnv()) return { revenue: 0, costs: 0, openLeads: 0 };
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return { revenue: 0, costs: 0, openLeads: 0 };
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [paymentsRes, expensesRes, leadsRes] = await Promise.all([
      supabase.from("payments").select("amount").not("amount", "is", null).gte("paid_at", monthStart).or(
        "vehicle_id.not.is.null,partner_id.not.is.null,trip_id.not.is.null,transfer_id.not.is.null,package_id.not.is.null"
      ),
      supabase.from("expenses").select("amount").not("amount", "is", null).gte("expense_date", monthStart).or(
        "vehicle_id.not.is.null,partner_id.not.is.null,trip_id.not.is.null,transfer_id.not.is.null,package_id.not.is.null"
      ),
      supabase.from("leads").select("id", { count: "exact", head: true }).or(
        "request_type.eq.transport,request_type.eq.chauffeur,request_type.eq.vehicule,request_type.eq.package"
      ).not("status", "in", '("lost","converted")'),
    ]);
    const revenue = ((paymentsRes.data ?? []) as { amount?: number | string | null }[]).reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const costs = ((expensesRes.data ?? []) as { amount?: number | string | null }[]).reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const openLeads = leadsRes.count ?? 0;
    return { revenue, costs, openLeads };
  } catch {
    return { revenue: 0, costs: 0, openLeads: 0 };
  }
}

function getUpcoming<T>(
  items: T[],
  dateField: keyof T,
  now: string,
  limit = 5
): T[] {
  return items
    .filter((item) => {
      const val = item[dateField];
      return val && String(val) >= now;
    })
    .slice(0, limit);
}

export default async function TransportDashboardPage() {
  const [trips, transfers, partners, vehicles, documents, packages, finance] = await Promise.all([
    getTransportTrips().catch(() => []),
    getTransfers().catch(() => []),
    getTransportPartners().catch(() => []),
    getTransportVehicles().catch(() => []),
    getDocuments({}).catch(() => []),
    getPackages().catch(() => []),
    getTransportFinance(),
  ]);

  const activePartners = partners.filter((p) => (p.status ?? "active") !== "inactive" && (p.status ?? "active") !== "suspended").length;
  const toReviewPartners = partners.filter((p) => p.status === "to_review" || p.status === "pending_contract").length;
  const activeVehicles = vehicles.filter((v) => (v.availability_status ?? "Disponible") === "Disponible" || v.availability_status === "available").length;
  const upcomingTrips = trips.filter((t) => t.trip_date && new Date(t.trip_date) >= new Date(new Date().toDateString())).length;
  const confirmedTransfers = transfers.filter((t) => t.status === "confirmed" || t.status === "in_progress").length;
  const publishedPacks = packages.filter((p) => p.public_status === "published").length;
  const allDocs = documents ?? [];
  const threshold = getExpiringThreshold();
  const expiringDocs = allDocs.filter((d) =>
    d.partner_id && d.expiry_date && new Date(d.expiry_date).toISOString() <= threshold
  ).length;
  const { revenue, costs, openLeads } = finance;
  const margin = revenue - costs;

  const today = new Date().toISOString().slice(0, 10);
  const todayTransfers = transfers.filter((t) => t.pickup_date === today).slice(0, 5);
  const todayTrips = trips.filter((t) => t.trip_date === today).slice(0, 5);
  const upcomingTransfers = getUpcoming(transfers, "pickup_date" as keyof Transfer, today, 5);
  const upcomingTripsList = getUpcoming(trips, "trip_date" as keyof Trip, today, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Transport & Séjours</p>
          <h1 className="mt-2 text-3xl font-semibold">Transport & Séjours</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/transfers/new"><Button variant="secondary"><Plane className="h-4 w-4" /> Transfert</Button></Link>
          <Link href="/dashboard/trips/new"><Button variant="secondary"><Luggage className="h-4 w-4" /> Trajet</Button></Link>
          <Link href="/dashboard/partners/new"><Button variant="secondary"><Handshake className="h-4 w-4" /> Partenaire</Button></Link>
          <Link href="/dashboard/packages/new"><Button variant="secondary"><Sparkles className="h-4 w-4" /> Pack</Button></Link>
          <Link href="/dashboard/vehicles/new"><Button variant="secondary"><Car className="h-4 w-4" /> Véhicule</Button></Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard icon={MessageCircle} label="Demandes transport ouvertes" value={openLeads} />
        <KpiCard icon={Plane} label="Transferts confirmés" value={confirmedTransfers} />
        <KpiCard icon={Luggage} label="Trajets à venir" value={upcomingTrips} />
        <KpiCard icon={Handshake} label="Partenaires actifs" value={activePartners} toReview={toReviewPartners > 0 ? `${toReviewPartners} à vérifier` : undefined} />
        <KpiCard icon={Car} label="Véhicules disponibles" value={activeVehicles} />
        <KpiCard icon={Sparkles} label="Packs publiés" value={publishedPacks} />
        <KpiCard icon={FileText} label="Packs en brouillon" value={packages.filter((p) => p.public_status !== "published").length} />
        <KpiCard icon={TrendingUp} label="Recettes transport (mois)" value={revenue} currency />
        <KpiCard icon={DollarSign} label="Dépenses transport (mois)" value={costs} currency />
        <KpiCard icon={TrendingUp} label="Marge estimée" value={margin} currency positive />
        <KpiCard icon={AlertTriangle} label="Documents expirants" value={expiringDocs} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transferts aujourd&apos;hui</CardTitle>
            <Link href="/dashboard/transfers" className="text-xs text-gold hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {todayTransfers.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aucun transfert prévu aujourd&apos;hui.</p>
            ) : (
              <div className="space-y-3">
                {todayTransfers.map((t) => (
                  <Link key={t.id} href={`/dashboard/transfers/${t.id}`} className="flex items-center justify-between rounded-sm border border-border/50 p-3 text-sm hover:border-gold/40">
                    <div>
                      <p className="font-medium">{t.transfer_type ?? "Transfert"}</p>
                      <p className="text-xs text-muted-foreground">{t.pickup_location} → {t.dropoff_location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.pickup_time ?? "—"}</p>
                      <StatusBadge status={t.status ?? "pending"} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trajets aujourd&apos;hui</CardTitle>
            <Link href="/dashboard/trips" className="text-xs text-gold hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {todayTrips.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aucun trajet prévu aujourd&apos;hui.</p>
            ) : (
              <div className="space-y-3">
                {todayTrips.map((t) => (
                  <Link key={t.id} href={`/dashboard/trips/${t.id}`} className="flex items-center justify-between rounded-sm border border-border/50 p-3 text-sm hover:border-gold/40">
                    <div>
                      <p className="font-medium">{t.title ?? t.destination ?? "Trajet"}</p>
                      <p className="text-xs text-muted-foreground">{t.pickup_location ?? t.departure} → {t.dropoff_location ?? t.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.start_time ?? t.trip_time ?? "—"}</p>
                      <StatusBadge status={t.status ?? t.trip_status ?? "planned"} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prochains transferts</CardTitle>
            <Link href="/dashboard/transfers" className="text-xs text-gold hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {upcomingTransfers.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aucun transfert &agrave; venir.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTransfers.map((t) => (
                  <Link key={t.id} href={`/dashboard/transfers/${t.id}`} className="flex items-center justify-between rounded-sm border border-border/50 p-3 text-sm hover:border-gold/40">
                    <div>
                      <p className="font-medium">{t.transfer_type ?? "Transfert"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.pickup_date)} {t.pickup_time ?? ""}</p>
                    </div>
                    <StatusBadge status={t.status ?? "pending"} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prochains trajets</CardTitle>
            <Link href="/dashboard/trips" className="text-xs text-gold hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {upcomingTripsList.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aucun trajet &agrave; venir.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTripsList.map((t) => (
                  <Link key={t.id} href={`/dashboard/trips/${t.id}`} className="flex items-center justify-between rounded-sm border border-border/50 p-3 text-sm hover:border-gold/40">
                    <div>
                      <p className="font-medium">{t.title ?? t.destination ?? "Trajet"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.trip_date)} {t.trip_time ?? ""}</p>
                    </div>
                    <StatusBadge status={t.status ?? t.trip_status ?? "planned"} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/transfers/new"><Button variant="secondary"><Plane className="h-4 w-4" /> Nouveau transfert</Button></Link>
            <Link href="/dashboard/trips/new"><Button variant="secondary"><Luggage className="h-4 w-4" /> Nouveau trajet</Button></Link>
            <Link href="/dashboard/partners/new"><Button variant="secondary"><Handshake className="h-4 w-4" /> Nouveau partenaire</Button></Link>
            <Link href="/dashboard/packages/new"><Button variant="secondary"><Sparkles className="h-4 w-4" /> Nouveau pack</Button></Link>
            <Link href="/dashboard/vehicles/new"><Button variant="secondary"><Car className="h-4 w-4" /> Nouveau véhicule</Button></Link>
            <Link href="/dashboard/expenses/new"><Button variant="secondary"><DollarSign className="h-4 w-4" /> Ajouter dépense transport</Button></Link>
            <Link href="/dashboard/payments/new"><Button variant="secondary"><DollarSign className="h-4 w-4" /> Ajouter paiement transport</Button></Link>
            <Link href="/dashboard/documents/new"><Button variant="secondary"><FileText className="h-4 w-4" /> Ajouter document</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, toReview, currency: showCurrency, positive }: { icon: ComponentType<{ className?: string }>; label: string; value: number; toReview?: string; currency?: boolean; positive?: boolean }) {
  const displayValue = showCurrency ? formatCurrency(value) : String(value);
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold/10 text-gold">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-semibold ${positive !== undefined ? (value >= 0 ? "text-green-600" : "text-red-500") : ""}`}>{displayValue}</p>
          {toReview && <p className="text-[10px] text-amber-500">{toReview}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
