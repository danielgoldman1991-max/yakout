import { createApartmentAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export default async function NewApartmentPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Appartements / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvel appartement</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
          <form action={createApartmentAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nom interne *</label>
                <Input name="internal_name" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nom public *</label>
                <Input name="public_name" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                <Input name="slug" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Quartier *</label>
                <Input name="district" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Chambres</label>
                <Input name="bedrooms" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Salles de bain</label>
                <Input name="bathrooms" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Capacite *</label>
                <Input name="capacity" type="number" min={1} defaultValue={1} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
                <Input name="price_from" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Equipements</label>
                <Input name="amenities" placeholder="Wifi, climatisation, terrasse" />
              </div>
            </div>
            <ImageUploadField
              label="Image principale"
              folder="apartments"
              name="image_url"
              altName="image_alt_text"
              helperText="Image affichee sur /apartments et la fiche publique."
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description courte</label>
              <Textarea name="short_description" rows={2} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description longue</label>
              <Textarea name="detailed_description" rows={6} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_published" defaultChecked />
                Publie
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_featured" />
                Mis en avant
              </label>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer l&apos;appartement</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
