import { notFound } from "next/navigation";
import { getExpenseById } from "@/lib/data";
import { updateExpenseAction, deleteExpenseAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function ExpenseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Depenses / {expense.category}</p>
        <h1 className="mt-2 text-3xl font-semibold">{expense.category}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(expense.amount)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier la depense</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateExpenseAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <Input name="expense_date" type="date" defaultValue={expense.expense_date} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                  <Input name="amount" type="number" min="0" defaultValue={expense.amount || 0} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Categorie *</label>
                  <Input name="category" defaultValue={expense.category} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type d&apos;activite *</label>
                  <Input name="activity_type" defaultValue={expense.activity_type} required />
                </div>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteExpenseAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cette depense</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
