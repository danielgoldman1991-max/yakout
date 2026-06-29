import Link from "next/link";
import { getServices } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ServicesDashboardPage() {
  const services = await getServices();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Services du site</p>
          <h1 className="mt-2 text-3xl font-semibold">Services du site</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Services publies, ordre d&apos;affichage et prix.</p>
        </div>
        <Link href="/dashboard/site/services/new">
          <Button>Nouveau service</Button>
        </Link>
      </div>
      {services.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun service.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Ordre</th>
                  <th className="px-4 py-3 font-medium">Publie</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium"><a href={`/dashboard/site/services/${s.id}`} className="hover:text-primary hover:underline">{s.title}</a></td>
                    <td className="px-4 py-3">{s.slug}</td>
                    <td className="px-4 py-3">{s.price_from ? formatCurrency(s.price_from) : "Sur devis"}</td>
                    <td className="px-4 py-3">{s.display_order}</td>
                    <td className="px-4 py-3">{s.is_published ? "Oui" : "Non"}</td>
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
