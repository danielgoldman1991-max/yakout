"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pause, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RelationSearchSelect, type SelectOption } from "@/components/dashboard/relation-search-select";
import { ApartmentGalleryManager } from "@/components/dashboard/apartment-gallery-manager";
import { slugify } from "@/lib/utils/slug";
import type { Apartment, ApartmentImage } from "@/types/business";

type ApartmentFormProps = {
  apartment?: Apartment | null;
  images?: ApartmentImage[];
  owners: SelectOption[];
  action: (formData: FormData) => void | Promise<void>;
  defaultOwnerId?: string;
};

const field = "space-y-1";
const label = "text-xs font-medium text-muted-foreground";
const section = "rounded-sm border border-border bg-card p-5";

export function ApartmentForm({ apartment, images = [], owners, action, defaultOwnerId }: ApartmentFormProps) {
  const [ownerId, setOwnerId] = useState(apartment?.owner_id ?? defaultOwnerId ?? "");
  const [publicName, setPublicName] = useState(apartment?.public_name ?? "");
  const [slug, setSlug] = useState(apartment?.slug ?? "");

  function updatePublicName(value: string) {
    setPublicName(value);
    if (!apartment?.slug && !slug) setSlug(slugify(value));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="owner_id" value={ownerId} />

      <div className={section}>
        <h2 className="text-base font-semibold">Proprietaire & gestion</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RelationSearchSelect options={owners} value={ownerId} onChange={setOwnerId} label="Proprietaire lie" placeholder="Aucun proprietaire" />
          <div className={field}>
            <label className={label}>Statut gestion</label>
            <select name="management_status" defaultValue={apartment?.management_status ?? "prospect"} className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm">
              <option value="prospect">Prospect</option>
              <option value="info_missing">Infos a completer</option>
              <option value="visit_scheduled">Visite prevue</option>
              <option value="contract_pending">Contrat en attente</option>
              <option value="contract_signed">Contrat signe</option>
              <option value="preparation">Preparation en cours</option>
              <option value="ready_to_publish">Pret a publier</option>
              <option value="published">Publie</option>
              <option value="active_management">Gestion active</option>
              <option value="paused">En pause</option>
              <option value="ended">Gestion terminee</option>
            </select>
          </div>
          <div className={field}>
            <label className={label}>Statut contrat</label>
            <select name="contract_status" defaultValue={apartment?.contract_status ?? "missing"} className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm">
              <option value="missing">Manquant</option>
              <option value="to_prepare">A preparer</option>
              <option value="sent">Envoye</option>
              <option value="signed">Signe</option>
              <option value="expired">Expire</option>
            </select>
          </div>
          <div className={field}>
            <label className={label}>Commission Yakout %</label>
            <Input name="commission_rate" type="number" min={0} step="0.01" defaultValue={apartment?.commission_rate ?? ""} />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className="text-base font-semibold">Identite du bien</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={field}>
            <label className={label}>Nom interne *</label>
            <Input name="internal_name" required defaultValue={apartment?.internal_name ?? ""} placeholder="Appartement Majorelle - Maria" />
          </div>
          <div className={field}>
            <label className={label}>Nom public *</label>
            <Input name="public_name" required value={publicName} onChange={(event) => updatePublicName(event.target.value)} placeholder="Appartement Majorelle Signature" />
          </div>
          <div className={field}>
            <label className={label}>Slug *</label>
            <Input name="slug" required value={slug} onChange={(event) => setSlug(slugify(event.target.value))} />
          </div>
          <div className={field}>
            <label className={label}>Reference interne</label>
            <Input name="internal_reference" defaultValue={apartment?.internal_reference ?? ""} />
          </div>
          <div className={field}>
            <label className={label}>Type de bien</label>
            <select name="property_type" defaultValue={apartment?.property_type ?? "apartment"} className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm">
              <option value="apartment">Appartement</option>
              <option value="studio">Studio</option>
              <option value="villa">Villa</option>
              <option value="riad">Riad</option>
              <option value="penthouse">Penthouse</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className={field}>
            <label className={label}>Quartier *</label>
            <Input name="district" required defaultValue={apartment?.district ?? ""} />
          </div>
          <div className={field}>
            <label className={label}>Ville</label>
            <Input name="city" defaultValue={apartment?.city ?? "Marrakech"} />
          </div>
          <div className={field}>
            <label className={label}>Indication publique de localisation</label>
            <Input name="address_public_hint" defaultValue={apartment?.address_public_hint ?? ""} placeholder="A 5 minutes du Jardin Majorelle" />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className={label}>Adresse privee</label>
            <Textarea name="address_private" rows={2} defaultValue={apartment?.address_private ?? ""} />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className="text-base font-semibold">Capacite & caracteristiques</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField name="capacity" label="Voyageurs" min={1} value={apartment?.capacity ?? 2} />
          <NumberField name="bedrooms" label="Chambres" min={0} value={apartment?.bedrooms ?? 1} />
          <NumberField name="bathrooms" label="Salles de bain" min={0} value={apartment?.bathrooms ?? 1} />
          <NumberField name="beds" label="Lits" min={0} value={apartment?.beds ?? ""} />
          <div className={field}>
            <label className={label}>Etage</label>
            <Input name="floor" defaultValue={apartment?.floor ?? ""} />
          </div>
          <NumberField name="surface_area" label="Surface m2" min={0} value={apartment?.surface_area ?? ""} />
          <Checkbox name="has_elevator" label="Ascenseur" checked={apartment?.has_elevator} />
          <Checkbox name="has_terrace" label="Terrasse" checked={apartment?.has_terrace} />
          <Checkbox name="has_pool" label="Piscine" checked={apartment?.has_pool} />
          <Checkbox name="has_parking" label="Parking" checked={apartment?.has_parking} />
        </div>
      </div>

      <div className={section}>
        <h2 className="text-base font-semibold">Prix & conditions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField name="price_per_night" label="Prix par nuit" min={0} value={apartment?.price_per_night ?? apartment?.price_from ?? ""} />
          <div className={field}>
            <label className={label}>Devise</label>
            <Input name="currency" defaultValue={apartment?.currency ?? "MAD"} />
          </div>
          <NumberField name="cleaning_fee" label="Frais de menage" min={0} value={apartment?.cleaning_fee ?? ""} />
          <NumberField name="deposit_amount" label="Caution" min={0} value={apartment?.deposit_amount ?? ""} />
          <NumberField name="minimum_nights" label="Minimum nuits" min={1} value={apartment?.minimum_nights ?? 1} />
          <div className={field}>
            <label className={label}>Check-in</label>
            <Input name="check_in_time" defaultValue={apartment?.check_in_time ?? ""} placeholder="15:00" />
          </div>
          <div className={field}>
            <label className={label}>Check-out</label>
            <Input name="check_out_time" defaultValue={apartment?.check_out_time ?? ""} placeholder="11:00" />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className="text-base font-semibold">Contenu public</h2>
        <div className="mt-4 space-y-4">
          <div className={field}>
            <label className={label}>Description courte *</label>
            <Textarea name="short_description" rows={2} defaultValue={apartment?.short_description ?? ""} />
          </div>
          <div className={field}>
            <label className={label}>Description detaillee</label>
            <Textarea name="detailed_description" rows={6} defaultValue={apartment?.detailed_description ?? apartment?.description ?? ""} />
          </div>
          <ListField name="highlights" label="Points forts" values={apartment?.highlights} placeholder={"Quartier central\nIdeal couple ou famille\nTerrasse agreable"} />
          <ListField name="amenities" label="Equipements" values={apartment?.amenities} placeholder={"Wi-Fi\nClimatisation\nCuisine equipee\nMachine a laver"} />
          <ListField name="house_rules" label="Regles de sejour" values={apartment?.house_rules} placeholder={"Non-fumeur\nPas de fete\nRespect du voisinage"} />
        </div>
      </div>

      <ApartmentGalleryManager images={images} />

      <div className={section}>
        <h2 className="text-base font-semibold">Informations operationnelles internes</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ListTextArea name="access_instructions" label="Instructions d'acces" value={apartment?.access_instructions} />
          <ListTextArea name="cleaning_instructions" label="Instructions menage" value={apartment?.cleaning_instructions} />
          <div className={field}>
            <label className={label}>Wi-Fi nom</label>
            <Input name="wifi_name" defaultValue={apartment?.wifi_name ?? ""} />
          </div>
          <div className={field}>
            <label className={label}>Wi-Fi mot de passe</label>
            <Input name="wifi_password" defaultValue={apartment?.wifi_password ?? ""} />
          </div>
          <ListTextArea name="maintenance_notes" label="Notes maintenance" value={apartment?.maintenance_notes} />
          <ListTextArea name="internal_notes" label="Notes internes" value={apartment?.internal_notes} />
        </div>
      </div>

      <div className={section}>
        <h2 className="text-base font-semibold">Publication</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={field}>
            <label className={label}>Statut public</label>
            <select name="public_status" defaultValue={apartment?.public_status ?? (apartment?.is_published ? "published" : "draft")} className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm">
              <option value="draft">Brouillon</option>
              <option value="ready">Pret a publier</option>
              <option value="published">Publie</option>
              <option value="paused">En pause</option>
              <option value="archived">Archive</option>
            </select>
          </div>
          <Checkbox name="is_featured" label="Mettre en avant sur le site" checked={apartment?.is_featured} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="submit" name="intent" value="draft" variant="secondary"><Save className="h-4 w-4" /> Enregistrer brouillon</Button>
          <Button type="submit" name="intent" value="save"><Save className="h-4 w-4" /> Enregistrer</Button>
          <Button type="submit" name="intent" value="publish"><Send className="h-4 w-4" /> Publier</Button>
          <Button type="submit" name="intent" value="pause" variant="secondary"><Pause className="h-4 w-4" /> Mettre en pause</Button>
          {apartment?.slug && (apartment.public_status === "published" || apartment.is_published) && (
            <Link href={`/apartments/${apartment.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-secondary px-4 text-sm font-medium">
              <Eye className="h-4 w-4" /> Voir sur le site
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

function NumberField({ name, label: text, min, value }: { name: string; label: string; min: number; value: number | string }) {
  return (
    <div className={field}>
      <label className={label}>{text}</label>
      <Input name={name} type="number" min={min} step="0.01" defaultValue={value} />
    </div>
  );
}

function Checkbox({ name, label: text, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={Boolean(checked)} />
      {text}
    </label>
  );
}

function ListField({ name, label: text, values, placeholder }: { name: string; label: string; values?: string[]; placeholder?: string }) {
  return (
    <div className={field}>
      <label className={label}>{text}</label>
      <Textarea name={name} rows={4} defaultValue={(values ?? []).join("\n")} placeholder={placeholder} />
    </div>
  );
}

function ListTextArea({ name, label: text, value }: { name: string; label: string; value?: string | null }) {
  return (
    <div className={field}>
      <label className={label}>{text}</label>
      <Textarea name={name} rows={3} defaultValue={value ?? ""} />
    </div>
  );
}
