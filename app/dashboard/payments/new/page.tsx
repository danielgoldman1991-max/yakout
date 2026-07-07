import { createPaymentAction } from "@/lib/data/actions";
import { AccommodationRevenueForm } from "@/components/dashboard/accommodation-revenue-form";
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
      {isAccommodation ? (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Recette d&apos;hebergement</CardTitle>
          </CardHeader>
          <CardContent>
            <AccommodationRevenueForm
              apartments={apartments}
              clients={clients}
              reservations={reservations}
              defaultApartmentId={defaultApartmentId}
              defaultClientId={defaultClientId}
              defaultReservationId={reservationId ?? ""}
              defaultPaid={Number(defaultPaid)}
              remaining={Number(remaining)}
              apartmentOwnerId={apartment?.owner_id ?? ""}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Informations du paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={createPaymentAction} className="space-y-6">
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <input type="hidden" name="activity_type" value="other" />

              <section className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sejour</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Titre</label>
                    <Input name="title" placeholder="Titre du paiement" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <select name="payment_type" defaultValue="other" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
                    <label className="text-xs font-medium text-muted-foreground">Appartement lie</label>
                    <select name="apartment_id" defaultValue="" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
                    <select name="reservation_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                      <option value="">Aucune reservation existante</option>
                      {reservations.map((r) => <option key={r.id} value={r.id}>{r.label} - {r.description}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Source reservation</label>
                    <select name="source" defaultValue="direct" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
              </section>

              <section className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transport & Trajets</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Lie a un vehicule</label>
                    <select name="vehicle_id" defaultValue={defaultVehicleId} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                      <option value="">Aucun</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Lie a un partenaire</label>
                    <select name="partner_id" defaultValue={defaultPartnerId} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                      <option value="">Aucun</option>
                      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ""}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Lie a un trajet</label>
                    <select name="trip_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                      <option value="">Aucun</option>
                      {trips.map((t) => <option key={t.id} value={t.id}>{t.title ?? t.destination ?? "Trajet"}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Lie a un transfert</label>
                    <select name="transfer_id" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                      <option value="">Aucun</option>
                      {transfers.map((t) => <option key={t.id} value={t.id}>{t.transfer_type ?? t.pickup_location ?? "Transfert"}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Lie a un pack</label>
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
                    <label className="text-xs font-medium text-muted-foreground">Montant *</label>
                    <Input name="amount" type="number" min="0.01" step="0.01" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Paiement</label>
                    <select name="payment_part" defaultValue="full" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
                    <select name="status" defaultValue="pending" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
                Creer le paiement
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
