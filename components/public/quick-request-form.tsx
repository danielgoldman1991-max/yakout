"use client";

import { useState, FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { leadTypeLabels, type LeadRequestType } from "@/lib/leads";

const NEED_TYPES: Array<{ value: LeadRequestType; label: string }> = [
  { value: "reservation", label: leadTypeLabels.reservation },
  { value: "chauffeur", label: leadTypeLabels.chauffeur },
  { value: "vehicule", label: leadTypeLabels.vehicule },
  { value: "services", label: leadTypeLabels.services },
  { value: "general", label: leadTypeLabels.general },
];

const DISTRICTS = [
  { value: "Gueliz", label: "Gueliz" },
  { value: "Hivernage", label: "Hivernage" },
  { value: "Centre", label: "Centre" },
  { value: "Palmeraie", label: "Palmeraie" },
  { value: "Autre", label: "Autre" },
];

export function QuickRequestForm() {
  const [needType, setNeedType] = useState<LeadRequestType | "">("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!needType || !phone.trim()) return;
    setSending(true);
    setError("");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Demande rapide",
        phone,
        email: "",
        request_type: needType,
        source: "homepage",
        district: district || undefined,
        estimated_budget: budget ? Number(budget) : undefined,
        page_url: window.location.href,
        message: `Demande rapide - Type: ${leadTypeLabels[needType]}${district ? `, Quartier: ${district}` : ""}${budget ? `, Budget: ${budget} MAD` : ""}`,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (body?.details) console.error("[QuickRequestForm] details", body.details);
      setError(body?.error || "La demande n’a pas pu être envoyée.");
      setSending(false);
      return;
    }

    setDone(true);
    setSending(false);
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 text-center">
        <p className="text-sm text-gold">Merci ! Nous vous répondrons rapidement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-0 rounded-sm border border-border bg-card md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Type de besoin</p>
        <select value={needType} onChange={(e) => setNeedType(e.target.value as LeadRequestType)} required className="mt-2 w-full bg-transparent text-sm text-foreground outline-none">
          <option value="" className="bg-surface">Sélectionner</option>
          {NEED_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
          ))}
        </select>
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Téléphone</p>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+212..." className="mt-2 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Quartier</p>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-2 w-full bg-transparent text-sm text-foreground outline-none">
          <option value="" className="bg-surface">Tous</option>
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value} className="bg-surface">{d.label}</option>
          ))}
        </select>
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Budget</p>
        <div className="mt-2 flex items-center gap-1">
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">MAD</span>
        </div>
      </div>
      <button type="submit" disabled={sending || !needType || !phone.trim()} className="inline-flex min-h-[72px] items-center justify-center gap-3 bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-lg shadow-gold/20 transition hover:bg-gold-light disabled:opacity-40">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Demande rapide
      </button>
      {error ? <p className="px-5 py-3 text-sm text-destructive md:col-span-5">{error}</p> : null}
    </form>
  );
}
