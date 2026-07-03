import { createPaymentAction } from "@/lib/data/actions";
import {
  getApartmentsForSelect,
  getClientsForSelect,
  getDashboardApartmentById,
  getReservationById,
  getReservationsForSelect,
  getVehicles,
  getPartners,
} from "@/lib/data";
import { getTransportTrips, getTransfers, getPackages } from "@/lib/data/transport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; apartmentId?: string; reservationId?: string; vehicleId?: string; partnerId?: string; tripId?: string; transferId?: string; packageId?: string; error?: string }>;
}) {
  const params = await searchParams;
  const isAccommodation = params?.type === "accommodation";
  const reservationId = params?.reservationId && uuidRegex.test(params.reservationId) ? params.reservationId : undefined;
  const reservation = reservationId ? await getReservationById(reservationId) : null;
  const apartmentIdFromQuery = params?.apartmentId && uuidRegex.test(params.apartmentId) ? params.apartmentId : undefined;
  const defaultApartmentId = reservation?.apartment_id ?? apartmentIdFromQuery ?? "";
  const defaultClientId = reservation?.client_id ?? "";
  const apartment = defaultApartmentId ? await getDashboardApartmentById(defaultApartmentId) : null;
  const defaultVehicleId = params?.vehicleId && uuidRegex.test(params.vehicleId) ? params.vehicleId : "";
  const defaultPartnerId = params?.partnerId && uuidRegex.test(params.partnerId) ? params.partnerId : "";

  const [apartments, clients, reservations, vehicles, partners, trips, transfers, packages] = await Promise.all([
    getApartmentsForSelect(),
    getClientsForSelect(),
    getReservationsForSelect(),
    getVehicles(),
    getPartners(),
    getTransportTrips().catch(() => []),
    getTransfers().catch(() => []),
    getPackages().catch(() => []),
  ]);

  const defaultTotal = reservation?.total_amount ?? 0;
  const defaultPaid = reservation?.deposit_amount ?? 0;
  const remaining = Math.max(0, Number(defaultTotal) - Number(defaultPaid));
  const redirectTo = `/dashboard/payments/new${isAccommodation ? "?type=accommodation" : ""}${defaultApartmentId ? `${isAccommodation ? "&" : "?"}apartmentId=${defaultApartmentId}` : ""}`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Paiements / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">{isAccommodation ? "Nouvelle recette d'hebergement" : "Nouveau paiement"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {isAccommodation
            ? "Saisir un encaissement de sejour et le relier a un appartement, une reservation et un proprietaire."
            : "Enregistrer un encaissement client Yakout."}
        </p>
      </div>
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{isAccommodation ? "Recette d'hebergement" : "Informations du paiement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createPaymentAction} className="space-y-6">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <input type="hidden" name="owner_id" value={apartment?.owner_id ?? ""} />
            <input type="hidden" name="activity_type" value={isAccommodation ? "apartment" : "other"} />

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sejour</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Titre</label>
                  <Input name="title" defaultValue={isAccommodation ? "Recette hebergement" : ""} placeholder="Ex: Acompte sejour Majorelle" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select name="payment_type" defaultValue={isAccommodation ? "accommodation" : "other"} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="accommodation">Hebergement</option>
                    <option value="transport">Transport</option>
                    <option value="service">Service</option>
                    <option value="owner_payout">Reversement proprietaire</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Appartement lie {isAccommodation ? "*" : ""}</label>
                  <select name="apartment_id" defaultValue={defaultApartmentId} required={isAccommodation} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Selectionner un appartement</option>
                    {apartments.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Client lie</label>
                  <select name="client_id" defaultValue={defaultClientId} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Selectionner un client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Reservation existante</label>
                  <select name="reservation_id" defaultValue={reservationId ?? ""} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucune reservation existante</option>
                    {reservations.map((r) => <option key={r.id} value={r.id}>{r.label} - {r.description}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Source reservation</label>
                  <select name="source" defaultValue="whatsapp" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="website">Site Yakout</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking">Booking</option>
                    <option value="direct">Direct</option>
                    <option value="partner">Partenaire</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Arrivee</label>
                  <Input name="stay_check_in" type="date" defaultValue={reservation?.check_in ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Depart</label>
                  <Input name="stay_check_out" type="date" defaultValue={reservation?.check_out ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Voyageurs</label>
                  <Input name="guests_count" type="number" min="1" defaultValue={reservation?.guests_count ?? reservation?.people_count ?? 1} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Total sejour</label>
                  <Input name="total_amount" type="number" min="0" step="0.01" defaultValue={defaultTotal || ""} />
                </div>
              </div>

              {isAccommodation && !reservationId && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="create_reservation" defaultChecked />
                  Creer aussi une reservation liee si les dates sont renseignees
                </label>
              )}
            </section>

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transport & Trajets</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un véhicule</label>
                  <select name="vehicle_id" defaultValue={defaultVehicleId} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucun</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un partenaire</label>
                  <select name="partner_id" defaultValue={defaultPartnerId} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucun</option>
                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ""}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un trajet</label>
                  <select name="trip_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucun</option>
                    {trips.map((t) => <option key={t.id} value={t.id}>{t.title ?? t.destination ?? "Trajet"}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un transfert</label>
                  <select name="transfer_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucun</option>
                    {transfers.map((t) => <option key={t.id} value={t.id}>{t.transfer_type ?? t.pickup_location ?? "Transfert"}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à un pack</label>
                  <select name="package_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="">Aucun</option>
                    {packages.map((p) => <option key={p.id} value={p.id}>{p.title ?? "Pack"}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant encaisse *</label>
                  <Input name="amount" type="number" min="0.01" step="0.01" defaultValue={remaining || defaultPaid || ""} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Paiement</label>
                  <select name="payment_part" defaultValue={remaining ? "balance" : "deposit"} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="deposit">Acompte</option>
                    <option value="balance">Solde</option>
                    <option value="full">Paiement complet</option>
                    <option value="adjustment">Ajustement</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Devise</label>
                  <Input name="currency" defaultValue="MAD" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Methode *</label>
                  <select name="payment_method" required className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="cash">Especes</option>
                    <option value="bank_transfer">Virement</option>
                    <option value="card">Carte</option>
                    <option value="online">En ligne</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date paiement *</label>
                  <Input name="paid_at" type="date" defaultValue={today()} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="status" defaultValue="paid" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="pending">En attente</option>
                    <option value="partial">Partiel</option>
                    <option value="paid">Paye</option>
                    <option value="cancelled">Annule</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
              <Textarea name="notes" placeholder="Notes internes, reference plateforme, informations client..." />
            </section>

            <Button type="submit" className="w-full sm:w-auto">
              {isAccommodation ? "Enregistrer la recette" : "Creer le paiement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
