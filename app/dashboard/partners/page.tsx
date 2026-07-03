import Link from "next/link";
import { Handshake, Plus, Truck, Users, AlertTriangle, FileText } from "lucide-react";
import { getTransportPartners, getTransportVehicles, getTransportTrips } from "@/lib/data/transport";
import { getDocuments } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";

const LABELS: Record<string, string> = {
  transport_company: "Transport", vehicle_owner: "Véhicule", driver: "Chauffeur",
  guide: "Guide", tour_provider: "Excursion", restaurant: "Restaurant",
  activity_provider: "Activité", cleaning: "Ménage", laundry: "Blanchisserie",
  maintenance: "Maintenance", repair: "Réparation", real_estate_service: "Immobilier",
  admin_supplier: "Fournisseur", other: "Autre",
};

function getExpiringThreshold() {
  return new Date(Date.now() + 2_592_000_000).toISOString();
}

export default async function PartnersPage() {
  const [partners, vehicles, trips, documents] = await Promise.all([
    getTransportPartners(), getTransportVehicles(), getTransportTrips(),
    getDocuments({}),
  ]);

  const active = partners.filter((p) => (p.status ?? "active") === "active").length;
  const toReview = partners.filter((p) => p.status === "to_review" || p.status === "pending_contract").length;
  const vehiclePartners = partners.filter((p) => ["vehicle_owner", "driver", "transport_company"].includes(p.partner_type ?? "")).length;
  const partnerVehicleCount = vehicles.filter((v) => v.partner_id).length;
  const allDocs = documents ?? [];
  const threshold = getExpiringThreshold();
  const expiringDocs = allDocs.filter((d) => d.partner_id && d.expiry_date && new Date(d.expiry_date).toISOString() <= threshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Partenaires</p>
          <h1 className="mt-2 text-3xl font-semibold">Partenaires fournisseurs</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Prestataires transport, guides, chauffeurs, excursions, maintenance, ménage et fournisseurs.</p>
        </div>
        <Link href="/dashboard/partners/new"><Button><Plus className="h-4 w-4" /> Nouveau partenaire</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Partenaires" value={String(partners.length)} icon={Handshake} />
        <KpiCard title="Actifs" value={String(active)} icon={Users} />
        <KpiCard title="À vérifier" value={String(toReview)} icon={AlertTriangle} />
        <KpiCard title="Transport" value={String(vehiclePartners)} icon={Truck} />
        <KpiCard title="Véhicules liés" value={String(partnerVehicleCount)} icon={Truck} />
        <KpiCard title="Docs expirants" value={String(expiringDocs)} icon={FileText} />
      </div>

      {partners.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucun partenaire enregistré. Ajoutez vos prestataires transport, guides, chauffeurs, fournisseurs et services terrain.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Services</th>
                  <th className="px-4 py-3 font-medium">Véhicules</th>
                  <th className="px-4 py-3 font-medium">Trajets</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/partners/${p.id}`} className="hover:text-gold hover:underline">{p.name}</Link>
                      {p.company_name && <p className="text-xs text-muted-foreground">{p.company_name}</p>}
                    </td>
                    <td className="px-4 py-3">{LABELS[p.partner_type ?? ""] ?? p.partner_type ?? "-"}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{p.phone ?? ""}</p>
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.city ?? "-"}</td>
                    <td className="px-4 py-3 text-xs">{(p.service_categories ?? []).slice(0, 2).join(", ") || "-"}</td>
                    <td className="px-4 py-3">{vehicles.filter((v) => v.partner_id === p.id).length}</td>
                    <td className="px-4 py-3">{trips.filter((t) => t.partner_id === p.id).length}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status ?? "active"} /></td>
                    <td className="px-4 py-3 text-xs">{p.reliability_score ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
