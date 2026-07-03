import Link from "next/link";
import { CalendarDays, MapPinned, Plus, Route } from "lucide-react";
import { getTransportTrips, getTransportVehicles, getTransportPartners } from "@/lib/data/transport";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function TripsPage() {
  const [trips, vehicles, partners] = await Promise.all([getTransportTrips(), getTransportVehicles(), getTransportPartners()]);
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.public_name]));
  const partnerMap = new Map(partners.map((p) => [p.id, p.name]));
  const confirmed = trips.filter((trip) => ["confirmed", "assigned", "in_progress"].includes(trip.status ?? "")).length;
  const revenue = trips.reduce((sum, trip) => sum + Number(trip.sold_price ?? 0), 0);
  const cost = trips.reduce((sum, trip) => sum + Number(trip.cost_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Transport & Sejours / Trajets</p>
          <h1 className="mt-2 text-3xl font-semibold">Trajets & circuits</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Circuits Agafay, Ourika, Essaouira, Ouzoud, mises a disposition et prestations terrain.</p>
        </div>
        <Link href="/dashboard/trips/new"><Button><Plus className="h-4 w-4" /> Nouveau trajet</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Trajets" value={String(trips.length)} icon={Route} />
        <KpiCard title="Confirmes" value={String(confirmed)} icon={CalendarDays} />
        <KpiCard title="Recettes estimees" value={formatCurrency(revenue)} icon={MapPinned} />
        <KpiCard title="Marge estimee" value={formatCurrency(revenue - cost)} icon={Route} />
      </div>

      {trips.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun trajet Supabase.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Prestation</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Depart</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Vehicule</th>
                  <th className="px-4 py-3 font-medium">Partenaire</th>
                  <th className="px-4 py-3 font-medium">Marge</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium"><Link href={`/dashboard/trips/${trip.id}`} className="hover:text-gold hover:underline">{trip.title ?? trip.trip_type ?? "Trajet"}</Link></td>
                    <td className="px-4 py-3">{trip.trip_date ? formatDate(trip.trip_date) : "-"}</td>
                    <td className="px-4 py-3">{trip.departure}</td>
                    <td className="px-4 py-3">{trip.destination}</td>
                    <td className="px-4 py-3">{trip.vehicle_id ? vehicleMap.get(trip.vehicle_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3">{trip.partner_id ? partnerMap.get(trip.partner_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3">{formatCurrency((trip.sold_price ?? 0) - (trip.cost_price ?? 0))}</td>
                    <td className="px-4 py-3"><StatusBadge status={trip.status ?? trip.trip_status} /></td>
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
