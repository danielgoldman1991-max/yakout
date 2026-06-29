import { createPaymentAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewPaymentPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Paiements / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau paiement</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createPaymentAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client</label>
                <Input name="client_name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                <Input name="amount" type="number" min="0" defaultValue="0" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <Input name="paid_at" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Methode *</label>
                <Input name="payment_method" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type d&apos;activite *</label>
                <Input name="activity_type" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Statut</label>
                <Input name="status" />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le paiement</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
