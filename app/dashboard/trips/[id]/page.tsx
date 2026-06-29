import { notFound } from "next/navigation";
import { getTripById } from "@/lib/data";
import { updateTripAction, deleteTripAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function TripEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTripById(id);
  if (!trip) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Trajets / {trip.client_name}</p>
        <h1 className="mt-2 text-3xl font-semibold">Trajet {trip.departure} → {trip.destination}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Marge : {formatCurrency(trip.sold_price - trip.cost_price)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le trajet</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateTripAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Client</label>
                  <Input name="client_name" defaultValue={trip.client_name} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Vehicule</label>
                  <Input name="vehicle_name" defaultValue={trip.vehicle_name} />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <Input name="trip_date" type="date" defaultValue={trip.trip_date} required />
                </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Depart</label>
                  <Input name="departure" defaultValue={trip.departure} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Destination</label>
                  <Input name="destination" defaultValue={trip.destination} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Prix vendu (DH)</label>
                  <Input name="sold_price" type="number" min="0" defaultValue={trip.sold_price || 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Prix revient (DH)</label>
                  <Input name="cost_price" type="number" min="0" defaultValue={trip.cost_price || 0} />
                </div>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteTripAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce trajet</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
