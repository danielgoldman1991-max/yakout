import { createExpenseAction } from "@/lib/data/actions";
import { getApartments, getVehicles, getPartners } from "@/lib/data";
import { getTransportTrips, getTransfers, getPackages } from "@/lib/data/transport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewExpensePage({ searchParams }: { searchParams?: Promise<{ apartmentId?: string; partnerId?: string; tripId?: string; transferId?: string; packageId?: string }> }) {
  const params = await searchParams;
  const defaultApartmentId = params?.apartmentId && uuidRegex.test(params.apartmentId) ? params.apartmentId : "";
  const defaultPartnerId = params?.partnerId && uuidRegex.test(params.partnerId) ? params.partnerId : "";
  const defaultTripId = params?.tripId && uuidRegex.test(params.tripId) ? params.tripId : "";
  const defaultTransferId = params?.transferId && uuidRegex.test(params.transferId) ? params.transferId : "";
  const defaultPackageId = params?.packageId && uuidRegex.test(params.packageId) ? params.packageId : "";
  const [apartments, vehicles, partners] = await Promise.all([
    getApartments(),
    getVehicles(),
    getPartners(),
  ]);
  const trips = await getTransportTrips().catch(() => []);
  const transfers = await getTransfers().catch(() => []);
  const packages = await getPackages().catch(() => []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Dépenses / Nouvelle</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvelle dépense</h1>
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createExpenseAction} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Titre</label>
              <Input name="title" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField id="expense_date" name="expense_date" label="Date" required />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                <Input name="amount" type="number" min="0" defaultValue="0" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Catégorie *</label>
                <select
                  name="category"
                  required
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
                <Input name="supplier_name" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Lié à un appartement</label>
                <select
                  name="apartment_id"
                  defaultValue={defaultApartmentId}
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
                defaultValue={defaultPartnerId}
                className="w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Aucun</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ""}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Lié à un voyage</label>
                <select
                  name="trip_id"
                  defaultValue={defaultTripId}
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
                  defaultValue={defaultTransferId}
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
                  defaultValue={defaultPackageId}
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
              <Textarea name="notes" />
            </div>

            <Button type="submit" className="w-full sm:w-auto">Créer la dépense</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
