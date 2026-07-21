"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBookingFromClientRequestAction, type ClientRequestBookingState } from "@/lib/data/client-request-booking-actions";
import { classifyClientRequest, clientRequestIdempotencyKey, isClientRequestActionable } from "@/lib/client-booking/request-booking";

type RequestLead = {
  id: string; request_type: string; source: string; message?: string; desired_date?: string;
  people_count?: number; estimated_budget?: number; status: string; created_at: string;
  booking_status?: string; metadata?: Record<string, unknown>;
};
type Option = { id: string; label: string };

const initialState: ClientRequestBookingState = { ok: false, message: "" };

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function numberValue(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

export function ClientRequestBookingPanel({ clientId, requests, apartments, packages }: {
  clientId: string; requests: RequestLead[]; apartments: Option[]; packages: Option[];
}) {
  const actionable = requests.filter((request) => isClientRequestActionable(request.booking_status));
  const [selectedId, setSelectedId] = useState(actionable[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createBookingFromClientRequestAction, initialState);
  const request = actionable.find((item) => item.id === selectedId) ?? actionable[0];
  const defaults = (() => {
    const metadata = request?.metadata ?? {};
    const stay = (metadata.stay as Record<string, unknown> | undefined) ?? {};
    const apartment = (metadata.apartment as Record<string, unknown> | undefined) ?? {};
    const kind = classifyClientRequest(request?.request_type ?? "general");
    return {
      kind, apartmentId: text(metadata.apartment_id) || text(apartment.id), packageId: text(metadata.package_id) || text(metadata.selected_package_id),
      checkIn: text(metadata.check_in) || text(stay.checkIn) || text(stay.check_in) || request?.desired_date || "",
      checkOut: text(metadata.check_out) || text(stay.checkOut) || text(stay.check_out),
      guests: numberValue(metadata.guests_count, numberValue(stay.adults, request?.people_count ?? 1) + numberValue(stay.children)),
      expected: metadata.estimated_total ?? request?.estimated_budget ?? "", pickup: text(metadata.pickup_location), dropoff: text(metadata.dropoff_location),
      transportDate: text(metadata.pickup_date) || text(metadata.transfer_date), flight: text(metadata.flight_number),
    };
  })();

  if (!requests.length) return null;
  return (
    <section className="rounded-sm border border-gold/25 bg-gold/5 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Demandes à traiter</h2>{actionable.length > 0 && <Badge tone="warning">Action requise</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">Créez un brouillon à partir de la demande originale, sans enregistrer de paiement.</p></div>
        <Dialog open={open && !state.ok} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!actionable.length}>Créer depuis une demande</Button></DialogTrigger>
          <DialogContent className="inset-0 left-0 top-0 h-dvh max-h-dvh max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-5 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[92vh] sm:w-[min(680px,calc(100vw-2rem))] sm:max-w-[680px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sm sm:p-6">
            <DialogHeader><DialogTitle>Créer la réservation</DialogTitle><DialogDescription>Vérifiez les informations préremplies. Le statut initial restera brouillon.</DialogDescription></DialogHeader>
            {request && <form action={action} className="mt-5 space-y-5">
              <input type="hidden" name="client_id" value={clientId} /><input type="hidden" name="idempotency_key" value={clientRequestIdempotencyKey(request.id)} />
              <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-gold">1 — Demande source</p><select name="lead_id" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm">{actionable.map((item) => <option key={item.id} value={item.id}>{item.request_type} · {item.source} · {item.id.slice(0, 8)}</option>)}</select><p className="rounded-sm bg-background/50 p-3 text-sm text-muted-foreground">{request.message || "Aucun message complémentaire."}</p></section>
              <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-gold">2 — Prestations à réserver</p><select key={`${request.id}-kind`} name="kind" defaultValue={defaults.kind} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"><option value="accommodation">Appartement</option><option value="package">Pack</option><option value="transport">Transport / transfert</option><option value="chauffeur">Chauffeur privé</option><option value="composite_stay">Séjour composite</option></select><div className="grid gap-3 sm:grid-cols-2"><select key={`${request.id}-apartment`} name="apartment_id" defaultValue={defaults.apartmentId} className="h-10 rounded-md border border-border bg-surface px-3 text-sm"><option value="">Appartement à confirmer</option>{apartments.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select key={`${request.id}-package`} name="package_id" defaultValue={defaults.packageId} className="h-10 rounded-md border border-border bg-surface px-3 text-sm"><option value="">Pack à confirmer</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><label className="flex items-center gap-2 text-sm"><input name="include_transport" type="checkbox" defaultChecked={["transport", "chauffeur"].includes(defaults.kind)} /> Inclure une réservation transport</label></section>
              <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-gold">3 — Dates et voyageurs</p><div className="grid gap-3 sm:grid-cols-3"><Input name="check_in" type="date" defaultValue={defaults.checkIn} aria-label="Arrivée" /><Input name="check_out" type="date" defaultValue={defaults.checkOut} aria-label="Départ" /><Input name="guests_count" type="number" min="1" defaultValue={defaults.guests} aria-label="Voyageurs" /></div><div className="grid gap-3 sm:grid-cols-2"><Input name="transport_date" type="date" defaultValue={defaults.transportDate} aria-label="Date transport" /><Input name="transport_time" type="time" aria-label="Heure transport" /><Input name="pickup_location" defaultValue={defaults.pickup} placeholder="Prise en charge" /><Input name="dropoff_location" defaultValue={defaults.dropoff} placeholder="Destination" /><Input name="flight_number" defaultValue={defaults.flight} placeholder="Numéro de vol" /></div></section>
              <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-gold">4 — Tarification commerciale</p><div className="grid gap-3 sm:grid-cols-[1fr_120px]"><Input name="expected_amount" type="number" min="0" step="0.01" defaultValue={String(defaults.expected)} placeholder="Tarif à confirmer" /><Input name="currency" defaultValue="MAD" maxLength={3} /></div><p className="text-xs text-muted-foreground">Aucun paiement ne sera créé.</p></section>
              <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-gold">5 — Confirmation</p>{state.message && <p aria-live="polite" className={`rounded-sm border px-3 py-2 text-sm ${state.ok ? "border-emerald-500/30 text-emerald-500" : "border-ruby/30 text-ruby"}`}>{state.message}</p>}<Button type="submit" disabled={pending} className="w-full">{pending ? "Création en cours…" : "Créer la réservation"}</Button></section>
            </form>}
          </DialogContent>
        </Dialog>
      </div>
      {state.ok && <p role="status" className="mt-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">{state.message}</p>}
      <div className="mt-4 space-y-2">{requests.map((item) => <div key={item.id} className="flex flex-col justify-between gap-2 rounded-sm border border-border/60 bg-card/70 p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{item.request_type}</p><p className="text-xs text-muted-foreground">{item.source} · {item.id.slice(0, 8)} · {item.message || "Sans message"}</p></div><Badge tone={["booked", "declined", "cancelled"].includes(item.booking_status ?? "") ? "muted" : "warning"}>{item.booking_status ?? "converted"}</Badge></div>)}</div>
    </section>
  );
}
