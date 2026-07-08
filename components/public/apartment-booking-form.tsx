"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageCircle, MapPin, Users, BedDouble, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apartmentBookingSchema, type ApartmentBookingInput } from "@/lib/validations/schemas";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { site } from "@/lib/constants/site";
import type { Apartment } from "@/types/business";

type ApartmentSummary = Pick<Apartment, "id" | "slug" | "public_name" | "district" | "public_district" | "capacity" | "bedrooms" | "price_per_night" | "price_from" | "image_url">;

type ApartmentBookingFormProps = {
  mode: "selected_apartment" | "apartment_search";
  apartment?: ApartmentSummary;
  source?: string;
};

const fieldClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

export function ApartmentBookingForm({ mode, apartment, source = "contact_form" }: ApartmentBookingFormProps) {
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const price = apartment?.price_per_night ?? apartment?.price_from ?? 0;

  const defaults: ApartmentBookingInput = mode === "selected_apartment" && apartment
    ? {
        mode: "selected_apartment",
        name: "",
        phone: "",
        email: "",
        check_in: "",
        check_out: "",
        guests_count: 1,
        message: "",
        apartment_id: apartment.id,
        apartment_slug: apartment.slug,
      }
    : {
        mode: "apartment_search",
        name: "",
        phone: "",
        email: "",
        check_in: "",
        check_out: "",
        guests_count: 1,
        budget: undefined,
        bedrooms_needed: undefined,
        preferred_district: undefined,
        message: "",
      };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(apartmentBookingSchema),
    defaultValues: defaults,
  });

  const watchedCheckIn = form.watch("check_in");
  const watchedCheckOut = form.watch("check_out");
  const watchedGuests = form.watch("guests_count");

  const nights = useMemo(() => {
    if (!watchedCheckIn || !watchedCheckOut) return 0;
    const ms = new Date(watchedCheckOut).getTime() - new Date(watchedCheckIn).getTime();
    return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
  }, [watchedCheckIn, watchedCheckOut]);

  const estimatedTotal = nights * price;

  const capacityError = apartment && watchedGuests > apartment.capacity;

  function transformToLeadPayload(values: ApartmentBookingInput): Record<string, unknown> {
    if (values.mode === "selected_apartment") {
      return {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        request_type: "reservation",
        source,
        related_type: "apartment",
        related_slug: values.apartment_slug,
        related_id: values.apartment_id,
        message: values.message || "",
        people_count: values.guests_count,
        desired_date: values.check_in,
        metadata: {
          check_in: values.check_in,
          check_out: values.check_out,
          guests_count: values.guests_count,
        },
      };
    }

    return {
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      request_type: "reservation",
      source,
      message: values.message || "",
      people_count: values.guests_count,
      desired_date: values.check_in,
      district: values.preferred_district || undefined,
      estimated_budget: values.budget || undefined,
      metadata: {
        check_in: values.check_in,
        check_out: values.check_out,
        guests_count: values.guests_count,
        budget: values.budget || undefined,
        bedrooms_needed: values.bedrooms_needed || undefined,
        preferred_district: values.preferred_district || undefined,
      },
    };
  }

  function onSubmit(values: ApartmentBookingInput) {
    startTransition(async () => {
      const payload = transformToLeadPayload(values);

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body?.details) console.error("[ApartmentBookingForm] details", body.details);
        toast.error(body?.error || "La demande n'a pas pu être envoyée.");
        return;
      }

      setSuccess(true);
      toast.success("Demande envoyée. Yakout vous recontactera rapidement.");
    });
  }

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
        <Button asChild variant="primary" className="gap-2">
          <a href={buildWhatsAppUrl(site.whatsappMessage)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Contacter sur WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Apartment summary card (selected_apartment mode only) */}
      {mode === "selected_apartment" && apartment && (
        <div className="overflow-hidden rounded-sm border border-gold/20 bg-gold/[0.02] shadow-elevation-1">
          <div className="flex gap-4 p-4">
            {apartment.image_url && (
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-sm">
                <img src={apartment.image_url} alt={apartment.public_name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-foreground truncate">{apartment.public_name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gold" />{apartment.public_district ?? apartment.district}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3 text-gold" />{apartment.capacity} pers.</span>
                <span className="flex items-center gap-1"><BedDouble className="h-3 w-3 text-gold" />{apartment.bedrooms} ch.</span>
              </div>
              <p className="text-xs text-gold font-medium">{formatCurrency(price)} <span className="text-muted-foreground font-normal">/ nuit</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Common fields ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className={fieldClass} placeholder="Nom complet *" aria-label="Nom complet" {...form.register("name")} />
        <Input className={fieldClass} placeholder="Téléphone *" aria-label="Téléphone" {...form.register("phone")} />
      </div>
      <Input className={fieldClass} placeholder="Email" aria-label="Email" type="email" {...form.register("email")} />

      {/* ─── Dates & guests ─── */}
      <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Détails du séjour</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="check_in"
            render={({ field, fieldState }) => (
              <DateField
                id="check_in"
                name={field.name}
                label="Date d'arrivée"
                value={field.value}
                onChange={field.onChange}
                required
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="check_out"
            render={({ field, fieldState }) => (
              <DateField
                id="check_out"
                name={field.name}
                label="Date de départ"
                value={field.value}
                onChange={field.onChange}
                required
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Nombre de voyageurs *</label>
          <input type="number" min="1" className={fieldClass + " w-full"} {...form.register("guests_count", { valueAsNumber: true })} />
          {capacityError && (
            <p className="mt-1 text-xs text-destructive">Cet appartement accueille maximum {apartment.capacity} voyageurs.</p>
          )}
        </div>

        {/* Price estimation (selected_apartment mode) */}
        {mode === "selected_apartment" && estimatedTotal > 0 && (
          <div className="flex items-center gap-2 rounded-sm border border-gold/10 bg-gold/[0.03] px-3 py-2 text-xs">
            <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
            <span className="text-muted-foreground">
              Estimation&nbsp;: <strong className="text-foreground">{formatCurrency(estimatedTotal)}</strong>
              <span className="text-muted-foreground"> ({nights} nuits × {formatCurrency(price)})</span>
            </span>
          </div>
        )}
      </div>

      {/* ─── Search-specific fields (apartment_search mode only) ─── */}
      {mode === "apartment_search" && (
        <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Critères de recherche</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClass}>Budget approx. / nuit (MAD)</label>
              <input type="number" min="0" step="100" className={fieldClass + " w-full"} placeholder="ex: 1500" {...form.register("budget", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Chambres souhaitées</label>
              <select className={fieldClass + " w-full"} {...form.register("bedrooms_needed")}>
                <option value="">Indifférent</option>
                <option value="1">1 chambre</option>
                <option value="2">2 chambres</option>
                <option value="3">3 chambres</option>
                <option value="4">4+ chambres</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Quartier préféré</label>
            <input type="text" className={fieldClass + " w-full"} placeholder="Ex: Guéliz, Hivernage..." {...form.register("preferred_district")} />
          </div>
        </div>
      )}

      {/* ─── Message ─── */}
      <Textarea
        className={fieldClass}
        placeholder="Message / demande particulière (optionnel)"
        aria-label="Votre message"
        rows={3}
        {...form.register("message")}
      />

      {Object.keys(form.formState.errors).length > 0 && (
        <p className="text-sm text-destructive">Merci de vérifier les champs obligatoires.</p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={isPending || !!capacityError}>
        {isPending ? "Envoi en cours..." : mode === "selected_apartment" ? "Demander ce logement" : "Envoyer ma demande de réservation"}
      </Button>
    </form>
  );
}
