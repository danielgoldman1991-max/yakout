import { createVehicleAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewVehiclePage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Vehicules / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau vehicule</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createVehicleAction} className="space-y-4">
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
                <label className="text-xs font-medium text-muted-foreground">Marque *</label>
                <Input name="brand" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Modele *</label>
                <Input name="model" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                <Input name="slug" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Capacite</label>
                <Input name="capacity" type="number" min="1" defaultValue="1" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
              <Input name="price_from" type="number" min="0" defaultValue="0" />
            </div>
            <ImageUploadField
              label="Image principale"
              folder="vehicles"
              name="image_url"
              altName="image_alt_text"
              helperText="Image affichee sur /vehicles et la fiche publique."
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description publique</label>
              <Textarea name="public_description" rows={5} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="with_driver" />
                Avec chauffeur
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_published" />
                Publie
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_featured" />
                Mis en avant
              </label>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer le vehicule</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
