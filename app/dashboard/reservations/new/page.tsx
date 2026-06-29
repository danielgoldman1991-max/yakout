import { createReservationAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewReservationPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Reservations / Nouvelle</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvelle reservation</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createReservationAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Arrivee *</label>
                <Input name="check_in" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Depart *</label>
                <Input name="check_out" type="date" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Personnes</label>
                <Input name="people_count" type="number" min="1" defaultValue="1" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Total (DH)</label>
                <Input name="total_amount" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Acompte (DH)</label>
                <Input name="deposit_amount" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer la reservation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
