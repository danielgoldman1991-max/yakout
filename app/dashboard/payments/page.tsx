import Link from "next/link";
import { getPayments } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Paiements</p>
          <h1 className="mt-2 text-3xl font-semibold">Paiements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Paiements clients, modes, activites liees et statuts.</p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button>Nouveau paiement</Button>
        </Link>
      </div>
      {payments.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun paiement.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Activite</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium"><a href={`/dashboard/payments/${p.id}`} className="hover:text-primary hover:underline">{p.client_name}</a></td>
                    <td className="px-4 py-3">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-3">{p.payment_method}</td>
                    <td className="px-4 py-3">{p.activity_type}</td>
                    <td className="px-4 py-3">{p.status}</td>
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
