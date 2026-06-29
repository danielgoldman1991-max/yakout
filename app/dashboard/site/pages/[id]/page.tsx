import { notFound } from "next/navigation";
import { getSitePageById } from "@/lib/data";
import { updateSitePageAction, deleteSitePageAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export default async function SitePageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getSitePageById(id);
  if (!page) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Pages du site / {page.title}</p>
        <h1 className="mt-2 text-3xl font-semibold">{page.title}</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier la page</CardTitle></CardHeader>
          <CardContent>
            <form action={updateSitePageAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                  <Input name="title" defaultValue={page.title} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug</label>
                  <Input name="slug" defaultValue={page.slug} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sous-titre</label>
                <Input name="subtitle" defaultValue={page.subtitle ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Contenu *</label>
                <Textarea name="content" defaultValue={page.content} rows={8} required />
              </div>
              <ImageUploadField
                label="Image hero"
                folder="pages"
                name="cover_image_url"
                altName="cover_image_alt"
                defaultUrl={page.cover_image_url}
                defaultAlt={page.cover_image_alt}
                helperText="Image principale de la page publique."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Bouton principal</label>
                  <Input name="primary_button_text" defaultValue={page.primary_button_text ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">URL bouton principal</label>
                  <Input name="primary_button_url" defaultValue={page.primary_button_url ?? ""} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                  <Input name="meta_title" defaultValue={page.meta_title ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                  <Input name="meta_description" defaultValue={page.meta_description ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="status" defaultValue={page.status} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publie</option>
                  </select>
                </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteSitePageAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cette page</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
