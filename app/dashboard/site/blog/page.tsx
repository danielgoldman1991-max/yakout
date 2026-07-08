import Link from "next/link";
import { getBlogPosts } from "@/lib/data";
import { deleteBlogPostAction, toggleBlogPostStatusAction } from "@/lib/data/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlogDeleteButton } from "@/components/dashboard/blog-delete-button";
import { Eye, EyeOff, Archive, ExternalLink } from "lucide-react";
import { formatDateFr } from "@/lib/dates";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publie",
  archived: "Archive",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  published: "bg-green-500/15 text-green-400 border-green-500/25",
  archived: "bg-muted-foreground/15 text-muted-foreground border-border",
};

export default async function BlogDashboardPage() {
  const posts = await getBlogPosts();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Blog</p>
          <h1 className="mt-2 text-3xl font-semibold">Blog</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Creer, modifier et publier les articles de blog.</p>
        </div>
        <Link href="/dashboard/site/blog/new">
          <Button>Nouvel article</Button>
        </Link>
      </div>
      {posts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucun article pour le moment. Créez votre premier article Yakout.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Categorie</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Publication</th>
                  <th className="px-4 py-3 font-medium">Modification</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/site/blog/${post.id}`} className="hover:text-gold hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{post.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[post.status] || statusColors.draft}`}>
                        {statusLabels[post.status] || post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.published_at ? formatDateFr(post.published_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateFr(post.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-gold"
                            title="Voir sur le site"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/site/blog/${post.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-gold"
                          title="Modifier"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        {post.status === "published" ? (
                          <form action={toggleBlogPostStatusAction.bind(null, post.id, "draft")}>
                            <button
                              type="submit"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-yellow-400"
                              title="Mettre en brouillon"
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          </form>
                        ) : (
                          <form action={toggleBlogPostStatusAction.bind(null, post.id, "published")}>
                            <button
                              type="submit"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-green-400"
                              title="Publier"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </form>
                        )}
                        {post.status !== "archived" && (
                          <form action={toggleBlogPostStatusAction.bind(null, post.id, "archived")}>
                            <button
                              type="submit"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-orange-400"
                              title="Archiver"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          </form>
                        )}
                        <BlogDeleteButton action={deleteBlogPostAction.bind(null, post.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
