import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/data";
import { updateVehicleAction, deleteVehicleAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function VehicleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Vehicules / {vehicle.internal_name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{vehicle.public_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prix : {formatCurrency(vehicle.price_from)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le vehicule</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateVehicleAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom interne *</label>
                  <Input name="internal_name" defaultValue={vehicle.internal_name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom public *</label>
                  <Input name="public_name" defaultValue={vehicle.public_name} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Marque *</label>
                  <Input name="brand" defaultValue={vehicle.brand} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Modele *</label>
                  <Input name="model" defaultValue={vehicle.model} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                  <Input name="slug" defaultValue={vehicle.slug} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Capacite</label>
                  <Input name="capacity" type="number" min="1" defaultValue={vehicle.capacity || 1} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
                <Input name="price_from" type="number" min="0" defaultValue={vehicle.price_from || 0} />
              </div>
              <ImageUploadField
                label="Image principale"
                folder="vehicles"
                name="image_url"
                altName="image_alt_text"
                defaultUrl={vehicle.image_url}
                defaultAlt={vehicle.image_alt_text}
                helperText="Remplace l'image affichee sur les pages publiques."
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description publique</label>
                <Textarea name="public_description" defaultValue={vehicle.public_description ?? ""} rows={5} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="with_driver" defaultChecked={vehicle.with_driver} />
                  Avec chauffeur
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_published" defaultChecked={vehicle.is_published} />
                  Publie
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_featured" defaultChecked={vehicle.is_featured} />
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
            <form action={deleteVehicleAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce vehicule</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
