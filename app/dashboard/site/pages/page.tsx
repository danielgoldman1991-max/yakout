import Link from "next/link";
import { getSitePages } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";

export default async function SitePagesDashboardPage() {
  const pages = await getSitePages();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Pages du site</p>
          <h1 className="mt-2 text-3xl font-semibold">Pages du site</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Modifier les titres, sous-titres, contenus, boutons et SEO des pages publiques.</p>
        </div>
        <Link href="/dashboard/site/pages/new">
          <Button>Nouvelle page</Button>
        </Link>
      </div>
      {pages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucune page.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Meta title</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium"><a href={`/dashboard/site/pages/${p.id}`} className="hover:text-primary hover:underline">{p.title}</a></td>
                    <td className="px-4 py-3">{p.slug}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.meta_title ?? "-"}</td>
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
