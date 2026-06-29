import Link from "next/link";
import { getExpenses } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Depenses</p>
          <h1 className="mt-2 text-3xl font-semibold">Depenses</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Menage, maintenance, carburant, commissions et frais.</p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>Nouvelle depense</Button>
        </Link>
      </div>
      {expenses.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucune depense.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Categorie</th>
                  <th className="px-4 py-3 font-medium">Activite</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-3">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3"><a href={`/dashboard/expenses/${e.id}`} className="hover:text-primary hover:underline">{e.category}</a></td>
                    <td className="px-4 py-3">{e.activity_type}</td>
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
