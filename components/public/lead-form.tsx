"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Textarea } from "@/components/ui/textarea";
import { leadSchema } from "@/lib/validations/schemas";
import { site } from "@/lib/constants/site";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import {
  leadRequestTypes,
  leadTypeLabels,
  leadTypeSubmitLabels,
  normalizeLeadRequestType,
  type LeadRequestType,
} from "@/lib/leads";

type LeadFormValues = z.input<typeof leadSchema>;

type LeadFormProps = {
  requestType?: LeadRequestType | string;
  source?: string;
  relatedType?: string;
  relatedSlug?: string;
  relatedId?: string;
  entityName?: string;
  apartments?: { id: string; slug: string; public_name: string }[];
  vehicles?: { id: string; slug: string; public_name: string }[];
};

const fieldClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

export function LeadForm({
  requestType = "general",
  source = "contact_form",
  relatedType,
  relatedSlug,
  relatedId,
  entityName,
  apartments = [],
  vehicles = [],
}: LeadFormProps) {
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const normalizedType = normalizeLeadRequestType(requestType);

  const defaults: Partial<LeadFormValues> = {
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
    related_type: relatedType || undefined,
    related_slug: relatedSlug || undefined,
    related_id: relatedId || undefined,
    metadata: {},
  };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: defaults as LeadFormValues,
  });

  function onSubmit(values: LeadFormValues) {
    startTransition(async () => {
      const formData = new FormData(document.getElementById("lead-form") as HTMLFormElement);
      const metadata: Record<string, unknown> = {};

      const metaFields = [
        // reservation
        "check_in", "check_out", "guests_count", "bedrooms_needed", "preferred_district",
        "budget", "transfer_needed", "driver_needed", "arrival_time", "special_requests",
        // transport
        "transport_need", "vehicle_preference", "chauffeur_needed",
        // chauffeur legacy
        "transport_type", "pickup_date", "pickup_time", "pickup_location", "dropoff_location",
        "passengers_count", "luggage_count", "flight_number", "return_needed", "preferred_vehicle",
        // vehicule
        "duration_type", "vehicle_date", "vehicle_passengers", "vehicle_luggage",
        "vehicle_pickup", "vehicle_dropoff", "francophone_driver",
        // proprietaire
        "property_type", "property_district", "property_bedrooms", "is_furnished",
        "already_listed", "owner_goal", "callback_availability",
        // services
        "service_category", "service_date", "people_count", "service_budget",
        "service_location", "service_details",
        // package
        "package_slug", "stay_start", "stay_end", "package_people_count", "package_budget",
        "need_apartment", "need_transfer", "need_driver", "selected_options",
      ];

      for (const field of metaFields) {
        const val = formData.get(field);
        if (val && typeof val === "string" && val.trim()) {
          metadata[field] = val.trim();
        }
      }

      const payload = {
        ...values,
        request_type: normalizedType,
        source,
        related_type: relatedType || formData.get("related_type") as string || undefined,
        related_slug: relatedSlug || formData.get("related_slug") as string || undefined,
        related_id: relatedId || undefined,
        message: values.message || formData.get("message") as string || "",
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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

  const entityRelated = Boolean(entityName);

  let entityBadgeLabel = "Élément sélectionné";
  if (relatedType === "apartment" || normalizedType === "reservation") entityBadgeLabel = "Appartement sélectionné";
  else if (relatedType === "vehicle" || normalizedType === "vehicule") entityBadgeLabel = "Type de vehicule selectionne";
  else if (relatedType === "package" || normalizedType === "package") entityBadgeLabel = "Pack sélectionné";
  else if (relatedType === "service" || normalizedType === "services") entityBadgeLabel = "Service sélectionné";
  else if (relatedType === "trip") entityBadgeLabel = "Circuit sélectionné";
  else if (relatedType === "transfer" || normalizedType === "chauffeur" || normalizedType === "transport") entityBadgeLabel = "Transport prive selectionne";

  return (
    <form id="lead-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Type hidden if entity pre-selected, else selector */}
      {entityRelated && entityName ? (
        <input type="hidden" {...form.register("request_type")} />
      ) : (
        <div className="space-y-1">
          <label className={labelClass}>Type de demande</label>
          <select className={selectClass} {...form.register("request_type")}>
            {leadRequestTypes.map((type) => (
              <option key={type} value={type} className="bg-surface">{leadTypeLabels[type]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Pre-selected entity badge */}
      {entityName && (
        <div className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gold/70">
            {entityBadgeLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{entityName}</p>
          <input type="hidden" {...form.register("related_type")} value={relatedType} />
          <input type="hidden" {...form.register("related_slug")} value={relatedSlug} />
        </div>
      )}

      {/* ─── Champs communs ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className={fieldClass} placeholder="Nom complet *" aria-label="Nom complet" {...form.register("name")} />
        <Input className={fieldClass} placeholder="Téléphone *" aria-label="Téléphone" {...form.register("phone")} />
      </div>
      <Input className={fieldClass} placeholder="Email" aria-label="Email" type="email" {...form.register("email")} />

      {/* ─── Champs spécifiques par type ─── */}
      {normalizedType === "reservation" && !entityName && apartments.length > 0 && (
        <div className="space-y-1">
          <label className={labelClass}>Appartement souhaité</label>
          <select className={selectClass} name="related_slug">
            <option value="">Je ne sais pas encore / conseillez-moi</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.slug}>
                {apt.public_name}
              </option>
            ))}
          </select>
          <input type="hidden" name="related_type" value="apartment" />
        </div>
      )}

      {normalizedType === "vehicule" && !entityName && vehicles.length > 0 && (
        <div className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3 text-xs leading-6 text-muted-foreground">
          Vous n&apos;avez pas besoin de choisir un modele exact. Dites-nous votre trajet, le nombre de passagers et vos bagages : Yakout propose le vehicule adapte.
        </div>
      )}

      {/* Reservation-specific fields */}
      {normalizedType === "reservation" && (
        <ReservationFields />
      )}

      {/* Chauffeur-specific fields */}
      {(normalizedType === "transport" || normalizedType === "chauffeur") && (
        <ChauffeurFields />
      )}

      {/* Vehicule-specific fields */}
      {normalizedType === "vehicule" && (
        <VehiculeFields />
      )}

      {/* Proprietaire-specific fields */}
      {normalizedType === "proprietaire" && (
        <ProprietaireFields />
      )}

      {/* Services-specific fields */}
      {normalizedType === "services" && (
        <ServicesFields />
      )}

      {normalizedType === "package" && (
        <PackageFields relatedSlug={relatedSlug} />
      )}

      {/* ─── Message ─── */}
      <Textarea
        className={fieldClass}
        placeholder={["general", "services"].includes(normalizedType) ? "Votre message *" : "Message / demande particulière (optionnel)"}
        aria-label="Votre message"
        rows={3}
        {...form.register("message")}
      />

      {Object.values(form.formState.errors).length ? (
        <p className="text-sm text-destructive">Merci de vérifier les champs obligatoires.</p>
      ) : null}

      <button type="submit" disabled={isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light disabled:pointer-events-none disabled:opacity-45">
        {isPending ? "Envoi en cours..." : leadTypeSubmitLabels[normalizedType]}
      </button>
    </form>
  );
}

/* ─── Type-specific field sections ─── */

function ReservationFields() {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Détails du séjour</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <DateField id="check_in" name="check_in" label="Date d'arrivée" />
        </div>
        <div className="space-y-1">
          <DateField id="check_out" name="check_out" label="Date de départ" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Nombre de voyageurs</label>
          <input type="number" name="guests_count" min="1" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={label}>Budget approximatif / nuit (MAD)</label>
          <input type="number" name="budget" min="0" step="100" className={inputClass} placeholder="ex: 1500" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Nombre de chambres souhaité</label>
          <select name="bedrooms_needed" className={selectClass}>
            <option value="">Indifférent</option>
            <option value="1">1 chambre</option>
            <option value="2">2 chambres</option>
            <option value="3">3 chambres</option>
            <option value="4">4+ chambres</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Quartier préféré</label>
          <input type="text" name="preferred_district" className={inputClass} placeholder="Ex: Guéliz, Hivernage..." />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Heure d&apos;arrivée</label>
          <input type="time" name="arrival_time" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={label}>Besoin transfert aéroport ?</label>
          <select name="transfer_needed" className={selectClass}>
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className={label}>Besoin chauffeur pendant le séjour ?</label>
        <select name="driver_needed" className={selectClass}>
          <option value="non">Non</option>
          <option value="oui">Oui</option>
        </select>
      </div>
    </div>
  );
}

function ChauffeurFields() {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Demande de transport prive</p>
      <div className="space-y-1">
        <label className={label}>Type de besoin</label>
        <select name="transport_need" className={selectClass}>
          <option value="transfert_aeroport">Transfert aeroport</option>
          <option value="chauffeur_prive">Chauffeur prive</option>
          <option value="mise_a_disposition">Mise a disposition</option>
          <option value="circuit">Circuit</option>
          <option value="transport_groupe">Transport groupe</option>
          <option value="autre">Autre</option>
        </select>
        <input type="hidden" name="chauffeur_needed" value="true" />
      </div>
      <div className="space-y-1">
        <label className={label}>Type de trajet</label>
        <select name="transport_type" className={selectClass}>
          <option value="transfert_aeroport">Transfert aéroport</option>
          <option value="trajet_ville">Trajet en ville</option>
          <option value="demi_journee">Mise à disposition demi-journée</option>
          <option value="journee">Mise à disposition journée</option>
          <option value="excursion">Excursion</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <DateField id="pickup_date" name="pickup_date" label="Date souhaitée" />
        </div>
        <div className="space-y-1">
          <label className={label}>Heure souhaitée</label>
          <input type="time" name="pickup_time" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Lieu de prise en charge</label>
          <input type="text" name="pickup_location" className={inputClass} placeholder="Ex: Aéroport Marrakech" />
        </div>
        <div className="space-y-1">
          <label className={label}>Destination</label>
          <input type="text" name="dropoff_location" className={inputClass} placeholder="Ex: Guéliz" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Nombre de passagers</label>
          <input type="number" name="passengers_count" min="1" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={label}>Nombre de bagages</label>
          <input type="number" name="luggage_count" min="0" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={label}>Preference vehicule</label>
        <select name="vehicle_preference" className={selectClass}>
          <option value="solution_adaptee">Yakout choisit la solution adaptee</option>
          <option value="berline_confort">Berline confort</option>
          <option value="suv_4x4_premium">SUV / 4x4 premium</option>
          <option value="van_touristique">Van touristique</option>
          <option value="premium_oui">Vehicule premium souhaite</option>
          <option value="standard_ok">Confort standard suffit</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Numéro de vol (si aéroport)</label>
          <input type="text" name="flight_number" className={inputClass} placeholder="Ex: AF1234" />
        </div>
        <div className="space-y-1">
          <label className={label}>Besoin retour ?</label>
          <select name="return_needed" className={selectClass}>
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function VehiculeFields() {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Détails du véhicule</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <DateField id="vehicle_date" name="vehicle_date" label="Date souhaitée" />
        </div>
        <div className="space-y-1">
          <label className={label}>Durée souhaitée</label>
          <select name="duration_type" className={selectClass}>
            <option value="trajet_simple">Trajet simple</option>
            <option value="demi_journee">Demi-journée</option>
            <option value="journee">Journée</option>
            <option value="plusieurs_jours">Plusieurs jours</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Nombre de passagers</label>
          <input type="number" name="vehicle_passengers" min="1" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={label}>Nombre de bagages</label>
          <input type="number" name="vehicle_luggage" min="0" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Lieu de prise en charge</label>
          <input type="text" name="vehicle_pickup" className={inputClass} placeholder="Ex: Aéroport Marrakech" />
        </div>
        <div className="space-y-1">
          <label className={label}>Destination / programme</label>
          <input type="text" name="vehicle_dropoff" className={inputClass} placeholder="Ex: Essaouira" />
        </div>
      </div>
      <div className="space-y-1">
        <label className={label}>Besoin chauffeur francophone ?</label>
        <select name="francophone_driver" className={selectClass}>
          <option value="oui">Oui</option>
          <option value="non">Non, anglais suffit</option>
        </select>
      </div>
    </div>
  );
}

function ProprietaireFields() {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Votre bien</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Type de bien *</label>
          <select name="property_type" className={selectClass} required>
            <option value="">Sélectionnez</option>
            <option value="appartement">Appartement</option>
            <option value="villa">Villa</option>
            <option value="riad">Riad</option>
            <option value="studio">Studio</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Quartier *</label>
          <input type="text" name="property_district" className={inputClass} placeholder="Ex: Guéliz" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Nombre de chambres</label>
          <select name="property_bedrooms" className={selectClass}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Bien meublé ?</label>
          <select name="is_furnished" className={selectClass}>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Déjà sur Airbnb / Booking ?</label>
          <select name="already_listed" className={selectClass}>
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Objectif</label>
          <select name="owner_goal" className={selectClass}>
            <option value="location_courte_duree">Location courte durée</option>
            <option value="gestion_complete">Gestion complète</option>
            <option value="optimisation_annonce">Optimisation annonce</option>
            <option value="accueil_voyageurs">Accueil voyageurs</option>
            <option value="menage_maintenance">Ménage / maintenance</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className={label}>Disponibilité pour être rappelé</label>
        <input type="text" name="callback_availability" className={inputClass} placeholder="Ex: En soirée à partir de 18h" />
      </div>
    </div>
  );
}

function ServicesFields() {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Détails du service</p>
      <div className="space-y-1">
        <label className={label}>Type de service</label>
        <select name="service_category" className={selectClass}>
          <option value="organisation_sejour">Organisation séjour</option>
          <option value="excursion">Excursion</option>
          <option value="restaurant_sortie">Restaurant / sortie</option>
          <option value="experience_touristique">Expérience touristique</option>
          <option value="courses_assistance">Courses / assistance</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <DateField id="service_date" name="service_date" label="Date souhaitée" />
        </div>
        <div className="space-y-1">
          <label className={label}>Nombre de personnes</label>
          <input type="number" name="people_count" min="1" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Budget approximatif (MAD)</label>
          <input type="number" name="service_budget" min="0" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={label}>Lieu de départ / quartier</label>
          <input type="text" name="service_location" className={inputClass} placeholder="Ex: Guéliz" />
        </div>
      </div>
    </div>
  );
}

function PackageFields({ relatedSlug }: { relatedSlug?: string }) {
  const label = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
  const inputClass = "rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring w-full";
  const selectClass = "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3 rounded-sm border border-border/50 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Details du pack</p>
      <input type="hidden" name="package_slug" value={relatedSlug ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
<DateField id="stay_start" name="stay_start" label="Debut sejour" />
          <DateField id="stay_end" name="stay_end" label="Fin sejour" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label className={label}>Nombre de personnes</label><input type="number" name="package_people_count" min="1" className={inputClass} /></div>
        <div className="space-y-1"><label className={label}>Budget global MAD</label><input type="number" name="package_budget" min="0" step="100" className={inputClass} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1"><label className={label}>Appartement</label><select name="need_apartment" className={selectClass}><option value="oui">Oui</option><option value="non">Non</option><option value="a_confirmer">A confirmer</option></select></div>
        <div className="space-y-1"><label className={label}>Transfert</label><select name="need_transfer" className={selectClass}><option value="oui">Oui</option><option value="non">Non</option><option value="a_confirmer">A confirmer</option></select></div>
        <div className="space-y-1"><label className={label}>Chauffeur</label><select name="need_driver" className={selectClass}><option value="oui">Oui</option><option value="non">Non</option><option value="a_confirmer">A confirmer</option></select></div>
      </div>
      <div className="space-y-1">
        <label className={label}>Options souhaitees</label>
        <textarea name="selected_options" rows={3} className={inputClass} placeholder="Guide, restaurant, lit bebe, accueil VIP..." />
      </div>
    </div>
  );
}
