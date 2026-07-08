import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Textarea } from "@/components/ui/textarea";
import type { Partner, Transfer, Vehicle } from "@/types/business";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export function TransferForm({ action, transfer, vehicles, partners }: { action: (formData: FormData) => void; transfer?: Partial<Transfer>; vehicles: Pick<Vehicle, "id" | "public_name">[]; partners: Pick<Partner, "id" | "name" | "phone" | "city">[] }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Type"><select name="transfer_type" defaultValue={transfer?.transfer_type ?? "airport_arrival"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="airport_arrival">Aeroport arrivee</option><option value="airport_departure">Aeroport depart</option><option value="city_trip">Trajet ville</option><option value="half_day_driver">Chauffeur demi-journee</option><option value="full_day_driver">Chauffeur journee</option><option value="disposal">Mise a disposition</option><option value="other">Autre</option></select></Field>
      <Field label="Statut"><select name="status" defaultValue={transfer?.status ?? "pending"} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="pending">En attente</option><option value="confirmed">Confirme</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="completed">Termine</option><option value="cancelled">Annule</option></select></Field>
      <Field label="Vehicule"><select name="vehicle_id" defaultValue={transfer?.vehicle_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.public_name}</option>)}</select></Field>
      <Field label="Partenaire"><select name="partner_id" defaultValue={transfer?.partner_id ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"><option value="">Aucun</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}{p.phone ? ` · ${p.phone}` : ""}{p.city ? ` · ${p.city}` : ""}</option>)}</select></Field>
      <Field label="Chauffeur"><Input name="driver_name" defaultValue={transfer?.driver_name ?? ""} /></Field>
      <DateField id="pickup_date" name="pickup_date" label="Date" value={transfer?.pickup_date ?? null} />
      <Field label="Heure"><Input name="pickup_time" type="time" defaultValue={transfer?.pickup_time ?? ""} /></Field>
      <Field label="Vol"><Input name="flight_number" defaultValue={transfer?.flight_number ?? ""} /></Field>
      <Field label="Prise en charge"><Input name="pickup_location" defaultValue={transfer?.pickup_location ?? ""} /></Field>
      <Field label="Destination"><Input name="dropoff_location" defaultValue={transfer?.dropoff_location ?? ""} /></Field>
      <Field label="Passagers"><Input name="passengers_count" type="number" min="1" defaultValue={transfer?.passengers_count ?? 1} /></Field>
      <Field label="Bagages"><Input name="luggage_count" type="number" min="0" defaultValue={transfer?.luggage_count ?? 0} /></Field>
      <Field label="Montant client"><Input name="amount" type="number" min="0" defaultValue={transfer?.amount ?? 0} /></Field>
      <Field label="Cout"><Input name="cost_amount" type="number" min="0" defaultValue={transfer?.cost_amount ?? 0} /></Field>
      <div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={transfer?.notes ?? ""} rows={3} /></Field></div>
      <Button type="submit" className="md:col-span-2 w-full sm:w-auto">Enregistrer</Button>
    </form>
  );
}
