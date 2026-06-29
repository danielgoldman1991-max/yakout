import Link from "next/link";
import { getTrips } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Trajets</p>
          <h1 className="mt-2 text-3xl font-semibold">Trajets</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Transferts aeroport, trajets prives, excursions et marge estimee.</p>
        </div>
        <Link href="/dashboard/trips/new">
          <Button>Nouveau trajet</Button>
        </Link>
      </div>
      {trips.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun trajet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Vehicule</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Depart</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Marge</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-3 font-medium"><a href={`/dashboard/trips/${t.id}`} className="hover:text-primary hover:underline">{t.client_name}</a></td>
                    <td className="px-4 py-3">{t.vehicle_name}</td>
                    <td className="px-4 py-3">{formatDate(t.trip_date)}</td>
                    <td className="px-4 py-3">{t.departure}</td>
                    <td className="px-4 py-3">{t.destination}</td>
                    <td className="px-4 py-3">{formatCurrency(t.sold_price - t.cost_price)}</td>
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
