import { notFound } from "next/navigation";
import { getPaymentById } from "@/lib/data";
import { updatePaymentAction, deletePaymentAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function PaymentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Paiements / {payment.client_name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{payment.client_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(payment.amount)} — {payment.payment_method}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le paiement</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updatePaymentAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Client</label>
                  <Input name="client_name" defaultValue={payment.client_name} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                  <Input name="amount" type="number" min="0" defaultValue={payment.amount || 0} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <Input name="paid_at" type="date" defaultValue={payment.paid_at} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Methode *</label>
                  <Input name="payment_method" defaultValue={payment.payment_method} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type d&apos;activite *</label>
                  <Input name="activity_type" defaultValue={payment.activity_type} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <Input name="status" defaultValue={payment.status} />
                </div>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deletePaymentAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce paiement</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
