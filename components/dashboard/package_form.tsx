import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { PackageItemsBuilder } from "@/components/dashboard/package_items_builder";
import type { Package } from "@/types/business";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export function PackageForm({ pack }: { pack?: Partial<Package> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Informations pack</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nom interne *"><Input name="title" defaultValue={pack?.title ?? ""} required /></Field>
          <Field label="Nom public"><Input name="public_title" defaultValue={pack?.public_title ?? ""} /></Field>
          <Field label="Slug *"><Input name="slug" defaultValue={pack?.slug ?? ""} required /></Field>
          <Field label="Type"><select name="package_type" defaultValue={pack?.package_type ?? "custom"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="stay">Sejour</option><option value="transport">Transport</option><option value="circuit">Circuit</option><option value="apartment_transport">Appartement + transport</option><option value="custom">Sur mesure</option><option value="premium">Premium</option></select></Field>
          <Field label="Destination"><Input name="destination" defaultValue={pack?.destination ?? "Marrakech"} /></Field>
          <Field label="Duree"><Input name="duration_label" defaultValue={pack?.duration_label ?? ""} placeholder="3 jours / 2 nuits" /></Field>
          <Field label="Capacite min"><Input name="capacity_min" type="number" min="0" defaultValue={pack?.capacity_min ?? 1} /></Field>
          <Field label="Capacite max"><Input name="capacity_max" type="number" min="0" defaultValue={pack?.capacity_max ?? 4} /></Field>
          <Field label="Prix a partir de"><Input name="price_from" type="number" min="0" defaultValue={pack?.price_from ?? 0} /></Field>
          <Field label="Publication"><select name="public_status" defaultValue={pack?.public_status ?? "draft"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="draft">Brouillon</option><option value="published">Publie</option><option value="paused">En pause</option><option value="archived">Archive</option></select></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={pack?.is_featured ?? false} /> Mis en avant</label>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Description publique</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Description courte"><Textarea name="short_description" defaultValue={pack?.short_description ?? ""} rows={2} /></Field><Field label="Description complete"><Textarea name="description" defaultValue={pack?.description ?? ""} rows={6} /></Field></CardContent></Card>
        <PackageItemsBuilder items={pack?.package_items ?? []} />
      </div>
      <div className="space-y-5">
        <ImageUploadField label="Image principale" folder="services" name="image_url" altName="image_alt_text" defaultUrl={pack?.image_url} defaultAlt={pack?.image_alt_text} helperText="Image publique du pack." />
        <Card><CardHeader><CardTitle>Notes internes</CardTitle></CardHeader><CardContent><Textarea name="internal_notes" defaultValue={pack?.internal_notes ?? ""} rows={6} /></CardContent></Card>
      </div>
    </div>
  );
}
