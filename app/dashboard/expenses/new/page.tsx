import { createExpenseAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewExpensePage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Depenses / Nouvelle</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvelle depense</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createExpenseAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <Input name="expense_date" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                <Input name="amount" type="number" min="0" defaultValue="0" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categorie *</label>
                <Input name="category" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type d&apos;activite *</label>
                <Input name="activity_type" required />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer la depense</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
