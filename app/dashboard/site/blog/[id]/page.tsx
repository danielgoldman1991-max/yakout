import { notFound } from "next/navigation";
import { getBlogPostById } from "@/lib/data";
import { updateBlogPostAction, deleteBlogPostAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export default async function BlogPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Blog / {post.title}</p>
        <h1 className="mt-2 text-3xl font-semibold">{post.title}</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier l&apos;article</CardTitle></CardHeader>
          <CardContent>
            <form action={updateBlogPostAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                  <Input name="title" defaultValue={post.title} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                  <Input name="slug" defaultValue={post.slug} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Categorie *</label>
                  <Input name="category" defaultValue={post.category} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="status" defaultValue={post.status} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publie</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Extrait *</label>
                <Textarea name="excerpt" defaultValue={post.excerpt} rows={2} required />
              </div>
              <ImageUploadField
                label="Image de couverture"
                folder="blog"
                name="cover_image_url"
                altName="cover_image_alt"
                defaultUrl={post.cover_image_url}
                defaultAlt={post.cover_image_alt}
                helperText="Remplace l'image affichee dans /blog et /blog/[slug]."
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Contenu *</label>
                <Textarea name="content" defaultValue={post.content} rows={8} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date de publication</label>
                <Input name="published_at" type="datetime-local" defaultValue={post.published_at?.slice(0, 16) ?? ""} />
              </div>
              <details className="rounded-sm border border-border/50 bg-accent/10">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground">SEO (optionnel)</summary>
                <div className="space-y-3 border-t border-border/50 p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta title</label>
                    <Input name="meta_title" defaultValue={post.meta_title ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Meta description</label>
                    <Textarea name="meta_description" defaultValue={post.meta_description ?? ""} rows={2} />
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
            <form action={deleteBlogPostAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cet article</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
