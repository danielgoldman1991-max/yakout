import { createSitePageAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewSitePagePage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Pages du site / Nouvelle</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvelle page</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createSitePageAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                <Input name="title" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <Input name="slug" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sous-titre</label>
              <Input name="subtitle" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Contenu *</label>
              <Textarea name="content" required rows={8} />
            </div>
            <ImageUploadField
              label="Image hero"
              folder="pages"
              name="cover_image_url"
              altName="cover_image_alt"
              helperText="Image principale de la page si elle est affichee publiquement."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bouton principal</label>
                <Input name="primary_button_text" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">URL bouton principal</label>
                <Input name="primary_button_url" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                <Input name="meta_title" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                <Input name="meta_description" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <select name="status" defaultValue="draft" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                <option value="draft">Brouillon</option>
                <option value="published">Publie</option>
              </select>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Creer la page</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
