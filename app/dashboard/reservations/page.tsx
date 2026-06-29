import Link from "next/link";
import { getReservations } from "@/lib/data";
import { deleteReservationAction } from "@/lib/data/actions";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Reservations</p>
          <h1 className="mt-2 text-3xl font-semibold">Reservations</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Nombre de nuits, acomptes, restes a payer et statuts de reservation.
          </p>
        </div>
        <Link href="/dashboard/reservations/new">
          <Button>Nouvelle reservation</Button>
        </Link>
      </div>
      {reservations.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucune reservation.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Appartement</th>
                  <th className="px-4 py-3 font-medium">Arrivee</th>
                  <th className="px-4 py-3 font-medium">Nuits</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <a href={`/dashboard/reservations/${r.id}`} className="hover:text-primary hover:underline">{r.client_name}</a>
                    </td>
                    <td className="px-4 py-3">{r.apartment_name}</td>
                    <td className="px-4 py-3">{formatDate(r.check_in)}</td>
                    <td className="px-4 py-3">{nightsBetween(r.check_in, r.check_out)}</td>
                    <td className="px-4 py-3">{formatCurrency(r.total_amount)}</td>
                    <td className="px-4 py-3">{r.reservation_status}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteReservationAction.bind(null, r.id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300 underline">Supprimer</button>
                      </form>
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
