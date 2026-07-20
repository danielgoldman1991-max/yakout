"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { DateField } from "@/components/ui/date-field";
import { Button } from "@/components/ui/button";
import { checkPublicApartmentAvailability, type AvailabilityResult } from "@/lib/actions/public-apartment-availability";
import { formatCurrency } from "@/lib/formatters";

type Props = { apartmentId: string; slug: string; price: number | null; currency: string; capacity: number | null; minimumNights: number | null };

export function ApartmentBookingCard(props: Props) {
  const [checkIn, setCheckIn] = useState<string | null>(null); const [checkOut, setCheckOut] = useState<string | null>(null); const [guests, setGuests] = useState(1); const [result, setResult] = useState<AvailabilityResult | null>(null); const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const verify = () => startTransition(async () => { const next = await checkPublicApartmentAvailability({ apartmentId: props.apartmentId, checkIn: checkIn ?? "", checkOut: checkOut ?? "", guests }); setResult(next); });
  const contactUrl = `/contact?type=reservation&apartment=${encodeURIComponent(props.slug)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
  const composerUrl = `/contact?type=package&apartment=${encodeURIComponent(props.slug)}`;
  return <div id="reservation" className="rounded-[22px] border border-border bg-card p-6 shadow-elevation-2">
    <div>{props.price && props.price > 0 ? <p><span className="font-display text-2xl font-semibold text-foreground">À partir de {formatCurrency(props.price)}</span> <span className="text-sm text-muted-foreground">/ nuit</span></p> : <p className="font-display text-2xl font-semibold">Tarif sur demande</p>}<p className="mt-1 text-xs text-muted-foreground">Sous réserve de disponibilité.</p></div>
    <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-border"><div className="border-r border-border p-3"><DateField id="booking-check-in" name="check_in" label="Arrivée" value={checkIn} onChange={(value) => { setCheckIn(value); setResult(null); }} min={today} required /></div><div className="p-3"><DateField id="booking-check-out" name="check_out" label="Départ" value={checkOut} onChange={(value) => { setCheckOut(value); setResult(null); }} min={checkIn ?? today} required /></div></div>
    <div className="mt-3 flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Voyageurs</p><p className="text-sm">{guests} voyageur{guests > 1 ? "s" : ""}</p></div><div className="flex items-center gap-2"><CounterButton label="Retirer un voyageur" onClick={() => { setGuests(Math.max(1, guests - 1)); setResult(null); }} disabled={guests <= 1} icon={Minus} /><span className="w-5 text-center text-sm font-semibold">{guests}</span><CounterButton label="Ajouter un voyageur" onClick={() => { setGuests(Math.min(props.capacity ?? 20, guests + 1)); setResult(null); }} disabled={Boolean(props.capacity && guests >= props.capacity)} icon={Plus} /></div></div>
    {props.capacity && <p className="mt-2 text-xs text-muted-foreground">Maximum : {props.capacity} voyageur{props.capacity > 1 ? "s" : ""}.</p>}
    <Button type="button" onClick={verify} disabled={pending} className="mt-5 min-h-12 w-full">{pending ? "Vérification…" : "Vérifier la disponibilité"}</Button>
    <Button asChild variant="secondary" className="mt-3 min-h-12 w-full"><a href={composerUrl}>Composer mon séjour autour de cet appartement</a></Button>
    {result && <div role="status" className={`mt-4 rounded-xl border p-3 text-sm ${result.ok && result.available ? "border-emerald-500/30 bg-emerald-500/5" : "border-ruby/30 bg-ruby/5"}`}>{result.error ?? (result.available ? "Ce logement semble disponible pour ces dates." : "Ce logement n’est pas disponible sur toute la période sélectionnée.")}{result.ok && result.available && result.total ? <p className="mt-2 font-semibold">{result.nights} nuits × {formatCurrency(props.price ?? 0)} = {formatCurrency(result.total)}</p> : null}{result.ok && result.available && <Button asChild variant="secondary" className="mt-3 w-full"><a href={contactUrl}>Continuer ma demande</a></Button>}</div>}
    <p className="mt-4 text-xs leading-5 text-muted-foreground">Estimation indicative. Le tarif final sera confirmé par Yakout.</p>
  </div>;
}

function CounterButton({ label, onClick, disabled, icon: Icon }: { label: string; onClick: () => void; disabled: boolean; icon: typeof Plus }) { return <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="flex h-11 w-11 items-center justify-center rounded-full border border-border hover:border-gold disabled:opacity-35"><Icon className="h-4 w-4" /></button>; }
