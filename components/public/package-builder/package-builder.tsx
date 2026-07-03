"use client";

import { useState, useReducer, useMemo, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, MessageCircle, PackageCheck, SlidersHorizontal } from "lucide-react";
import type { ContactInfo, PackageBuilderData, StayInfo } from "./types";
import { createInitialState, packageReducer, STEP_LABELS, STEP_DESCRIPTIONS, EXTRA_SERVICE_OPTIONS } from "./types";
import { calculatePricing, formatPrice } from "./price-calculator";
import { StayInfoStep } from "./steps/stay-info";
import { ApartmentSelectionStep } from "./steps/apartment-selection";
import { TransferSelectionStep } from "./steps/transfer-selection";
import { VehicleSelectionStep } from "./steps/vehicle-selection";
import { ExperienceSelectionStep } from "./steps/experience-selection";
import { ExtraServicesStep } from "./steps/extra-services";
import { ContactFormStep } from "./steps/contact-form-step";
import { SummarySticky } from "./summary-sticky";
import { site } from "@/lib/constants/site";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

type PackageContext = {
  slug: string;
  title: string;
  shortDescription?: string;
  durationLabel?: string;
  idealFor?: string;
  imageUrl?: string;
  imageAlt?: string;
  priceFrom?: number | null;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    priceAmount?: number | null;
    isOptional?: boolean;
  }>;
};

type Props = {
  data: PackageBuilderData;
  selectedPackage?: PackageContext;
  basePackage?: PackageContext;
  mode?: "order" | "customize" | "custom";
};

export function PackageBuilder({ data, selectedPackage, basePackage, mode = "custom" }: Props) {
  const [state, dispatch] = useReducer(packageReducer, createInitialState());
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => (basePackage?.items ?? []).map((item) => item.id));
  const [addedOptionIds, setAddedOptionIds] = useState<string[]>([]);

  const pricing = useMemo(() => calculatePricing(state), [state]);
  const customizedItems = useMemo(() => (basePackage?.items ?? []).filter((item) => selectedItemIds.includes(item.id)), [basePackage, selectedItemIds]);
  const removedItems = useMemo(() => (basePackage?.items ?? []).filter((item) => !selectedItemIds.includes(item.id)), [basePackage, selectedItemIds]);
  const addedOptions = useMemo(() => EXTRA_SERVICE_OPTIONS.filter((option) => addedOptionIds.includes(option.id)), [addedOptionIds]);
  const customizeTotal = useMemo(() => sumPackageItems(customizedItems) + addedOptions.reduce((sum, option) => sum + Number(option.price ?? 0), 0), [customizedItems, addedOptions]);
  const orderTotal = useMemo(() => {
    const itemTotal = sumPackageItems(selectedPackage?.items ?? []);
    return Number(selectedPackage?.priceFrom ?? 0) || itemTotal;
  }, [selectedPackage]);

  const canProceed = () => {
    const step = state.currentStep;
    if (step === 0) return Boolean(state.stay.arrivalDate && state.stay.departureDate && state.stay.nights > 0);
    if (step === 6) return Boolean(state.contact.name && state.contact.phone);
    return true;
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const metadata = {
        package_builder: true,
        package_intent: "composer_from_scratch",
        package_title: undefined,
        stay: {
          arrival_date: state.stay.arrivalDate,
          departure_date: state.stay.departureDate,
          nights: state.stay.nights,
          adults: state.stay.adults,
          children: state.stay.children,
          origin: state.stay.origin || undefined,
          trip_style: state.stay.tripStyle,
          budget: state.stay.budget || undefined,
          objective: state.stay.objective || undefined,
        },
        apartment: state.apartment.type === "selected" ? {
          id: state.apartment.apartment.id,
          slug: state.apartment.apartment.slug,
          title: state.apartment.apartment.title,
          district: state.apartment.apartment.district,
          price_per_night: state.apartment.apartment.pricePerNight,
        } : state.apartment.type === "recommendation" ? { requested: true } : null,
        transfers: state.transfers.map((t) => ({
          type: t.type,
          airport: t.airport,
          date: t.date || undefined,
          time: t.time || undefined,
          flight_number: t.flightNumber || undefined,
          luggage_count: t.luggageCount,
        })),
        vehicle: state.vehicle.type === "selected" ? {
          id: state.vehicle.vehicle.id,
          slug: state.vehicle.vehicle.slug,
          title: state.vehicle.vehicle.title,
          service_type: state.vehicle.serviceType,
          days: state.vehicle.days,
        } : state.vehicle.type === "recommendation" ? {
          requested: true,
          service_type: state.vehicle.serviceType,
          days: state.vehicle.days,
        } : null,
        experiences: state.experiences.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date || undefined,
          people: e.people,
          price: e.price,
        })),
        services: state.services.map((s) => ({
          id: s.id,
          label: s.label,
          price: s.price,
          details: s.details || undefined,
        })),
        pricing_breakdown: {
          entries: pricing.entries,
          subtotals: pricing.subtotals,
          estimated_total: pricing.estimatedTotal,
        },
      };

      const expCount = state.experiences.length;
      const expList = state.experiences.map((e) => e.title).join(", ");
      const summary = [
        `Package sur mesure — ${state.stay.nights} nuits`,
        `— ${state.stay.adults} adulte${state.stay.adults > 1 ? "s" : ""}${state.stay.children > 0 ? `, ${state.stay.children} enfant${state.stay.children > 1 ? "s" : ""}` : ""}`,
        state.apartment.type === "selected" ? `— Appartement : ${state.apartment.apartment.title}` : state.apartment.type === "recommendation" ? "— Hébergement : sur recommandation" : "",
        state.transfers.length > 0 ? `— ${state.transfers.length} transfert${state.transfers.length > 1 ? "s" : ""} aéroport` : "",
        state.vehicle.type !== "none" ? `— Véhicule avec chauffeur` : "",
        expCount > 0 ? `— ${expCount} expérience${expCount > 1 ? "s" : ""} : ${expList}` : "",
        state.services.length > 0 ? `— ${state.services.length} service${state.services.length > 1 ? "s" : ""} complémentaire${state.services.length > 1 ? "s" : ""}` : "",
        `— Total estimatif : ${formatPrice(pricing.estimatedTotal)}`,
      ].filter(Boolean).join(" ");

      const packageContext = selectedPackage
        ? `Pack demande : ${selectedPackage.title}.`
        : basePackage
          ? `Pack a personnaliser depuis : ${basePackage.title}.`
          : "";
      const message = `Bonjour Yakout, je souhaite organiser mon séjour à Marrakech. ${packageContext} ${summary}`;

      const payload = {
        request_type: "package",
        source: "package_builder",
        name: state.contact.name,
        phone: state.contact.phone,
        email: state.contact.email || undefined,
        message,
        metadata,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      };

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          toast.error(body?.error || "La demande n'a pas pu être envoyée.");
          return;
        }

        setSubmitted(true);
        toast.success("Demande envoyée ! Yakout vous recontactera rapidement.");
      } catch {
        toast.error("Une erreur est survenue. Veuillez réessayer.");
      }
    });
  };

  const submitPackFlow = (intent: "order" | "customize") => {
    const pack = intent === "order" ? selectedPackage : basePackage;
    if (!pack) return;
    startTransition(async () => {
      const selectedItems = intent === "order" ? pack.items : customizedItems;
      const removed = intent === "customize" ? removedItems : [];
      const added = intent === "customize" ? addedOptions : [];
      const estimatedTotal = intent === "order" ? orderTotal : customizeTotal;
      const hasUnpricedItems = selectedItems.some((item) => !Number(item.priceAmount)) || (intent === "order" && !Number(pack.priceFrom));
      const pricingBreakdown = {
        entries: [
          ...selectedItems.map((item) => ({ label: item.title, amount: Number(item.priceAmount ?? 0), type: "package_item" })),
          ...added.map((item) => ({ label: item.label, amount: Number(item.price ?? 0), type: "added_option" })),
        ],
        estimated_total: estimatedTotal,
        has_unpriced_items: hasUnpricedItems,
      };
      const metadata = intent === "order" ? {
        package_intent: "order",
        selected_package_slug: pack.slug,
        selected_package_title: pack.title,
        package_items: selectedItems,
        estimated_total: estimatedTotal,
        has_unpriced_items: hasUnpricedItems,
        pricing_breakdown: pricingBreakdown,
        stay: getStayMetadata(state),
      } : {
        package_intent: "customize",
        base_package_slug: pack.slug,
        base_package_title: pack.title,
        selected_items: selectedItems,
        removed_items: removed,
        added_items: added,
        estimated_total: estimatedTotal,
        has_unpriced_items: hasUnpricedItems,
        pricing_breakdown: pricingBreakdown,
        stay: getStayMetadata(state),
      };
      const summary = intent === "order"
        ? `Demande de pack pret — ${pack.title} — ${selectedItems.length} elements inclus — arrivee le ${state.stay.arrivalDate || "a confirmer"} — ${state.stay.adults} adulte${state.stay.adults > 1 ? "s" : ""} — total estimatif : ${formatPrice(estimatedTotal)}.`
        : `Personnalisation du pack ${pack.title} — elements conserves : ${selectedItems.map((item) => item.title).join(", ") || "a confirmer"} — elements retires : ${removed.map((item) => item.title).join(", ") || "aucun"} — options ajoutees : ${added.map((item) => item.label).join(", ") || "aucune"} — total estimatif : ${formatPrice(estimatedTotal)}.`;

      const payload = {
        request_type: "package",
        source: intent === "order" ? "package_order" : "package_customize",
        related_type: "package",
        related_slug: pack.slug,
        name: state.contact.name,
        phone: state.contact.phone,
        email: state.contact.email || undefined,
        message: state.contact.message ? `${summary}\n\n${state.contact.message}` : summary,
        metadata,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      };

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          toast.error(body?.error || "La demande n'a pas pu etre envoyee.");
          return;
        }
        setSubmitted(true);
        toast.success("Demande envoyee ! Yakout vous recontactera rapidement.");
      } catch {
        toast.error("Une erreur est survenue. Veuillez reessayer.");
      }
    });
  };

  if (submitted) {
    return <SuccessScreen name={state.contact.name} />;
  }

  if (mode === "order" && selectedPackage) {
    return (
      <OrderPackageView
        pack={selectedPackage}
        stay={state.stay}
        contact={state.contact}
        total={orderTotal}
        isPending={isPending}
        onStayChange={(stay) => dispatch({ type: "SET_STAY", payload: stay })}
        onContactChange={(patch) => dispatch({ type: "SET_CONTACT", payload: patch })}
        onSubmit={() => submitPackFlow("order")}
      />
    );
  }

  if (mode === "customize" && basePackage) {
    return (
      <CustomizePackageView
        pack={basePackage}
        stay={state.stay}
        contact={state.contact}
        selectedItemIds={selectedItemIds}
        addedOptionIds={addedOptionIds}
        total={customizeTotal}
        isPending={isPending}
        onStayChange={(stay) => dispatch({ type: "SET_STAY", payload: stay })}
        onContactChange={(patch) => dispatch({ type: "SET_CONTACT", payload: patch })}
        onToggleItem={(id) => setSelectedItemIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id])}
        onToggleOption={(id) => setAddedOptionIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id])}
        onSubmit={() => submitPackFlow("customize")}
      />
    );
  }

  const step = state.currentStep;

  const renderStep = () => {
    switch (step) {
      case 0: return <StayInfoStep stay={state.stay} onChange={(s) => dispatch({ type: "SET_STAY", payload: s })} />;
      case 1: return <ApartmentSelectionStep apartments={data.apartments} value={state.apartment} nights={state.stay.nights} onChange={(v) => dispatch({ type: "SET_APARTMENT", payload: v })} />;
      case 2: return <TransferSelectionStep transfers={state.transfers} onAdd={(t) => dispatch({ type: "ADD_TRANSFER", payload: t })} onRemove={(id) => dispatch({ type: "REMOVE_TRANSFER", payload: id })} />;
      case 3: return <VehicleSelectionStep vehicles={data.vehicles} value={state.vehicle} onChange={(v) => dispatch({ type: "SET_VEHICLE", payload: v })} />;
      case 4: return <ExperienceSelectionStep experiences={data.experiences} selected={state.experiences} onAdd={(e) => dispatch({ type: "ADD_EXPERIENCE", payload: e })} onRemove={(id) => dispatch({ type: "REMOVE_EXPERIENCE", payload: id })} onUpdate={(id, patch) => dispatch({ type: "UPDATE_EXPERIENCE", payload: { id, ...patch } })} adults={state.stay.adults} childCount={state.stay.children} />;
      case 5: return <ExtraServicesStep selected={state.services} onAdd={(s) => dispatch({ type: "ADD_SERVICE", payload: s })} onRemove={(id) => dispatch({ type: "REMOVE_SERVICE", payload: id })} onUpdate={(id, details) => dispatch({ type: "UPDATE_SERVICE", payload: { id, details } })} />;
      case 6: return <ContactFormStep contact={state.contact} onChange={(patch) => dispatch({ type: "SET_CONTACT", payload: patch })} onSubmit={handleSubmit} isPending={isPending} total={formatPrice(pricing.estimatedTotal)} />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 lg:py-12">
      {(selectedPackage || basePackage) ? (
        <div className="mb-6 rounded-sm border border-gold/20 bg-gold/8 p-4 shadow-elevation-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            {selectedPackage ? "Pack demande" : "Base de personnalisation"}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{(selectedPackage ?? basePackage)?.title}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            Les elements du modele sont transmis a Yakout avec votre demande. Vous pouvez ajouter ou retirer des options dans le builder.
          </p>
        </div>
      ) : null}

      {/* Progress header */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Composez votre séjour</p>
          <p className="text-xs text-muted-foreground/60">
            {step + 1} / {STEP_LABELS.length}
          </p>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i === step ? "bg-gold shadow-glow-gold" : i < step ? "bg-gold/40" : "bg-border/30"
              }`}
            />
          ))}
        </div>
        <div className="mt-4">
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">{STEP_LABELS[step]}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground/60">{STEP_DESCRIPTIONS[step]}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="min-h-[400px]">
          {renderStep()}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between border-t border-border/20 pt-6">
            <div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_STEP", payload: step - 1 })}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-gold/30 hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_STEP", payload: step + 1 })}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold disabled:pointer-events-none disabled:opacity-40"
                >
                  Suivant
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop summary (hidden on mobile — handled by sticky bottom) */}
        <div className="hidden lg:block">
          <SummarySticky state={state} pricing={pricing} />
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="lg:hidden">
        <SummarySticky state={state} pricing={pricing} />
      </div>
    </div>
  );
}

function OrderPackageView({
  pack,
  stay,
  contact,
  total,
  isPending,
  onStayChange,
  onContactChange,
  onSubmit,
}: {
  pack: PackageContext;
  stay: StayInfo;
  contact: ContactInfo;
  total: number;
  isPending: boolean;
  onStayChange: (stay: StayInfo) => void;
  onContactChange: (patch: Partial<ContactInfo>) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="container mx-auto grid gap-8 px-4 py-8 md:px-8 lg:grid-cols-[1fr_360px] lg:py-12">
      <div className="space-y-8">
        <div className="rounded-sm border border-gold/20 bg-gold/8 p-5 shadow-elevation-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Demandez ce pack</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Vous demandez le pack : {pack.title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Confirmez vos dates et vos coordonnees. Yakout reprend ce pack tel quel et vous confirme disponibilites, prix final et organisation.
          </p>
        </div>

        <PackageItemsPanel pack={pack} selectedIds={pack.items.map((item) => item.id)} />
        <StayInfoStep stay={stay} onChange={onStayChange} />
        <ContactFormStep contact={contact} onChange={onContactChange} onSubmit={onSubmit} isPending={isPending} total={formatPrice(total)} />
      </div>
      <PackageSummaryAside pack={pack} total={total} intent="order" />
    </div>
  );
}

function CustomizePackageView({
  pack,
  stay,
  contact,
  selectedItemIds,
  addedOptionIds,
  total,
  isPending,
  onStayChange,
  onContactChange,
  onToggleItem,
  onToggleOption,
  onSubmit,
}: {
  pack: PackageContext;
  stay: StayInfo;
  contact: ContactInfo;
  selectedItemIds: string[];
  addedOptionIds: string[];
  total: number;
  isPending: boolean;
  onStayChange: (stay: StayInfo) => void;
  onContactChange: (patch: Partial<ContactInfo>) => void;
  onToggleItem: (id: string) => void;
  onToggleOption: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="container mx-auto grid gap-8 px-4 py-8 md:px-8 lg:grid-cols-[1fr_360px] lg:py-12">
      <div className="space-y-8">
        <div className="rounded-sm border border-gold/20 bg-gold/8 p-5 shadow-elevation-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Personnalisez ce modele de sejour</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Personnalisez : {pack.title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Nous avons precharge ce modele. Gardez uniquement ce qui vous convient, retirez le reste, puis ajoutez des options.
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-5 shadow-elevation-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gold" />
            <h2 className="text-lg font-semibold">Elements inclus dans ce modele</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {pack.items.map((item) => {
              const checked = selectedItemIds.includes(item.id);
              return (
                <label key={item.id} className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition ${checked ? "border-gold/30 bg-gold/8" : "border-border/60 bg-surface/30 opacity-75"}`}>
                  <input type="checkbox" checked={checked} onChange={() => onToggleItem(item.id)} className="mt-1 accent-gold" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <span className="text-xs font-semibold text-gold">{formatPackageItemPrice(item.priceAmount)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description || "Inclus dans le modele, ajustable selon disponibilites."}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5 shadow-elevation-1">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-gold" />
            <h2 className="text-lg font-semibold">Ajoutez des options a votre pack</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {EXTRA_SERVICE_OPTIONS.map((option) => {
              const checked = addedOptionIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onToggleOption(option.id)}
                  className={`rounded-sm border p-4 text-left transition ${checked ? "border-gold/30 bg-gold/10 text-foreground" : "border-border/60 bg-surface/30 text-muted-foreground hover:border-gold/25"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium">{option.label}</span>
                    {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" /> : null}
                  </span>
                  <span className="mt-2 block text-xs text-gold">{formatPackageItemPrice(option.price)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <StayInfoStep stay={stay} onChange={onStayChange} />
        <ContactFormStep contact={contact} onChange={onContactChange} onSubmit={onSubmit} isPending={isPending} total={formatPrice(total)} />
      </div>
      <PackageSummaryAside pack={pack} total={total} intent="customize" selectedIds={selectedItemIds} addedOptionIds={addedOptionIds} />
    </div>
  );
}

function PackageItemsPanel({ pack, selectedIds }: { pack: PackageContext; selectedIds: string[] }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-elevation-1">
      <h2 className="text-lg font-semibold">Elements inclus</h2>
      <div className="mt-5 grid gap-3">
        {pack.items.filter((item) => selectedIds.includes(item.id)).map((item, index) => (
          <div key={item.id} className="flex gap-3 rounded-sm border border-border/60 bg-surface/30 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-xs font-semibold text-gold">{index + 1}</span>
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description || "Inclus dans le pack."}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackageSummaryAside({ pack, total, intent, selectedIds, addedOptionIds }: { pack: PackageContext; total: number; intent: "order" | "customize"; selectedIds?: string[]; addedOptionIds?: string[] }) {
  const selected = selectedIds ? pack.items.filter((item) => selectedIds.includes(item.id)) : pack.items;
  const removed = selectedIds ? pack.items.filter((item) => !selectedIds.includes(item.id)) : [];
  const added = EXTRA_SERVICE_OPTIONS.filter((option) => (addedOptionIds ?? []).includes(option.id));
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-sm border border-border bg-card p-5 shadow-elevation-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
          {intent === "order" ? "Commande du pack" : "Resume personnalisation"}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{pack.title}</h2>
        {pack.shortDescription ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{pack.shortDescription}</p> : null}
        <div className="mt-5 rounded-sm border border-gold/20 bg-gold/8 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total estimatif</p>
          <p className="mt-1 font-display text-3xl font-semibold text-gold">{formatPrice(total)}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Certains services peuvent etre confirmes par Yakout selon les disponibilites.</p>
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <SummaryList title="Conserves" items={selected.map((item) => item.title)} />
          {removed.length > 0 ? <SummaryList title="Retires" items={removed.map((item) => item.title)} muted /> : null}
          {added.length > 0 ? <SummaryList title="Ajoutes" items={added.map((item) => item.label)} /> : null}
        </div>
      </div>
    </aside>
  );
}

function SummaryList({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <div key={item} className={`flex items-center gap-2 ${muted ? "text-muted-foreground/55" : "text-muted-foreground"}`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-gold/70" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function sumPackageItems(items: PackageContext["items"]) {
  return items.reduce((sum, item) => sum + Number(item.priceAmount ?? 0), 0);
}

function getStayMetadata(state: ReturnType<typeof createInitialState>) {
  return {
    arrival_date: state.stay.arrivalDate,
    departure_date: state.stay.departureDate,
    nights: state.stay.nights,
    adults: state.stay.adults,
    children: state.stay.children,
    origin: state.stay.origin || undefined,
    trip_style: state.stay.tripStyle,
    budget: state.stay.budget || undefined,
    objective: state.stay.objective || undefined,
  };
}

function formatPackageItemPrice(value?: number | null) {
  return Number(value ?? 0) > 0 ? formatPrice(Number(value)) : "Sur estimation";
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
          <Check className="h-10 w-10 text-gold" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">Demande envoyée !</h2>
          <p className="text-sm text-muted-foreground/70">
             Merci {name} ! Votre demande de séjour a bien été reçue. L&apos;équipe Yakout vous recontactera dans les plus brefs délais pour finaliser votre expérience à Marrakech.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={buildWhatsAppUrl(site.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter sur WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-border/60 px-6 py-3 text-sm font-medium text-foreground transition hover:border-gold/30"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
