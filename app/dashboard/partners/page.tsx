import Link from "next/link";
import { getPartners } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Partenaires</p>
          <h1 className="mt-2 text-3xl font-semibold">Partenaires</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Proprietaires, chauffeurs, loueurs et prestataires.</p>
        </div>
        <Link href="/dashboard/partners/new">
          <Button>Nouveau partenaire</Button>
        </Link>
      </div>
      {partners.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucun partenaire.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Telephone</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <a href={`/dashboard/partners/${p.id}`} className="hover:text-primary hover:underline">{p.name}</a>
                    </td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3">{p.phone ?? "-"}</td>
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
