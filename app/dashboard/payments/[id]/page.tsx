import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getApartmentsForSelect, getClients, getDocuments, getPaymentById, getReservationsForSelect, getVehicles, getPartners } from "@/lib/data";
import { getTransportTrips, getTransfers, getPackages } from "@/lib/data/transport";
import { updatePaymentAction, deletePaymentAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

const statusTone: Record<string, "warning" | "info" | "success" | "ruby" | "muted"> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  failed: "ruby",
  refunded: "muted",
  cancelled: "muted",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  partial: "Partiel",
  paid: "Paye",
  failed: "Echec",
  refunded: "Rembourse",
  cancelled: "Annule",
};

const typeLabels: Record<string, string> = {
  accommodation: "Hebergement",
  transport: "Transport",
  service: "Service",
  owner_payout: "Reversement proprietaire",
  other: "Autre",
};

const partLabels: Record<string, string> = {
  deposit: "Acompte",
  balance: "Solde",
  full: "Paiement complet",
  adjustment: "Ajustement",
};

export default async function PaymentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  const [clients, apartments, reservations, documents, vehicles, partners, trips, transfers, packages] = await Promise.all([
    getClients(),
    getApartmentsForSelect(),
    getReservationsForSelect(),
    getDocuments({ relatedType: "payment", relatedId: id }),
    getVehicles(),
    getPartners(),
    getTransportTrips().catch(() => []),
    getTransfers().catch(() => []),
    getPackages().catch(() => []),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Paiements / {payment.title ?? payment.client_name ?? "Detail"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{payment.title ?? payment.client_name ?? "Paiement"}</h1>
          <Badge tone={statusTone[payment.status] ?? "default"}>{statusLabels[payment.status] ?? payment.status}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Montant" value={formatCurrency(payment.amount)} />
        <Metric title="Type" value={typeLabels[payment.payment_type ?? "other"] ?? payment.payment_type ?? "Autre"} />
        <Metric title="Paiement" value={payment.payment_part ? partLabels[payment.payment_part] ?? payment.payment_part : "Non precise"} />
        <Metric title="Date" value={formatDate(payment.paid_at)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Modifier le paiement</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updatePaymentAction.bind(null, id)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Titre</label>
                <Input name="title" defaultValue={payment.title ?? ""} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="client_id" label="Client" defaultValue={payment.client_id ?? ""}>
                  <option value="">Selectionner un client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </SelectField>
                <SelectField name="apartment_id" label="Appartement lie" defaultValue={payment.apartment_id ?? ""}>
                  <option value="">Aucun appartement</option>
                  {apartments.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="reservation_id" label="Reservation liee" defaultValue={payment.reservation_id ?? ""}>
                  <option value="">Aucune reservation</option>
                  {reservations.map((r) => <option key={r.id} value={r.id}>{r.label} - {r.description}</option>)}
                </SelectField>
                <SelectField name="source" label="Source" defaultValue={payment.source ?? ""}>
                  <option value="">Non precise</option>
                  <option value="website">Site Yakout</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking</option>
                  <option value="direct">Direct</option>
                  <option value="partner">Partenaire</option>
                  <option value="other">Autre</option>
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="vehicle_id" label="Véhicule lié" defaultValue={payment.vehicle_id ?? ""}>
                  <option value="">Aucun</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}
                </SelectField>
                <SelectField name="partner_id" label="Partenaire lié" defaultValue={payment.partner_id ?? ""}>
                  <option value="">Aucun</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ""}</option>)}
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField name="trip_id" label="Trajet lié" defaultValue={payment.trip_id ?? ""}>
                  <option value="">Aucun</option>
                  {trips.map((t) => <option key={t.id} value={t.id}>{t.title ?? t.destination ?? "Trajet"}</option>)}
                </SelectField>
                <SelectField name="transfer_id" label="Transfert lié" defaultValue={payment.transfer_id ?? ""}>
                  <option value="">Aucun</option>
                  {transfers.map((t) => <option key={t.id} value={t.id}>{t.transfer_type ?? t.pickup_location ?? "Transfert"}</option>)}
                </SelectField>
                <SelectField name="package_id" label="Pack lié" defaultValue={payment.package_id ?? ""}>
                  <option value="">Aucun</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.title ?? "Pack"}</option>)}
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Montant (DH) *</label>
                  <Input name="amount" type="number" min="0.01" step="0.01" defaultValue={payment.amount} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date paiement *</label>
                  <Input name="paid_at" type="date" defaultValue={payment.paid_at} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Devise</label>
                  <Input name="currency" defaultValue={payment.currency ?? "MAD"} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField name="payment_type" label="Type" defaultValue={payment.payment_type ?? "other"}>
                  <option value="accommodation">Hebergement</option>
                  <option value="transport">Transport</option>
                  <option value="service">Service</option>
                  <option value="owner_payout">Reversement proprietaire</option>
                  <option value="other">Autre</option>
                </SelectField>
                <SelectField name="payment_part" label="Part" defaultValue={payment.payment_part ?? ""}>
                  <option value="">Non precise</option>
                  <option value="deposit">Acompte</option>
                  <option value="balance">Solde</option>
                  <option value="full">Paiement complet</option>
                  <option value="adjustment">Ajustement</option>
                </SelectField>
                <SelectField name="payment_method" label="Methode" defaultValue={payment.payment_method}>
                  <option value="cash">Especes</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="card">Carte</option>
                  <option value="online">En ligne</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Autre</option>
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <input type="hidden" name="activity_type" value={payment.payment_type === "accommodation" ? "apartment" : payment.activity_type ?? "other"} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="status" defaultValue={payment.status} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
                    <option value="pending">En attente</option>
                    <option value="partial">Partiel</option>
                    <option value="paid">Paye</option>
                    <option value="failed">Echec</option>
                    <option value="refunded">Rembourse</option>
                    <option value="cancelled">Annule</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Arrivee</label>
                  <Input name="stay_check_in" type="date" defaultValue={payment.stay_check_in ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Depart</label>
                  <Input name="stay_check_out" type="date" defaultValue={payment.stay_check_out ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Voyageurs</label>
                  <Input name="guests_count" type="number" min="1" defaultValue={payment.guests_count ?? ""} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea name="notes" defaultValue={payment.notes ?? ""} />
              </div>

              <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Documents & justificatifs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/documents/new?type=payment_receipt&paymentId=${id}${payment.apartment_id ? `&apartmentId=${payment.apartment_id}` : ""}${payment.client_id ? `&clientId=${payment.client_id}` : ""}`}>
                <Button variant="secondary">Ajouter recu / preuve paiement</Button>
              </Link>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun justificatif lie a ce paiement.</p>
              ) : (
                documents.map((doc) => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="block rounded-sm border border-border/60 p-3 text-sm hover:border-gold/40">
                    <p className="font-medium">{doc.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.type} · {formatDate(doc.created_at)}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {payment.apartment_id && <Link href={`/dashboard/apartments/${payment.apartment_id}`}><Button variant="secondary" className="w-full">Voir appartement lie</Button></Link>}
              {payment.reservation_id && <Link href={`/dashboard/reservations/${payment.reservation_id}`}><Button variant="secondary" className="w-full">Voir reservation liee</Button></Link>}
              {payment.vehicle_id && <Link href={`/dashboard/vehicles/${payment.vehicle_id}`}><Button variant="secondary" className="w-full">Voir véhicule lié</Button></Link>}
              {payment.partner_id && <Link href={`/dashboard/partners/${payment.partner_id}`}><Button variant="secondary" className="w-full">Voir partenaire lié</Button></Link>}
              {payment.trip_id && <Link href={`/dashboard/trips/${payment.trip_id}`}><Button variant="secondary" className="w-full">Voir trajet lié</Button></Link>}
              {payment.transfer_id && <Link href={`/dashboard/transfers/${payment.transfer_id}`}><Button variant="secondary" className="w-full">Voir transfert lié</Button></Link>}
              {payment.package_id && <Link href={`/dashboard/packages/${payment.package_id}`}><Button variant="secondary" className="w-full">Voir pack lié</Button></Link>}
              <form action={deletePaymentAction.bind(null, id)}>
                <Button type="submit" variant="danger" className="w-full">Supprimer ce paiement</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-xl font-semibold">{value}</p></CardContent>
    </Card>
  );
}

function SelectField({ name, label, defaultValue, children }: { name: string; label: string; defaultValue?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select name={name} defaultValue={defaultValue} className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
        {children}
      </select>
    </div>
  );
}
