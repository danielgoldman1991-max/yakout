import Link from "next/link";
import { getVehicles } from "@/lib/data";
import { deleteVehicleAction } from "@/lib/data/actions";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";

export default async function DashboardVehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Vehicules</p>
          <h1 className="mt-2 text-3xl font-semibold">Vehicules</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Vehicule Yakout ou partenaire, publication site, photos et trajets lies.
          </p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button>Nouveau vehicule</Button>
        </Link>
      </div>
      {vehicles.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun vehicule.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom interne</th>
                  <th className="px-4 py-3 font-medium">Nom public</th>
                  <th className="px-4 py-3 font-medium">Marque</th>
                  <th className="px-4 py-3 font-medium">Modele</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Publication</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-3">{v.internal_name}</td>
                    <td className="px-4 py-3 font-medium">
                      <a href={`/dashboard/vehicles/${v.id}`} className="hover:text-primary hover:underline">{v.public_name}</a>
                    </td>
                    <td className="px-4 py-3">{v.brand}</td>
                    <td className="px-4 py-3">{v.model}</td>
                    <td className="px-4 py-3">{formatCurrency(v.price_from)}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.is_published ? "Publie" : "Brouillon"} /></td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteVehicleAction.bind(null, v.id)}>
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
