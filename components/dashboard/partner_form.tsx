"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Partner } from "@/types/business";
import { Loader2 } from "lucide-react";

const PARTNER_TYPES = [
  { value: "transport_company", label: "Société transport" },
  { value: "vehicle_owner", label: "Propriétaire véhicule" },
  { value: "driver", label: "Chauffeur" },
  { value: "guide", label: "Guide" },
  { value: "tour_provider", label: "Prestataire excursion" },
  { value: "restaurant", label: "Restaurant partenaire" },
  { value: "activity_provider", label: "Activité / expérience" },
  { value: "cleaning", label: "Ménage" },
  { value: "laundry", label: "Blanchisserie" },
  { value: "maintenance", label: "Maintenance" },
  { value: "repair", label: "Réparation" },
  { value: "real_estate_service", label: "Service immobilier" },
  { value: "admin_supplier", label: "Fournisseur administratif" },
  { value: "other", label: "Autre" },
];

const STATUSES = [
  { value: "active", label: "Actif" },
  { value: "to_review", label: "À vérifier" },
  { value: "pending_contract", label: "Contrat en attente" },
  { value: "suspended", label: "Suspendu" },
  { value: "inactive", label: "Inactif" },
  { value: "blacklisted", label: "Bloqué" },
];

const CONTACT_CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Téléphone" },
  { value: "email", label: "Email" },
];

const COST_TYPES = [
  { value: "fixed", label: "Prix fixe" },
  { value: "per_trip", label: "Par trajet" },
  { value: "per_day", label: "Par journée" },
  { value: "per_person", label: "Par personne" },
  { value: "commission", label: "Commission" },
  { value: "quote", label: "Sur devis" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "immediate", label: "Immédiat" },
  { value: "after_service", label: "Fin de prestation" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "on_invoice", label: "Sur facture" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export function PartnerForm({ action, partner }: { action: (formData: FormData) => void; partner?: Partial<Partner> }) {
  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Identité & statut</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du partenaire *"><Input name="name" defaultValue={partner?.name ?? ""} required /></Field>
          <Field label="Type de partenaire">
            <select name="partner_type" defaultValue={partner?.partner_type ?? partner?.type ?? "transport_company"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {PARTNER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select name="status" defaultValue={partner?.status ?? (partner?.is_active === false ? "inactive" : "active")} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Société / enseigne"><Input name="company_name" defaultValue={partner?.company_name ?? ""} /></Field>
          <Field label="Personne de contact"><Input name="contact_person" defaultValue={partner?.contact_person ?? ""} /></Field>
          <Field label="Ville"><Input name="city" defaultValue={partner?.city ?? "Marrakech"} /></Field>
          <Field label="Adresse"><Input name="address" defaultValue={partner?.address ?? ""} /></Field>
          <Field label="ICE"><Input name="ice" defaultValue={partner?.ice ?? ""} /></Field>
          <Field label="Identifiant fiscal"><Input name="tax_id" defaultValue={partner?.tax_id ?? ""} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone"><Input name="phone" defaultValue={partner?.phone ?? ""} /></Field>
          <Field label="WhatsApp"><Input name="whatsapp" defaultValue={partner?.whatsapp ?? ""} /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={partner?.email ?? ""} /></Field>
          <Field label="Canal préféré">
            <select name="preferred_contact_channel" defaultValue={partner?.preferred_contact_channel ?? "whatsapp"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              {CONTACT_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Services & zones</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégories de service (une par ligne)">
            <Textarea name="service_categories" defaultValue={(partner?.service_categories ?? []).join("\n")} rows={4} placeholder="Transport&#10;Chauffeur&#10;Guide&#10;Excursion Agafay&#10;Excursion Ourika&#10;Excursion Essaouira&#10;Ménage&#10;Maintenance" />
          </Field>
          <Field label="Zones couvertes (une par ligne)">
            <Textarea name="zones" defaultValue={(partner?.zones ?? []).join("\n")} rows={4} placeholder="Marrakech&#10;Aéroport Marrakech&#10;Agafay&#10;Ourika&#10;Essaouira&#10;Palmeraie&#10;Guéliz&#10;Médina" />
          </Field>
          <Field label="Langues (une par ligne)">
            <Textarea name="languages" defaultValue={(partner?.languages ?? []).join("\n")} rows={3} placeholder="Français&#10;Arabe&#10;Anglais&#10;Espagnol" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Finance & conditions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Taux commission Yakout %"><Input name="commission_rate" type="number" min="0" max="100" step="0.01" defaultValue={partner?.commission_rate ?? partner?.commission ?? ""} /></Field>
          <Field label="Type coût par défaut">
            <select name="default_cost_type" defaultValue={partner?.default_cost_type ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Sélectionner...</option>
              {COST_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Conditions de paiement">
            <select name="payment_terms" defaultValue={partner?.payment_terms ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Sélectionner...</option>
              {PAYMENT_TERMS_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Banque"><Input name="bank_name" defaultValue={partner?.bank_name ?? ""} /></Field>
          <Field label="RIB"><Input name="rib" defaultValue={partner?.rib ?? ""} /></Field>
          <Field label="Notes tarifaires"><Input name="notes" defaultValue={partner?.notes ?? ""} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Évaluation interne</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Note (1-5)"><Input name="rating" type="number" min="1" max="5" defaultValue={partner?.rating ?? ""} /></Field>
          <Field label="Score fiabilité (1-100)"><Input name="reliability_score" type="number" min="0" max="100" defaultValue={partner?.reliability_score ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Notes internes"><Textarea name="internal_notes" defaultValue={partner?.internal_notes ?? ""} rows={4} /></Field></div>
        </CardContent>
      </Card>

      <SubmitButton isUpdate={Boolean(partner?.id)} />
    </form>
  );
}

function SubmitButton({ isUpdate }: { isUpdate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? (
        <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{isUpdate ? "Mise à jour..." : "Création..."}</>
      ) : (
        isUpdate ? "Mettre à jour le partenaire" : "Créer le partenaire"
      )}
    </button>
  );
}
