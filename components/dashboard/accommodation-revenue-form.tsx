"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAccommodationRevenueAction } from "@/lib/data/actions";

interface SelectOption {
  id: string;
  label: string;
}

interface ResForSelect {
  id: string;
  label: string;
  description: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AccommodationRevenueForm({
  apartments,
  clients,
  reservations,
  defaultApartmentId,
  defaultClientId,
  defaultReservationId,
  defaultPaid,
  remaining,
  apartmentOwnerId,
}: {
  apartments: SelectOption[];
  clients: SelectOption[];
  reservations: ResForSelect[];
  defaultApartmentId: string;
  defaultClientId: string;
  defaultReservationId: string;
  defaultPaid: number;
  remaining: number;
  apartmentOwnerId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    setGlobalError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createAccommodationRevenueAction(formData);

    if (result.success) {
      router.push("/dashboard/payments");
    } else {
      setPending(false);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      if (result.message) {
        setGlobalError(result.message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div className="rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {globalError}
        </div>
      )}

      <input type="hidden" name="owner_id" value={apartmentOwnerId} />
      <input type="hidden" name="activity_type" value="apartment" />
      <input type="hidden" name="payment_type" value="accommodation" />

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sejour</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Titre</label>
            <Input name="title" defaultValue="Recette hebergement" placeholder="Ex: Acompte sejour Majorelle" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <select name="payment_type" disabled className="w-full rounded-md border bg-surface px-3 py-2 text-sm opacity-60 cursor-not-allowed">
              <option value="accommodation">Hebergement</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Appartement *</label>
            <select name="apartment_id" defaultValue={defaultApartmentId} required
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="">Selectionner un appartement</option>
              {apartments.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            {fieldErrors.apartment_id && (
              <p className="text-xs text-red-400">{fieldErrors.apartment_id[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client lie</label>
            <select name="client_id" defaultValue={defaultClientId}
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="">Selectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reservation liee</label>
            <select name="reservation_id" defaultValue={defaultReservationId}
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="">Aucune reservation</option>
              {reservations.map((r) => <option key={r.id} value={r.id}>{r.label} - {r.description}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <select name="source" defaultValue="direct"
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
            <Input name="stay_check_in" type="date" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Depart</label>
            <Input name="stay_check_out" type="date" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Voyageurs</label>
            <Input name="guests_count" type="number" min="1" defaultValue="1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Total sejour</label>
            <Input name="description" placeholder="Montant total du sejour" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Montant encaisse *</label>
            <Input name="amount" type="number" min="0.01" step="0.01" defaultValue={remaining || defaultPaid || ""} required />
            {fieldErrors.amount && (
              <p className="text-xs text-red-400">{fieldErrors.amount[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type de paiement</label>
            <select name="payment_part" defaultValue={remaining ? "balance" : "deposit"}
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="deposit">Acompte</option>
              <option value="balance">Solde</option>
              <option value="full">Paiement complet</option>
              <option value="adjustment">Ajustement</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Devise</label>
            <select name="currency" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Methode de paiement</label>
            <select name="payment_method" className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
              <option value="cash">Especes</option>
              <option value="bank_transfer">Virement</option>
              <option value="card">Carte</option>
              <option value="online">En ligne</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date de paiement *</label>
            <Input name="payment_date" type="date" defaultValue={today()} required />
            {fieldErrors.payment_date && (
              <p className="text-xs text-red-400">{fieldErrors.payment_date[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <select name="status" defaultValue="paid"
              className="w-full rounded-md border bg-surface px-3 py-2 text-sm">
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
        <Textarea name="notes" placeholder="Notes internes..." />
      </section>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer la recette"}
      </Button>
    </form>
  );
}
