"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { leadSchema } from "@/lib/validations/schemas";
import { site } from "@/lib/constants/site";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import {
  leadRequestTypes,
  leadTypeLabels,
  leadTypePlaceholders,
  normalizeLeadRequestType,
  type LeadRequestType,
} from "@/lib/leads";

type LeadFormValues = z.input<typeof leadSchema>;

type LeadFormProps = {
  requestType?: LeadRequestType | string;
  source?: string;
  relatedType?: "apartment" | "vehicle";
  relatedSlug?: string;
  messagePlaceholder?: string;
};

export function LeadForm({
  requestType = "general",
  source = "contact_form",
  relatedType,
  relatedSlug,
  messagePlaceholder,
}: LeadFormProps) {
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const normalizedType = normalizeLeadRequestType(requestType);
  const defaults = {
    request_type: normalizedType,
    source,
    name: "",
    phone: "",
    email: "",
    message: "",
    desired_date: "",
    people_count: undefined,
    estimated_budget: undefined,
    page_url: "",
    related_type: relatedType,
    related_slug: relatedSlug,
  };
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: defaults,
  });

  function onSubmit(values: LeadFormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        request_type: normalizeLeadRequestType(values.request_type),
        source,
        related_type: relatedType,
        related_slug: relatedSlug,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body?.details) console.error("[LeadForm] details", body.details);
        toast.error(body?.error || "La demande n’a pas pu être envoyée.");
        return;
      }

      setSuccess(true);
      form.reset(defaults);
      toast.success("Demande envoyée. Yakout vous recontactera rapidement.");
    });
  }

  const fieldClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
          <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">Demande envoyée</p>
          <p className="mt-1 text-sm text-muted-foreground">Yakout vous recontactera dans les plus brefs délais.</p>
        </div>
        <a
          href={buildWhatsAppUrl(site.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold"
        >
          <MessageCircle className="h-4 w-4" />
          Contacter sur WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="request_type" className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Type de demande</label>
        <select
          id="request_type"
          className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register("request_type")}
        >
          {leadRequestTypes.map((type) => (
            <option key={type} value={type} className="bg-surface">{leadTypeLabels[type]}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className={fieldClass} placeholder="Nom complet *" aria-label="Nom complet" {...form.register("name")} />
        <Input className={fieldClass} placeholder="Téléphone *" aria-label="Téléphone" {...form.register("phone")} />
      </div>
      <Input className={fieldClass} placeholder="Email" aria-label="Email" type="email" {...form.register("email")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className={fieldClass} type="date" aria-label="Date souhaitée" {...form.register("desired_date")} />
        <Input className={fieldClass} placeholder="Nombre de personnes" aria-label="Nombre de personnes" type="number" {...form.register("people_count")} />
      </div>
      <Input className={fieldClass} placeholder="Budget estimé (DH)" aria-label="Budget estimé" type="number" {...form.register("estimated_budget")} />
      <Textarea
        className={fieldClass}
        placeholder={messagePlaceholder ?? leadTypePlaceholders[normalizedType]}
        aria-label="Votre message"
        rows={4}
        {...form.register("message")}
      />
      {Object.values(form.formState.errors).length ? (
        <p className="text-sm text-destructive">Merci de vérifier les champs obligatoires.</p>
      ) : null}
      <button type="submit" disabled={isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light disabled:pointer-events-none disabled:opacity-45">
        {isPending ? "Envoi en cours..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
