import { createBlogPostAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Blog / Nouvel article</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvel article</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createBlogPostAction} className="space-y-4">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categorie *</label>
                <Input name="category" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Statut</label>
                <select name="status" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                  <option value="draft">Brouillon</option>
                  <option value="published">Publie</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Extrait *</label>
              <Textarea name="excerpt" required rows={2} />
            </div>
            <ImageUploadField
              label="Image de couverture"
              folder="blog"
              name="cover_image_url"
              altName="cover_image_alt"
              helperText="Image principale affichee sur la carte blog et la page article."
            />
            <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Contenu *</label>
                <Textarea name="content" required rows={8} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date de publication</label>
                <Input name="published_at" type="datetime-local" />
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
              <Button type="submit" className="w-full sm:w-auto">Creer l&apos;article</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
