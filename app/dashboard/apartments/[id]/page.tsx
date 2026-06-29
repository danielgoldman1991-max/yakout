import { notFound } from "next/navigation";
import { getDashboardApartmentById } from "@/lib/data";
import { updateApartmentAction, deleteApartmentAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function ApartmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apartment = await getDashboardApartmentById(id);
  if (!apartment) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Appartements / {apartment.internal_name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{apartment.public_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prix actuel : {formatCurrency(apartment.price_from)} / nuit</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier l&apos;appartement</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateApartmentAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom interne *</label>
                  <Input name="internal_name" defaultValue={apartment.internal_name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom public *</label>
                  <Input name="public_name" defaultValue={apartment.public_name} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                  <Input name="slug" defaultValue={apartment.slug} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Quartier *</label>
                  <Input name="district" defaultValue={apartment.district} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Chambres</label>
                  <Input name="bedrooms" type="number" min="0" defaultValue={apartment.bedrooms ?? 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Salles de bain</label>
                  <Input name="bathrooms" type="number" min="0" defaultValue={apartment.bathrooms ?? 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Capacite</label>
                  <Input name="capacity" type="number" min="1" defaultValue={apartment.capacity || 1} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
                  <Input name="price_from" type="number" min="0" defaultValue={apartment.price_from || 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Equipements</label>
                  <Input name="amenities" defaultValue={apartment.amenities?.join(", ") ?? ""} />
                </div>
              </div>
              <ImageUploadField
                label="Image principale"
                folder="apartments"
                name="image_url"
                altName="image_alt_text"
                defaultUrl={apartment.image_url}
                defaultAlt={apartment.image_alt_text}
                helperText="Remplace l'image affichee sur les pages publiques."
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description courte</label>
                <Textarea name="short_description" defaultValue={apartment.short_description ?? ""} rows={2} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description longue</label>
                <Textarea name="detailed_description" defaultValue={apartment.detailed_description ?? ""} rows={6} />
              </div>
              <details className="rounded-sm border border-border/50 bg-accent/10">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground">SEO public</summary>
                <div className="space-y-3 border-t border-border/50 p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                    <Input name="meta_title" maxLength={70} defaultValue={apartment.meta_title ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                    <Textarea name="meta_description" maxLength={170} defaultValue={apartment.meta_description ?? ""} rows={2} />
                  </div>
                </div>
              </details>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_published" defaultChecked={apartment.is_published} />
                  Publie
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_featured" defaultChecked={apartment.is_featured} />
                  Mis en avant
                </label>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteApartmentAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cet appartement</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
