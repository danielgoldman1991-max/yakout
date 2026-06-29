import { createPartnerAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewPartnerPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Partenaires / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau partenaire</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createPartnerAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                <Input name="name" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type *</label>
                <Input name="type" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Telephone *</label>
                <Input name="phone" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input name="email" type="email" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Commission (%)</label>
              <Input name="commission" type="number" min="0" defaultValue="0" />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le partenaire</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
