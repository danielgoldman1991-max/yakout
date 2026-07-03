import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import type { Partner, Vehicle } from "@/types/business";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export function VehicleForm({ partners, vehicle, defaultPartnerId }: { partners: Pick<Partner, "id" | "name" | "phone" | "city" | "partner_type">[]; vehicle?: Partial<Vehicle>; defaultPartnerId?: string }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Gestion & partenaire</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Type de propriete">
              <select name="ownership_type" defaultValue={vehicle?.ownership_type ?? "partner"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                <option value="owned">Vehicule Yakout</option>
                <option value="partner">Vehicule partenaire</option>
                <option value="rental_partner">Location partenaire</option>
                <option value="occasional">Ponctuel</option>
              </select>
            </Field>
            <Field label="Partenaire lie">
              <select name="partner_id" defaultValue={defaultPartnerId ?? vehicle?.partner_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Aucun</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}{partner.phone ? ` · ${partner.phone}` : ""}{partner.city ? ` · ${partner.city}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Disponibilite">
              <select name="availability_status" defaultValue={vehicle?.availability_status ?? "available"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                <option value="available">Disponible</option>
                <option value="busy">Occupe</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </Field>
            <Field label="Statut public">
              <select name="public_status" defaultValue={vehicle?.public_status ?? "draft"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                <option value="draft">Brouillon</option>
                <option value="published">Publie</option>
                <option value="paused">En pause</option>
                <option value="archived">Archive</option>
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="Notes internes"><Textarea name="internal_notes" defaultValue={vehicle?.internal_notes ?? ""} rows={3} /></Field></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Identite vehicule</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom interne *"><Input name="internal_name" defaultValue={vehicle?.internal_name ?? ""} required /></Field>
            <Field label="Nom public *"><Input name="public_name" defaultValue={vehicle?.public_name ?? ""} required /></Field>
            <Field label="Slug *"><Input name="slug" defaultValue={vehicle?.slug ?? ""} required /></Field>
            <Field label="Reference interne"><Input name="internal_reference" defaultValue={vehicle?.internal_reference ?? ""} /></Field>
            <Field label="Marque"><Input name="brand" defaultValue={vehicle?.brand ?? ""} /></Field>
            <Field label="Modele"><Input name="model" defaultValue={vehicle?.model ?? ""} /></Field>
            <Field label="Categorie">
              <select name="category" defaultValue={vehicle?.category ?? "suv"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                {["suv", "van", "minivan", "sedan", "luxury", "bus", "economic", "family", "other"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Type vehicule"><Input name="vehicle_type" defaultValue={vehicle?.vehicle_type ?? ""} /></Field>
            <Field label="Capacite passagers"><Input name="capacity" type="number" min="1" defaultValue={vehicle?.capacity ?? 4} /></Field>
            <Field label="Capacite bagages"><Input name="luggage_capacity" type="number" min="0" defaultValue={vehicle?.luggage_capacity ?? 0} /></Field>
            <Field label="Couleur"><Input name="color" defaultValue={vehicle?.color ?? ""} /></Field>
            <Field label="Immatriculation privee"><Input name="plate_number" defaultValue={vehicle?.plate_number ?? ""} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="with_driver" defaultChecked={vehicle?.with_driver ?? true} /> Chauffeur inclus</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="driver_required" defaultChecked={vehicle?.driver_required ?? true} /> Chauffeur obligatoire</label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contenu public</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Description courte"><Textarea name="short_description" defaultValue={vehicle?.short_description ?? ""} rows={2} /></Field>
            <Field label="Description detaillee"><Textarea name="description" defaultValue={vehicle?.description ?? vehicle?.public_description ?? ""} rows={5} /></Field>
            <Field label="Cas d'usage (un par ligne)"><Textarea name="use_cases" defaultValue={(vehicle?.use_cases ?? []).join("\n")} rows={4} /></Field>
            <Field label="Equipements (un par ligne)"><Textarea name="amenities" defaultValue={(vehicle?.amenities ?? []).join("\n")} rows={4} /></Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Tarification</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Field label="Prix a partir de"><Input name="price_from" type="number" min="0" defaultValue={vehicle?.price_from ?? 0} /></Field>
            <Field label="Prix transfert"><Input name="price_transfer" type="number" min="0" defaultValue={vehicle?.price_transfer ?? vehicle?.price_from ?? 0} /></Field>
            <Field label="Prix demi-journee"><Input name="price_half_day" type="number" min="0" defaultValue={vehicle?.price_half_day ?? 0} /></Field>
            <Field label="Prix journee"><Input name="price_full_day" type="number" min="0" defaultValue={vehicle?.price_full_day ?? 0} /></Field>
            <Field label="Prix par km"><Input name="price_per_km" type="number" min="0" defaultValue={vehicle?.price_per_km ?? 0} /></Field>
            <Field label="Commission Yakout %"><Input name="commission_rate" type="number" min="0" defaultValue={vehicle?.commission_rate ?? vehicle?.commission ?? 0} /></Field>
          </CardContent>
        </Card>

        <ImageUploadField label="Image principale" folder="vehicles" name="image_url" altName="image_alt_text" defaultUrl={vehicle?.image_url} defaultAlt={vehicle?.image_alt_text} helperText="Image publique affichee sur /vehicles." />

        <Card>
          <CardHeader><CardTitle>Documents & conformite</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Expiration assurance"><Input name="insurance_expiry_date" type="date" defaultValue={vehicle?.insurance_expiry_date ?? ""} /></Field>
            <Field label="Expiration visite technique"><Input name="technical_visit_expiry_date" type="date" defaultValue={vehicle?.technical_visit_expiry_date ?? ""} /></Field>
            <Field label="Expiration autorisation"><Input name="authorization_expiry_date" type="date" defaultValue={vehicle?.authorization_expiry_date ?? ""} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={vehicle?.is_featured ?? false} /> Mis en avant</label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
