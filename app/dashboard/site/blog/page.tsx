import Link from "next/link";
import { getBlogPosts } from "@/lib/data";
import { deleteBlogPostAction } from "@/lib/data/actions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";

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
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun article.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Categorie</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Publication</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t">
                    <td className="px-4 py-3 font-medium"><a href={`/dashboard/site/blog/${post.id}`} className="hover:text-primary hover:underline">{post.title}</a></td>
                    <td className="px-4 py-3">{post.category}</td>
                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                    <td className="px-4 py-3">{post.published_at ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteBlogPostAction.bind(null, post.id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300 underline">Supprimer</button>
                      </form>
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
