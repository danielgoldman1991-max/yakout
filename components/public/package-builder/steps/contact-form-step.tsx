"use client";

import type { ContactInfo } from "../types";

type Props = {
  contact: ContactInfo;
  onChange: (patch: Partial<ContactInfo>) => void;
  onSubmit: () => void;
  isPending: boolean;
  total: string;
};

const inputClass = "w-full rounded-sm border border-border/60 bg-card px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all duration-200 focus-visible:border-gold/40 focus-visible:ring-1 focus-visible:ring-gold/20";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70";

export function ContactFormStep({ contact, onChange, onSubmit, isPending, total }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Finalisez votre demande</h2>
        <p className="text-sm text-muted-foreground/60">Un dernier effort pour recevoir votre devis personnalisé.</p>
      </div>

      <div className="rounded-sm border border-gold/15 bg-gold/5 px-5 py-4">
        <p className="text-center text-xs text-muted-foreground">
          Estimation totale de votre séjour
        </p>
        <p className="mt-1 text-center font-display text-2xl font-semibold text-gold">{total}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className={labelClass}>Nom complet *</label>
          <input type="text" value={contact.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} placeholder="Votre nom" required />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Téléphone *</label>
          <input type="tel" value={contact.phone} onChange={(e) => onChange({ phone: e.target.value })} className={inputClass} placeholder="+212 6XX XX XX XX" required />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Email</label>
          <input type="email" value={contact.email} onChange={(e) => onChange({ email: e.target.value })} className={inputClass} placeholder="email@exemple.com" />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Canal de contact préféré</label>
          <select value={contact.preferredContact} onChange={(e) => onChange({ preferredContact: e.target.value as ContactInfo["preferredContact"] })} className={inputClass}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Téléphone</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Créneau de rappel souhaité</label>
          <input type="text" value={contact.callbackTime} onChange={(e) => onChange({ callbackTime: e.target.value })} className={inputClass} placeholder="Ex: En soirée à partir de 18h" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className={labelClass}>Message / informations complémentaires</label>
          <textarea value={contact.message} onChange={(e) => onChange({ message: e.target.value })} className={inputClass} rows={3} placeholder="Avez-vous des demandes particulières ?" />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border/40 bg-card p-4 transition hover:border-gold/30">
        <input type="checkbox" checked={contact.whatsappConsent} onChange={(e) => onChange({ whatsappConsent: e.target.checked })} className="mt-0.5 accent-gold" />
        <div>
          <p className="text-sm font-medium text-foreground">J&apos;accepte d&apos;être contacté par WhatsApp</p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">Yakout vous recontactera sur ce canal pour finaliser votre séjour.</p>
        </div>
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !contact.name || !contact.phone}
        className="w-full rounded-sm bg-gold px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold disabled:pointer-events-none disabled:opacity-40"
      >
        {isPending ? "Envoi en cours..." : `Envoyer ma demande — ${total}`}
      </button>
    </div>
  );
}
