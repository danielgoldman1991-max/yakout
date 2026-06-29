import Link from "next/link";
import { getDashboardApartments } from "@/lib/data";
import { deleteApartmentAction } from "@/lib/data/actions";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";

export default async function DashboardApartmentsPage() {
  const apartments = await getDashboardApartments();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Appartements</p>
          <h1 className="mt-2 text-3xl font-semibold">Appartements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Gestion interne et publication site: photos, prix, SEO, visibilite et rentabilite.
          </p>
        </div>
        <Link href="/dashboard/apartments/new">
          <Button>Nouvel appartement</Button>
        </Link>
      </div>
      {apartments.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun appartement.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom interne</th>
                  <th className="px-4 py-3 font-medium">Nom public</th>
                  <th className="px-4 py-3 font-medium">Quartier</th>
                  <th className="px-4 py-3 font-medium">Capacite</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Publication</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apartments.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3">{a.internal_name}</td>
                    <td className="px-4 py-3 font-medium">
                      <a href={`/dashboard/apartments/${a.id}`} className="hover:text-primary hover:underline">{a.public_name}</a>
                    </td>
                    <td className="px-4 py-3">{a.district}</td>
                    <td className="px-4 py-3">{a.capacity}</td>
                    <td className="px-4 py-3">{formatCurrency(a.price_from)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.is_published ? "Publie" : "Brouillon"} /></td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteApartmentAction.bind(null, a.id)}>
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
