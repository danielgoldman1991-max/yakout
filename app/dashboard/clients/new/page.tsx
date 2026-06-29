import { createClientAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { clientStatusLabels, clientStatuses, clientTypeLabels } from "@/lib/clients-crm-shared";

export default function NewClientPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Clients / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau client</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createClientAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nom complet *</label>
                <Input name="full_name" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Telephone *</label>
                <Input name="phone" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input name="email" type="email" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nationalite</label>
                <Input name="nationality" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Ville</label>
                <Input name="city" placeholder="Marrakech, Paris..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Pays</label>
                <Input name="country" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type client</label>
                <select name="client_type" defaultValue="voyageur" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
                  {Object.entries(clientTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Statut relation</label>
                <select name="status" defaultValue="new" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
                  {clientStatuses.map((value) => <option key={value} value={value}>{clientStatusLabels[value]}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Source d&apos;acquisition</label>
              <Input name="acquisition_source" placeholder="Site web, recommandation, etc." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <Input name="tags" placeholder="VIP, famille, business" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea name="notes" rows={3} />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
