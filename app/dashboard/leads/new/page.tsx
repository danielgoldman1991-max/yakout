import { createLeadAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { leadRequestTypes, leadTypeLabels } from "@/lib/leads";

const LEAD_SOURCES = ["Site web", "WhatsApp", "Telephone", "Recommandation", "Instagram", "Facebook", "Autre"];

export default function NewLeadPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Leads / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau lead</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du lead</CardTitle>
        </CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createLeadAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                <Input name="name" required />
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
                <label className="text-xs font-medium text-muted-foreground">Type *</label>
                <select name="request_type" required className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                  {leadRequestTypes.map((t) => (<option key={t} value={t}>{leadTypeLabels[t]}</option>))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Source</label>
                <select name="source" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                  {LEAD_SOURCES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date souhaitee</label>
                <Input name="desired_date" type="date" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nombre de personnes</label>
                <Input name="people_count" type="number" min="1" defaultValue="1" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Budget estime (DH)</label>
                <Input name="estimated_budget" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Message *</label>
              <Textarea name="message" required rows={4} />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le lead</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
