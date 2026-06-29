import { createTripAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewTripPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Trajets / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau trajet</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createTripAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client</label>
                <Input name="client_name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Vehicule</label>
                <Input name="vehicle_name" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <Input name="trip_date" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Depart *</label>
                <Input name="departure" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Destination *</label>
                <Input name="destination" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prix vendu (DH)</label>
                <Input name="sold_price" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Prix revient (DH)</label>
              <Input name="cost_price" type="number" min="0" defaultValue="0" />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le trajet</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
