import { notFound } from "next/navigation";
import { getExpenseById, getApartments, getVehicles, getPartners } from "@/lib/data";
import { getTransportTrips, getTransfers, getPackages } from "@/lib/data/transport";
import { updateExpenseAction, deleteExpenseAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

const CATEGORIES = [
  { value: "cleaning", label: "Ménage" },
  { value: "laundry", label: "Blanchisserie" },
  { value: "maintenance", label: "Maintenance" },
  { value: "repair", label: "Réparation" },
  { value: "fuel", label: "Carburant" },
  { value: "parking", label: "Parking" },
  { value: "toll", label: "Péage" },
  { value: "driver", label: "Chauffeur" },
  { value: "partner_vehicle", label: "Véhicule partenaire" },
  { value: "commission", label: "Commission" },
  { value: "shopping", label: "Courses" },
  { value: "marketing", label: "Marketing" },
  { value: "software", label: "Logiciels" },
  { value: "admin", label: "Administratif" },
  { value: "other", label: "Autre" },
];

const STATUSES = [
  { value: "paid", label: "Payée" },
  { value: "pending", label: "En attente" },
  { value: "cancelled", label: "Annulée" },
  { value: "reimbursable", label: "À refacturer" },
];

const ACTIVITY_TYPES = [
  { value: "Appartement", label: "Appartement" },
  { value: "Transport", label: "Transport" },
  { value: "Service", label: "Service" },
  { value: "Autre", label: "Autre" },
];

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

export default async function ExpenseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, apartments, vehicles, partners] = await Promise.all([
    getExpenseById(id),
    getApartments(),
    getVehicles(),
    getPartners(),
  ]);
  const trips = await getTransportTrips().catch(() => []);
  const transfers = await getTransfers().catch(() => []);
  const packages = await getPackages().catch(() => []);
  if (!expense) notFound();

  const categoryLabel = CATEGORY_LABELS[expense.category] ?? expense.category;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Dépenses / {categoryLabel}</p>
        <h1 className="mt-2 text-3xl font-semibold">{categoryLabel}</h1>
        <div className="mt-2 flex items-center gap-3">
          <Badge>{categoryLabel}</Badge>
          <span className="text-lg font-semibold">{formatCurrency(expense.amount)}</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier la dépense</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateExpenseAction.bind(null, id)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Titre</label>
                <Input name="title" defaultValue={expense.title ?? ""} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <Input name="expense_date" type="date" defaultValue={expense.expense_date} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                  <Input name="amount" type="number" min="0" defaultValue={expense.amount || 0} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Catégorie *</label>
                  <select
                    name="category"
                    required
                    defaultValue={expense.category}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select
                    name="expense_status"
                    defaultValue={expense.expense_status ?? "paid"}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type d&apos;activité</label>
                  <select
                    name="activity_type"
                    defaultValue={expense.activity_type ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Sélectionner...</option>
                    {ACTIVITY_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fournisseur</label>
                  <Input name="supplier_name" defaultValue={expense.supplier_name ?? ""} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un appartement</label>
                  <select
                    name="apartment_id"
                    defaultValue={expense.apartment_id ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {apartments.map((a) => (
                      <option key={a.id} value={a.id}>{a.internal_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un véhicule</label>
                  <select
                    name="vehicle_id"
                    defaultValue={expense.vehicle_id ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.public_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Lié à un partenaire</label>
                <select
                  name="partner_id"
                  defaultValue={expense.partner_id ?? ""}
                  className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Aucun</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un voyage</label>
                  <select
                    name="trip_id"
                    defaultValue={expense.trip_id ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.title ?? t.destination}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un transfert</label>
                  <select
                    name="transfer_id"
                    defaultValue={expense.transfer_id ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {transfers.map((t) => (
                      <option key={t.id} value={t.id}>{t.pickup_location ?? ""} → {t.dropoff_location ?? ""}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un forfait</label>
                  <select
                    name="package_id"
                    defaultValue={expense.package_id ?? ""}
                    className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.public_title ?? p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea name="notes" defaultValue={expense.notes ?? ""} />
              </div>

              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deleteExpenseAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer cette dépense</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
