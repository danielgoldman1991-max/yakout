import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Car, FileText, Handshake, Plus, Wrench } from "lucide-react";
import { getTransportVehicles } from "@/lib/data/transport";
import { getDocuments } from "@/lib/data";
import { deleteVehicleAction } from "@/lib/data/actions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";

function nextExpiry(vehicle: { insurance_expiry_date?: string; technical_visit_expiry_date?: string; authorization_expiry_date?: string }) {
  const dates = [
    vehicle.insurance_expiry_date,
    vehicle.technical_visit_expiry_date,
    vehicle.authorization_expiry_date,
  ].filter(Boolean) as string[];
  return dates.sort()[0];
}

export default async function DashboardVehiclesPage() {
  const [vehicles, documents] = await Promise.all([getTransportVehicles(), getDocuments({ relatedType: "vehicle" })]);
  const active = vehicles.filter((v) => (v.management_status ?? "active") === "active").length;
  const published = vehicles.filter((v) => v.public_status === "published" || v.is_published).length;
  const partners = vehicles.filter((v) => ["partner", "rental_partner", "occasional"].includes(v.ownership_type ?? "")).length;
  const maintenance = vehicles.filter((v) => v.availability_status === "maintenance").length;
  const today = new Date();
  const expiringLimit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45).getTime();
  const expiringDocs = documents.filter((doc) => doc.expiry_date && new Date(doc.expiry_date).getTime() < expiringLimit).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Transport & Sejours / Vehicules</p>
          <h1 className="mt-2 text-3xl font-semibold">Vehicules</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Actifs transport Yakout ou partenaires, disponibilite, publication, documents et rentabilite.
          </p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button><Plus className="h-4 w-4" /> Nouveau vehicule</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Actifs" value={String(active)} icon={Car} />
        <KpiCard title="Publies" value={String(published)} icon={FileText} />
        <KpiCard title="Partenaires" value={String(partners)} icon={Handshake} />
        <KpiCard title="Maintenance" value={String(maintenance)} icon={Wrench} />
        <KpiCard title="Docs a surveiller" value={String(expiringDocs)} icon={AlertTriangle} />
      </div>

      {vehicles.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun vehicule Supabase pour le moment.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicule</th>
                  <th className="px-4 py-3 font-medium">Categorie</th>
                  <th className="px-4 py-3 font-medium">Capacite</th>
                  <th className="px-4 py-3 font-medium">Propriete</th>
                  <th className="px-4 py-3 font-medium">Disponibilite</th>
                  <th className="px-4 py-3 font-medium">Publication</th>
                  <th className="px-4 py-3 font-medium">Prix transfert</th>
                  <th className="px-4 py-3 font-medium">Prochain doc</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 overflow-hidden rounded-sm border border-border bg-card">
                          {v.image_url ? <Image src={v.image_url} alt={v.image_alt_text || v.public_name} fill sizes="64px" className="object-cover" unoptimized /> : null}
                        </div>
                        <div>
                          <Link href={`/dashboard/vehicles/${v.id}`} className="font-medium hover:text-gold hover:underline">{v.public_name}</Link>
                          <p className="text-xs text-muted-foreground">{[v.brand, v.model].filter(Boolean).join(" ") || v.internal_reference || "Sans reference"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{v.category ?? "other"}</td>
                    <td className="px-4 py-3">{v.capacity} pers. / {v.luggage_capacity ?? 0} bagages</td>
                    <td className="px-4 py-3">{v.ownership_type ?? "partner"}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.availability_status ?? "available"} /></td>
                    <td className="px-4 py-3"><StatusBadge status={v.public_status ?? (v.is_published ? "published" : "draft")} /></td>
                    <td className="px-4 py-3">{formatCurrency(v.price_transfer ?? v.price_from)}</td>
                    <td className="px-4 py-3">{nextExpiry(v) ? formatDate(nextExpiry(v) as string) : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {v.public_status === "published" || v.is_published ? <Link href={`/vehicles/${v.slug}`} className="text-xs text-gold hover:underline">Site</Link> : null}
                        <Link href={`/dashboard/documents/new?type=vehicle&vehicle_id=${v.id}`} className="text-xs text-muted-foreground hover:text-gold">Doc</Link>
                        <Link href={`/dashboard/expenses/new?vehicle_id=${v.id}`} className="text-xs text-muted-foreground hover:text-gold">Depense</Link>
                        <form action={deleteVehicleAction.bind(null, v.id)}>
                          <button type="submit" className="text-xs text-red-400 hover:text-red-300 underline">Supprimer</button>
                        </form>
                      </div>
                    </td>
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
