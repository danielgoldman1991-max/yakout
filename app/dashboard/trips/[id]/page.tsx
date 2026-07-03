import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getDocuments, getExpenses, getPayments } from "@/lib/data";
import { getPackages, getTransportPartners, getTransportTripById, getTransportVehicles } from "@/lib/data/transport";
import { updateTripAction, deleteTripAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function TripEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, vehicles, partners, packages, payments, expenses, documents] = await Promise.all([
    getTransportTripById(id),
    getTransportVehicles(),
    getTransportPartners(),
    getPackages(),
    getPayments(),
    getExpenses(),
    getDocuments({ relatedType: "trip", relatedId: id }),
  ]);
  if (!trip) notFound();
  const revenue = payments.filter((p) => p.trip_id === id).reduce((sum, p) => sum + Number(p.amount ?? 0), 0) || Number(trip.sold_price ?? 0);
  const cost = expenses.filter((e) => e.trip_id === id).reduce((sum, e) => sum + Number(e.amount ?? 0), 0) || Number(trip.cost_price ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Trajets / {trip.title ?? trip.destination}</p>
        <h1 className="mt-2 text-3xl font-semibold">{trip.title ?? `${trip.departure} -> ${trip.destination}`}</h1>
        <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={trip.status} /><StatusBadge status={trip.payment_status} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Marge estimee : {formatCurrency(revenue - cost)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Modifier le trajet</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateTripAction.bind(null, id)} className="grid gap-4 md:grid-cols-2">
              <Field label="Titre *"><Input name="title" defaultValue={trip.title ?? ""} required /></Field>
              <Field label="Type"><Input name="trip_type" defaultValue={trip.trip_type ?? ""} /></Field>
              <Field label="Vehicule"><select name="vehicle_id" defaultValue={trip.vehicle_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}</select></Field>
              <Field label="Partenaire"><select name="partner_id" defaultValue={trip.partner_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Pack lie"><select name="package_id" defaultValue={trip.package_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.public_title ?? p.title}</option>)}</select></Field>
              <Field label="Date *"><Input name="trip_date" type="date" defaultValue={trip.trip_date ?? ""} required /></Field>
              <Field label="Heure debut"><Input name="start_time" type="time" defaultValue={trip.start_time ?? trip.trip_time ?? ""} /></Field>
              <Field label="Heure fin"><Input name="end_time" type="time" defaultValue={trip.end_time ?? ""} /></Field>
              <Field label="Depart *"><Input name="departure" defaultValue={trip.departure ?? ""} required /></Field>
              <Field label="Destination *"><Input name="destination" defaultValue={trip.destination ?? ""} required /></Field>
              <Field label="Passagers"><Input name="passengers_count" type="number" min="1" defaultValue={trip.passengers_count ?? 1} /></Field>
              <Field label="Statut"><select name="status" defaultValue={trip.status ?? "planned"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="planned">Planifie</option><option value="confirmed">Confirme</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="completed">Termine</option><option value="cancelled">Annule</option></select></Field>
              <Field label="Montant client"><Input name="amount" type="number" min="0" defaultValue={trip.sold_price ?? 0} /></Field>
              <Field label="Cout partenaire"><Input name="cost_amount" type="number" min="0" defaultValue={trip.cost_price ?? 0} /></Field>
              <div className="md:col-span-2"><Field label="Itineraire"><Textarea name="itinerary" defaultValue={trip.itinerary ?? ""} rows={4} /></Field></div>
              <div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={trip.notes ?? ""} rows={3} /></Field></div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Finance</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Recettes: {formatCurrency(revenue)}</p><p>Depenses: {formatCurrency(cost)}</p><p className="font-medium">Marge: {formatCurrency(revenue - cost)}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Documents</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{documents.length ? documents.map((d) => <p key={d.id}>{d.title} {d.expiry_date ? `- ${formatDate(d.expiry_date)}` : ""}</p>) : <p className="text-muted-foreground">Aucun document.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent><form action={deleteTripAction.bind(null, id)}><Button type="submit" variant="danger" className="w-full">Supprimer ce trajet</Button></form></CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}
