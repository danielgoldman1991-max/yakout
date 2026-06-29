import { createServiceAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewServicePage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Services / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau service</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createServiceAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                <Input name="title" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                <Input name="slug" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prix (DH)</label>
                <Input name="price_from" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Ordre</label>
                <Input name="display_order" type="number" min="0" defaultValue="0" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_published" />
                  Publie
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description courte *</label>
              <Textarea name="short_description" required rows={2} />
            </div>
            <ImageUploadField
              label="Image optionnelle"
              folder="services"
              name="image_url"
              altName="image_alt_text"
              helperText="Image utilisee pour enrichir les pages de service."
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Icone</label>
              <Input name="icon" placeholder="sparkles, car, home..." />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description *</label>
                <Textarea name="description" required rows={6} />
              </div>
              <details className="rounded-sm border border-border/50 bg-accent/10">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground">SEO (optionnel)</summary>
                <div className="space-y-3 border-t border-border/50 p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                    <Input name="meta_title" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                    <Textarea name="meta_description" rows={2} />
                  </div>
                </div>
              </details>
              <Button type="submit" className="w-full sm:w-auto">Creer le service</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
