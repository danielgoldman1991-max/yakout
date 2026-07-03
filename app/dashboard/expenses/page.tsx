import Link from "next/link";
import { getExpenses, getApartments, getVehicles, getPartners } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteExpenseAction } from "@/lib/data/actions";

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Ménage",
  laundry: "Blanchisserie",
  maintenance: "Maintenance",
  repair: "Réparation",
  fuel: "Carburant",
  parking: "Parking",
  toll: "Péage",
  driver: "Chauffeur",
  partner_vehicle: "Véhicule partenaire",
  commission: "Commission",
  shopping: "Courses",
  marketing: "Marketing",
  software: "Logiciels",
  admin: "Administratif",
  other: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  cancelled: "Annulée",
  reimbursable: "À refacturer",
};

const STATUS_TONES: Record<string, "warning" | "success" | "muted" | "info"> = {
  pending: "warning",
  paid: "success",
  cancelled: "muted",
  reimbursable: "info",
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

function statusBadge(status: string | undefined) {
  const label = STATUS_LABELS[status ?? ""] ?? status ?? "—";
  const tone = STATUS_TONES[status ?? ""] ?? "default";
  return <Badge tone={tone}>{label}</Badge>;
}

export default async function ExpensesPage() {
  const [expenses, apartments, vehicles, partners] = await Promise.all([
    getExpenses(),
    getApartments(),
    getVehicles(),
    getPartners(),
  ]);

  const apartmentMap = new Map(apartments.map((a) => [a.id, a.internal_name]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.public_name]));
  const partnerMap = new Map(partners.map((p) => [p.id, p.name]));

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.expense_status === "pending").length;
  const paidCount = expenses.filter((e) => e.expense_status === "paid").length;
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  function linkedTo(e: (typeof expenses)[number]) {
    if (e.apartment_id) return `Appartement ${apartmentMap.get(e.apartment_id) ?? ""}`;
    if (e.vehicle_id) return `Véhicule ${vehicleMap.get(e.vehicle_id) ?? ""}`;
    if (e.partner_id) return partnerMap.get(e.partner_id) ?? "";
    return "—";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Dépenses</p>
          <h1 className="mt-2 text-3xl font-semibold">Dépenses</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Ménage, maintenance, carburant, commissions et frais.
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>Nouvelle dépense</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Dépenses du mois</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatCurrency(monthTotal)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{pendingCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Payées</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{paidCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total général</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatCurrency(grandTotal)}</p></CardContent>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucune dépense.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Lié à</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3 font-medium">{e.title || categoryLabel(e.category)}</td>
                    <td className="px-4 py-3"><Badge>{categoryLabel(e.category)}</Badge></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3">{statusBadge(e.expense_status)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{linkedTo(e)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/expenses/${e.id}`} className="text-xs text-primary hover:underline">Voir</Link>
                        <form action={deleteExpenseAction.bind(null, e.id)}>
                          <button type="submit" className="text-xs text-ruby hover:underline">Supprimer</button>
                        </form>
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
