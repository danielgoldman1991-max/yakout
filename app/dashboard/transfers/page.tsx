import Link from "next/link";
import { Car, Clock, CreditCard, Plane, Plus } from "lucide-react";
import { getTransfers, getTransportPartners, getTransportVehicles } from "@/lib/data/transport";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function TransfersPage() {
  const [transfers, vehicles, partners] = await Promise.all([getTransfers(), getTransportVehicles(), getTransportPartners()]);
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.public_name]));
  const partnerMap = new Map(partners.map((p) => [p.id, p.name]));
  const confirmed = transfers.filter((t) => ["confirmed", "assigned", "in_progress"].includes(t.status)).length;
  const revenue = transfers.reduce((sum, transfer) => sum + Number(transfer.amount ?? 0), 0);
  const cost = transfers.reduce((sum, transfer) => sum + Number(transfer.cost_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Transport & Sejours</p>
          <h1 className="mt-2 text-3xl font-semibold">Transferts & Chauffeur</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Operations simples : aeroport, trajets ville, demi-journee, journee et mise a disposition.</p>
        </div>
        <Link href="/dashboard/transfers/new"><Button><Plus className="h-4 w-4" /> Nouveau transfert</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Operations" value={String(transfers.length)} icon={Plane} />
        <KpiCard title="Confirmees" value={String(confirmed)} icon={Clock} />
        <KpiCard title="Vehicules dispo" value={String(vehicles.filter((v) => v.availability_status === "available").length)} icon={Car} />
        <KpiCard title="Marge estimee" value={formatCurrency(revenue - cost)} icon={CreditCard} />
      </div>

      {transfers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun transfert Supabase. Creez la premiere operation.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Prise en charge</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Vehicule</th>
                  <th className="px-4 py-3 font-medium">Partenaire</th>
                  <th className="px-4 py-3 font-medium">Marge</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium"><Link href={`/dashboard/transfers/${transfer.id}`} className="hover:text-gold hover:underline">{transfer.transfer_type}</Link></td>
                    <td className="px-4 py-3">{transfer.pickup_date ? formatDate(transfer.pickup_date) : "-"} {transfer.pickup_time ?? ""}</td>
                    <td className="px-4 py-3">{transfer.pickup_location ?? "-"}</td>
                    <td className="px-4 py-3">{transfer.dropoff_location ?? "-"}</td>
                    <td className="px-4 py-3">{transfer.vehicle_id ? vehicleMap.get(transfer.vehicle_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3">{transfer.partner_id ? partnerMap.get(transfer.partner_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(transfer.amount ?? 0) - Number(transfer.cost_amount ?? 0))}</td>
                    <td className="px-4 py-3"><StatusBadge status={transfer.status} /></td>
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
