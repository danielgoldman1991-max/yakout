"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LeadRequestType } from "@/lib/leads";

const NEED_TYPES: { value: LeadRequestType; label: string }[] = [
  { value: "reservation", label: "Réserver un logement" },
  { value: "chauffeur", label: "Chauffeur privé" },
  { value: "vehicule", label: "Transport privé" },
  { value: "proprietaire", label: "Confier mon bien" },
  { value: "general", label: "Autre demande" },
];

const DISTRICTS = [
  { value: "agdal", label: "Agdal" },
  { value: "gueliz", label: "Guéliz" },
  { value: "hivernage", label: "Hivernage" },
  { value: "kasbah", label: "Kasbah" },
  { value: "m avenue", label: "M Avenue" },
  { value: "majorelle", label: "Majorelle" },
  { value: "medina", label: "Médina" },
  { value: "palmeraie", label: "Palmeraie" },
  { value: "route ourika", label: "Route de l'Ourika" },
  { value: "targa", label: "Targa" },
];

export function QuickRequestForm() {
  const router = useRouter();
  const [needType, setNeedType] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const body = {
        request_type: needType,
        phone,
        metadata: { district: district || undefined, budget: budget ? Number(budget) : undefined },
        source: "quick_form",
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur reseau");
      setDone(true);
    } catch {
      router.push("/contact");
    } finally {
      setSending(false);
    }
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
        <select
          value={needType}
          onChange={(e) => setNeedType(e.target.value)}
          required
          className="mt-2 w-full appearance-none bg-transparent text-sm text-foreground outline-none"
        >
          <option value="" className="bg-surface text-foreground">Sélectionner</option>
          {NEED_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-surface text-foreground">
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Téléphone</p>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="+212..."
          className="mt-2 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Quartier</p>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="mt-2 w-full appearance-none bg-transparent text-sm text-foreground outline-none"
        >
          <option value="" className="bg-surface text-foreground">Tous</option>
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value} className="bg-surface text-foreground">
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="border-b border-border px-5 py-4 md:border-b-0 md:border-r">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Budget</p>
        <div className="mt-2 flex items-center gap-1">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <span className="text-[10px] text-muted-foreground">MAD</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={sending || !needType || !phone.trim()}
        className="inline-flex min-h-[72px] items-center justify-center gap-3 bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-lg shadow-gold/20 transition hover:bg-gold-light disabled:opacity-40"
      >
        {sending ? "Envoi..." : (
          <>
            Rechercher
            <Search className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
