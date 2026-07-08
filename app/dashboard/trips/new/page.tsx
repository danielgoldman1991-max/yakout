import type { ReactNode } from "react";
import { createTripAction } from "@/lib/data/actions";
import { getPackages, getTransportPartners, getTransportVehicles } from "@/lib/data/transport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ vehicle_id?: string; package_id?: string }> }) {
  const [{ vehicle_id, package_id }, vehicles, partners, packages] = await Promise.all([searchParams, getTransportVehicles(), getTransportPartners(), getPackages()]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Trajets / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau trajet ou circuit</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Operation terrain</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form action={createTripAction} className="grid gap-4 md:grid-cols-2">
            <Field label="Titre *"><Input name="title" required placeholder="Circuit Ourika prive" /></Field>
            <Field label="Type">
              <select name="trip_type" defaultValue="circuit_ourika" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm">
                <option value="circuit_agafay">Circuit Agafay</option>
                <option value="circuit_ourika">Circuit Ourika</option>
                <option value="circuit_essaouira">Circuit Essaouira</option>
                <option value="circuit_ouzoud">Circuit Ouzoud</option>
                <option value="circuit_imlil">Circuit Imlil</option>
                <option value="marrakech">Marrakech</option>
                <option value="custom">Trajet personnalise</option>
                <option value="disposition">Mise a disposition</option>
              </select>
            </Field>
            <Field label="Vehicule"><select name="vehicle_id" defaultValue={vehicle_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}</select></Field>
            <Field label="Partenaire"><select name="partner_id" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Pack lie"><select name="package_id" defaultValue={package_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.public_title ?? p.title}</option>)}</select></Field>
            <DateField id="trip_date" name="trip_date" label="Date" required />
            <Field label="Heure debut"><Input name="start_time" type="time" /></Field>
            <Field label="Heure fin"><Input name="end_time" type="time" /></Field>
            <Field label="Depart *"><Input name="departure" required placeholder="Marrakech" /></Field>
            <Field label="Destination *"><Input name="destination" required placeholder="Ourika" /></Field>
            <Field label="Passagers"><Input name="passengers_count" type="number" min="1" defaultValue="1" /></Field>
            <Field label="Statut"><select name="status" defaultValue="planned" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="planned">Planifie</option><option value="confirmed">Confirme</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="completed">Termine</option><option value="cancelled">Annule</option></select></Field>
            <Field label="Montant client"><Input name="amount" type="number" min="0" defaultValue="0" /></Field>
            <Field label="Cout partenaire"><Input name="cost_amount" type="number" min="0" defaultValue="0" /></Field>
            <div className="md:col-span-2"><Field label="Itineraire"><Textarea name="itinerary" rows={4} /></Field></div>
            <div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" rows={3} /></Field></div>
            <Button type="submit" className="md:col-span-2 w-full sm:w-auto">Creer le trajet</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}
