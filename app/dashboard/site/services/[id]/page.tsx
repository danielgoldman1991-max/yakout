import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/data";
import { updateServiceAction, deleteServiceAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export default async function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Services / {service.title}</p>
        <h1 className="mt-2 text-3xl font-semibold">{service.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{service.price_from ? formatCurrency(service.price_from) : "Sur devis"}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le service</CardTitle></CardHeader>
          <CardContent>
            <form action={updateServiceAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                  <Input name="title" defaultValue={service.title} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                  <Input name="slug" defaultValue={service.slug} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
                  <Input name="price_from" type="number" defaultValue={service.price_from ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ordre d&apos;affichage</label>
                  <Input name="display_order" type="number" defaultValue={service.display_order} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_published" defaultChecked={service.is_published} />
                    Publie
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description courte *</label>
                <Textarea name="short_description" defaultValue={service.short_description} rows={2} required />
              </div>
              <ImageUploadField
                label="Image optionnelle"
                folder="services"
                name="image_url"
                altName="image_alt_text"
                defaultUrl={service.image_url}
                defaultAlt={service.image_alt_text}
                helperText="Image utilisee pour enrichir les pages de service."
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Icone</label>
                <Input name="icon" defaultValue={service.icon ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description *</label>
                <Textarea name="description" defaultValue={service.description} rows={6} required />
              </div>
              <details className="rounded-sm border border-border/50 bg-accent/10">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground">SEO (optionnel)</summary>
                <div className="space-y-3 border-t border-border/50 p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                    <Input name="meta_title" defaultValue={service.meta_title ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                    <Textarea name="meta_description" defaultValue={service.meta_description ?? ""} rows={2} />
                  </div>
                </div>
              </details>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteServiceAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce service</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
