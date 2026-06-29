import { notFound } from "next/navigation";
import { getReservationById } from "@/lib/data";
import { updateReservationAction, deleteReservationAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function ReservationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getReservationById(id);
  if (!reservation) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Reservations / {reservation.id}</p>
        <h1 className="mt-2 text-3xl font-semibold">Reservation #{reservation.id.slice(0, 8)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reservation.check_in} → {reservation.check_out} | {formatCurrency(reservation.total_amount)}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier la reservation</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateReservationAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Arrivee *</label>
                  <Input name="check_in" type="date" defaultValue={reservation.check_in} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Depart *</label>
                  <Input name="check_out" type="date" defaultValue={reservation.check_out} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Personnes</label>
                  <Input name="people_count" type="number" min="1" defaultValue={reservation.people_count || 1} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Total (DH)</label>
                  <Input name="total_amount" type="number" min="0" defaultValue={reservation.total_amount || 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Acompte (DH)</label>
                  <Input name="deposit_amount" type="number" min="0" defaultValue={reservation.deposit_amount || 0} />
                </div>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteReservationAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cette reservation</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
