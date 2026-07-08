"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReservationAction } from "@/lib/data/actions";
import { RESERVATION_STATUS_LABELS, RESERVATION_SOURCE_LABELS } from "@/lib/constants/reservations";
import { formatCurrency } from "@/lib/formatters";
import { calculateReservationPrices, calculateNights } from "@/lib/utils/reservation-math";

type SelectOption = { id: string; label: string; description?: string };

const STEPS = ["Client & origine", "Sejour & appartement", "Tarification", "Confirmation"];

type WizardData = {
  client_id: string;
  lead_id: string;
  package_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country: string;
  source: string;
  external_reference: string;
  external_url: string;
  apartment_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  arrival_time: string;
  departure_time: string;
  currency: string;
  nightly_rate: number;
  cleaning_fee: number;
  tourist_tax: number;
  services_total: number;
  discount_amount: number;
  total_amount: number;
  deposit_amount: number;
  special_requests: string;
  internal_notes: string;
  intent: string;
};

const INITIAL_DATA: WizardData = {
  client_id: "", lead_id: "", package_id: "",
  guest_name: "", guest_email: "", guest_phone: "", guest_country: "",
  source: "direct", external_reference: "", external_url: "",
  apartment_id: "", check_in: "", check_out: "",
  adults: 1, children: 0, infants: 0,
  arrival_time: "", departure_time: "",
  currency: "MAD", nightly_rate: 0, cleaning_fee: 0, tourist_tax: 0,
  services_total: 0, discount_amount: 0, total_amount: 0, deposit_amount: 0,
  special_requests: "", internal_notes: "",
  intent: "draft",
};

export default function ReservationWizard({
  clients,
  apartments,
  leads,
  packages,
  defaultApartmentId,
  defaultClientId,
  defaultLeadId,
  defaultPackageId,
}: {
  clients: SelectOption[];
  apartments: SelectOption[];
  leads: SelectOption[];
  packages: SelectOption[];
  defaultApartmentId?: string;
  defaultClientId?: string;
  defaultLeadId?: string;
  defaultPackageId?: string;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(() => ({
    ...INITIAL_DATA,
    apartment_id: defaultApartmentId ?? "",
    client_id: defaultClientId ?? "",
    lead_id: defaultLeadId ?? "",
    package_id: defaultPackageId ?? "",
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const nights = data.check_in && data.check_out ? calculateNights(data.check_in, data.check_out) : 0;
  const prices = data.nightly_rate && nights ? calculateReservationPrices({
    nightlyRate: data.nightly_rate,
    nights,
    cleaningFee: data.cleaning_fee,
    touristTax: data.tourist_tax,
    servicesTotal: data.services_total,
    discountAmount: data.discount_amount,
  }) : null;

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors([]);
  }, []);

  const validateStep = (s: number): boolean => {
    const errs: string[] = [];
    if (s === 1) {
      if (!data.guest_name && !data.client_id) errs.push("Indiquez le nom du voyageur ou selectionnez un client.");
    }
    if (s === 2) {
      if (!data.apartment_id) errs.push("Selectionnez un appartement.");
      if (!data.check_in) errs.push("Indiquez la date d'arrivee.");
      if (!data.check_out) errs.push("Indiquez la date de depart.");
      if (data.check_in && data.check_out && data.check_out <= data.check_in)
        errs.push("La date de depart doit etre posterieure a la date d'arrivee.");
    }
    if (s === 3) {
      if (!data.nightly_rate || data.nightly_rate <= 0) errs.push("Indiquez un prix par nuit.");
      if (!data.total_amount || data.total_amount <= 0) errs.push("Le montant total doit etre superieur a 0.");
    }
    if (s === 4) {
      if (data.intent === "confirmed") {
        if (!data.client_id) errs.push("Selectionnez un client avant de confirmer.");
        if (!data.guest_name) errs.push("Le nom du voyageur est requis.");
        if (!data.apartment_id) errs.push("Selectionnez un appartement.");
      }
      if (data.intent === "option" && !data.apartment_id) errs.push("Selectionnez un appartement.");
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 4)); };
  const prev = () => { setStep((s) => Math.max(s - 1, 1)); setErrors([]); };

  const nightsStr = nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main form */}
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const active = num === step;
            const done = num < step;
            return (
              <button key={num} type="button" onClick={() => { if (done) setStep(num); }}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${active ? "text-gold" : done ? "text-gold/60" : "text-muted-foreground/50"}`}>
                <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active ? "bg-gold text-espresso" : done ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                }`}>{done ? "✓" : num}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {errors.length > 0 && (
          <div role="alert" className="rounded-sm border border-ruby/30 bg-ruby/5 p-3 text-sm text-ruby">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {/* Step 1: Client & Origin */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Client et origine</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client existant</label>
                <select name="client_id" value={data.client_id}
                  onChange={(e) => update("client_id", e.target.value)}
                  className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">-- Selectionner un client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}{c.description ? ` — ${c.description}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="guest_name" className="text-xs font-medium text-muted-foreground">Voyageur principal *</label>
                <Input id="guest_name" value={data.guest_name} onChange={(e) => update("guest_name", e.target.value)}
                  placeholder="Nom du voyageur" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="guest_email">Email</label>
                  <Input id="guest_email" type="email" value={data.guest_email} onChange={(e) => update("guest_email", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="guest_phone">Telephone</label>
                  <Input id="guest_phone" type="tel" value={data.guest_phone} onChange={(e) => update("guest_phone", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="guest_country">Pays</label>
                  <Input id="guest_country" value={data.guest_country} onChange={(e) => update("guest_country", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="source">Source</label>
                  <select id="source" value={data.source} onChange={(e) => update("source", e.target.value)}
                    className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
                    {Object.entries(RESERVATION_SOURCE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="lead_id">Lead d&apos;origine</label>
                  <select id="lead_id" value={data.lead_id} onChange={(e) => update("lead_id", e.target.value)}
                    className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
                    <option value="">-- Aucun --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="package_id">Pack</label>
                  <select id="package_id" value={data.package_id} onChange={(e) => update("package_id", e.target.value)}
                    className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
                    <option value="">-- Aucun --</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="special_requests">Demandes particulieres</label>
                <textarea id="special_requests" value={data.special_requests} onChange={(e) => update("special_requests", e.target.value)}
                  className="min-h-[80px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Preferences, allergies, besoins specifiques..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Stay & Apartment */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Sejour et appartement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="apartment_id">Appartement *</label>
                <select id="apartment_id" value={data.apartment_id} onChange={(e) => update("apartment_id", e.target.value)}
                  className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
                  <option value="">-- Selectionner un appartement --</option>
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}{a.description ? ` (${a.description})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField id="check_in" name="check_in" label="Arrivee" value={data.check_in} onChange={(val) => update("check_in", val ?? "")} required />
                <DateField id="check_out" name="check_out" label="Depart" value={data.check_out} onChange={(val) => update("check_out", val ?? "")} required />
              </div>
              {nightsStr && <p className="text-sm text-muted-foreground">{nightsStr}</p>}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="adults">Adultes</label>
                  <Input id="adults" type="number" min={1} value={data.adults} onChange={(e) => update("adults", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="children">Enfants</label>
                  <Input id="children" type="number" min={0} value={data.children} onChange={(e) => update("children", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="infants">Bebes</label>
                  <Input id="infants" type="number" min={0} value={data.infants} onChange={(e) => update("infants", Number(e.target.value))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="arrival_time">Heure d&apos;arrivee</label>
                  <Input id="arrival_time" type="time" value={data.arrival_time} onChange={(e) => update("arrival_time", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="departure_time">Heure de depart</label>
                  <Input id="departure_time" type="time" value={data.departure_time} onChange={(e) => update("departure_time", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Tarification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="nightly_rate">Prix par nuit (MAD)</label>
                  <Input id="nightly_rate" type="number" min={0} step={0.01} value={data.nightly_rate}
                    onChange={(e) => update("nightly_rate", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="cleaning_fee">Frais de menage (MAD)</label>
                  <Input id="cleaning_fee" type="number" min={0} value={data.cleaning_fee}
                    onChange={(e) => update("cleaning_fee", Number(e.target.value))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="tourist_tax">Taxe de sejour (MAD)</label>
                  <Input id="tourist_tax" type="number" min={0} value={data.tourist_tax}
                    onChange={(e) => update("tourist_tax", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="services_total">Services (MAD)</label>
                  <Input id="services_total" type="number" min={0} value={data.services_total}
                    onChange={(e) => update("services_total", Number(e.target.value))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="discount_amount">Reduction (MAD)</label>
                  <Input id="discount_amount" type="number" min={0} value={data.discount_amount}
                    onChange={(e) => update("discount_amount", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="deposit_amount">Acompte demande (MAD)</label>
                  <Input id="deposit_amount" type="number" min={0} value={data.deposit_amount}
                    onChange={(e) => update("deposit_amount", Number(e.target.value))} />
                </div>
              </div>

              {prices && (
                <div className="rounded-sm border border-border/60 bg-muted/30 p-4 text-sm space-y-1.5">
                  <div className="flex justify-between"><span>Prix par nuit × {nights} nuits</span><span>{formatCurrency(prices.accommodationSubtotal)}</span></div>
                  {prices.cleaningFee > 0 && <div className="flex justify-between"><span>Frais de menage</span><span>{formatCurrency(prices.cleaningFee)}</span></div>}
                  {prices.touristTax > 0 && <div className="flex justify-between"><span>Taxe de sejour</span><span>{formatCurrency(prices.touristTax)}</span></div>}
                  {prices.servicesTotal > 0 && <div className="flex justify-between"><span>Services</span><span>{formatCurrency(prices.servicesTotal)}</span></div>}
                  {prices.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Reduction</span><span>-{formatCurrency(prices.discountAmount)}</span></div>}
                  <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total</span><span>{formatCurrency(prices.totalAmount)}</span></div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="total_amount">Montant total (MAD)</label>
                <Input id="total_amount" type="number" min={0} value={data.total_amount}
                  onChange={(e) => update("total_amount", Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">Recalcule automatiquement si le prix par nuit change.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle>Confirmation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-sm border border-border/60 bg-muted/30 p-4 text-sm space-y-2">
                <p><strong>Voyageur :</strong> {data.guest_name || "Non renseigne"}{data.client_id ? " (client lie)" : ""}</p>
                <p><strong>Appartement :</strong> {data.apartment_id ? apartments.find((a) => a.id === data.apartment_id)?.label ?? "Selectionne" : "Non selectionne"}</p>
                <p><strong>Sejour :</strong> {data.check_in || "?"} → {data.check_out || "?"} ({nightsStr || "?"})</p>
                <p><strong>Voyageurs :</strong> {data.adults} adulte{data.adults > 1 ? "s" : ""}{data.children > 0 ? `, ${data.children} enfant${data.children > 1 ? "s" : ""}` : ""}{data.infants > 0 ? `, ${data.infants} bebe${data.infants > 1 ? "s" : ""}` : ""}</p>
                <p><strong>Total :</strong> {formatCurrency(data.total_amount)}</p>
                {data.deposit_amount > 0 && <p><strong>Acompte :</strong> {formatCurrency(data.deposit_amount)}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Statut initial</label>
                <div className="flex flex-wrap gap-2">
                  {["draft", "option", "confirmed"].map((s) => (
                    <button key={s} type="button" onClick={() => update("intent", s)}
                      className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                        data.intent === s
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border/60 text-muted-foreground hover:border-gold/40"
                      }`}>
                      {RESERVATION_STATUS_LABELS[s] ?? s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="internal_notes">Notes internes</label>
                <textarea id="internal_notes" value={data.internal_notes} onChange={(e) => update("internal_notes", e.target.value)}
                  className="min-h-[60px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <form action={createReservationAction} onSubmit={() => {
                if (!validateStep(4)) { return false; }
                setPending(true);
              }}>
                {Object.entries(data).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={String(v ?? "")} />
                ))}
                <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                  {pending ? "Enregistrement..." : data.intent === "confirmed" ? "Confirmer la reservation" : data.intent === "option" ? "Placer en option" : "Enregistrer le brouillon"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && <Button type="button" variant="secondary" onClick={prev}>Precedent</Button>}
          </div>
          {step < 4 && <Button type="button" onClick={next}>Suivant</Button>}
        </div>
      </div>

      {/* Sticky summary sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Client</span><p className="font-medium">{data.guest_name || "—"}</p></div>
              <div><span className="text-muted-foreground">Appartement</span><p className="font-medium">{data.apartment_id ? apartments.find((a) => a.id === data.apartment_id)?.label ?? "—" : "—"}</p></div>
              <div><span className="text-muted-foreground">Dates</span><p className="font-medium">{data.check_in || "?"} → {data.check_out || "?"}</p></div>
              {nightsStr && <div><span className="text-muted-foreground">Nuits</span><p className="font-medium">{nightsStr}</p></div>}
              <div><span className="text-muted-foreground">Total</span><p className="font-medium">{formatCurrency(data.total_amount)}</p></div>
              {data.deposit_amount > 0 && <div><span className="text-muted-foreground">Acompte</span><p className="font-medium">{formatCurrency(data.deposit_amount)}</p></div>}
              <div><span className="text-muted-foreground">Statut</span><p className="font-medium">{data.intent ? RESERVATION_STATUS_LABELS[data.intent] ?? data.intent : "—"}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
