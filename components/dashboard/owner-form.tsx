import { createOwnerAction } from "@/lib/data/owner-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import Link from "next/link";

const PIPELINE_STATUSES = [
  { value: "lead_received", label: "Demande reçue" },
  { value: "contacted", label: "Contacté" },
  { value: "property_info_pending", label: "Infos bien à compléter" },
  { value: "visit_scheduled", label: "Visite programmée" },
  { value: "visited", label: "Visité" },
  { value: "offer_sent", label: "Offre envoyée" },
  { value: "contract_pending", label: "Contrat en attente" },
  { value: "contract_signed", label: "Contrat signé" },
  { value: "onboarding", label: "Onboarding" },
  { value: "active_management", label: "Gestion active" },
  { value: "paused", label: "En pause" },
  { value: "lost", label: "Perdu" },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Téléphone" },
  { value: "email", label: "Email" },
];

const SOURCES = [
  { value: "Ajout manuel", label: "Ajout manuel" },
  { value: "Formulaire site", label: "Formulaire site" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Recommandation", label: "Recommandation" },
  { value: "Autre", label: "Autre" },
];

export function OwnerForm() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Informations du propriétaire</CardTitle>
      </CardHeader>
      <CardContent>
        <FormErrorBanner />
        <form action={createOwnerAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nom complet *</label>
              <Input name="full_name" placeholder="Ex: Ahmed Benali" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Téléphone WhatsApp *</label>
              <Input name="phone" type="tel" placeholder="Ex: +212612345678" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input name="email" type="email" placeholder="Ex: ahmed@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ville</label>
              <Input name="city" placeholder="Ex: Marrakech" defaultValue="Marrakech" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Pays</label>
              <Input name="country" placeholder="Ex: Maroc" defaultValue="Maroc" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Canal préféré</label>
              <select
                name="preferred_contact_channel"
                className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                defaultValue="whatsapp"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut pipeline</label>
              <select
                name="status"
                className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                defaultValue="lead_received"
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Source</label>
              <select
                name="source"
                className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                defaultValue="Ajout manuel"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
            <Textarea name="notes" placeholder="Informations complémentaires…" rows={3} />
          </div>

          <div className="flex gap-3">
            <Button type="submit">Créer le propriétaire</Button>
            <Link href="/dashboard/owners">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
