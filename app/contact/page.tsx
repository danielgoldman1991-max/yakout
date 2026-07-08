import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { LeadForm } from "@/components/public/lead-form";
import { ApartmentBookingForm } from "@/components/public/apartment-booking-form";
import { PackageBuilder } from "@/components/public/package-builder/package-builder";
import { site } from "@/lib/constants/site";
import {
  leadRequestTypes,
  leadTypeDescriptions,
  leadTypeTitles,
  leadFormHelps,
  leadTypeLabels,
  normalizeLeadRequestType,
} from "@/lib/leads";
import { getPublicApartments } from "@/lib/data";
import { getPublicVehicles } from "@/lib/data/public-vehicles";
import { getPublishedPackages, getTransportTrips } from "@/lib/data/transport";
import { fallbackPublicPackages } from "@/lib/packages/public-packages";
import type { ApartmentSelection, VehicleSelection, ExperienceItem } from "@/components/public/package-builder/types";
import type { Package } from "@/types/business";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organiser votre demande avec Yakout",
  description: "Contactez Yakout Conciergerie et Services à Marrakech. Formulaire de contact, WhatsApp, email et téléphone pour réserver un appartement, un chauffeur ou confier votre bien.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; apartment?: string; vehicle?: string; service?: string; package?: string; basePackage?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const { type, apartment: apartmentSlug, vehicle: vehicleSlug, package: packageSlug, basePackage: basePackageSlug, mode } = params;
  const requestType = normalizeLeadRequestType(type);
  const typeMessage = leadTypeDescriptions[requestType];
  const typeTitle = leadTypeTitles[requestType];
  const typeHelp = leadFormHelps[requestType];

  let entityName: string | undefined;
  let relatedType: string | undefined;
  let relatedSlug: string | undefined;
  let selectedPackageContext: PackageContext | undefined;
  let basePackageContext: PackageContext | undefined;

  // Apartment booking form data
  let bookingApartment: {
    id: string;
    slug: string;
    public_name: string;
    district: string;
    public_district?: string;
    capacity: number;
    bedrooms: number;
    price_per_night?: number;
    price_from: number;
    image_url?: string;
  } | undefined;

  if (requestType === "reservation" && apartmentSlug) {
    relatedType = "apartment";
    relatedSlug = apartmentSlug;
    const apartments = await getPublicApartments();
    const match = apartments.find((a) => a.slug === apartmentSlug);
    entityName = match?.public_name;
    if (match) {
      bookingApartment = {
        id: match.id,
        slug: match.slug,
        public_name: match.public_name,
        district: match.district,
        public_district: match.public_district,
        capacity: match.capacity,
        bedrooms: match.bedrooms,
        price_per_night: match.price_per_night,
        price_from: match.price_from,
        image_url: match.image_url,
      };
    }
  }

  if ((requestType === "vehicule" || requestType === "transport") && vehicleSlug) {
    relatedType = "vehicle";
    relatedSlug = vehicleSlug;
    const vehicles = await getPublicVehicles();
    const match = vehicles.find((v) => v.slug === vehicleSlug);
    entityName = match?.display_name;
  }

  if (requestType === "package" && packageSlug) {
    relatedType = "package";
    relatedSlug = packageSlug;
    const packages = await getPublishedPackages();
    const match = packages.find((pack) => pack.slug === packageSlug) ?? fallbackPublicPackages.find((pack) => pack.slug === packageSlug);
    entityName = match?.public_title ?? match?.title;
    if (match) selectedPackageContext = toPackageContext(match);
  }

  if (requestType === "package" && basePackageSlug) {
    const packages = await getPublishedPackages();
    const match = packages.find((pack) => pack.slug === basePackageSlug) ?? fallbackPublicPackages.find((pack) => pack.slug === basePackageSlug);
    if (match) {
      basePackageContext = toPackageContext(match);
      entityName = entityName ?? match.public_title ?? match.title;
    }
  }

  const apartments = requestType === "reservation" ? await getPublicApartments() : [];
  const vehicles = requestType === "vehicule" || requestType === "transport" ? await getPublicVehicles() : [];

  // Load package builder data
  let builderData: {
    apartments: ApartmentSelection[];
    vehicles: VehicleSelection[];
    experiences: ExperienceItem[];
  } | null = null;

  if (requestType === "package") {
    const [apts, vehs, trips] = await Promise.all([
      getPublicApartments(),
      getPublicVehicles(),
      getTransportTrips(),
    ]);

    builderData = {
      apartments: apts.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.public_name,
        district: a.public_district ?? a.district ?? "",
        capacity: a.capacity,
        bedrooms: a.bedrooms,
        pricePerNight: a.price_per_night ?? a.price_from ?? 0,
        imageUrl: a.image_url,
      })),
      vehicles: vehs.map((v) => ({
        id: v.id,
        slug: v.slug,
        title: v.display_name,
        capacity: v.capacity,
        priceTransfer: v.price_transfer ?? v.price_from ?? 250,
        priceHalfDay: v.price_from ?? 500,
        priceFullDay: v.price_from ?? 800,
        imageUrl: v.cover_image ?? v.image_url ?? undefined,
      })),
      experiences: trips
        .filter((t) => t.trip_type === "excursion" || t.trip_type === "experience" || t.trip_type === "circuit" || !t.trip_type)
        .map((t) => ({
          id: t.id,
          title: t.title ?? t.destination ?? "Circuit",
          slug: t.id,
          destination: t.destination_label ?? t.destination ?? "",
          durationLabel: t.trip_time
            ? `${t.trip_time}${t.end_time ? ` - ${t.end_time}` : ""}`
            : "",
          price: Number(t.sold_price ?? t.amount ?? 0),
          imageUrl: undefined,
          date: t.trip_date ?? "",
          people: t.passengers_count ?? 2,
        })),
    };
  }

  // If package builder, render immersive experience
  if (requestType === "package" && builderData) {
    return (
      <div className="min-h-screen bg-background" style={{ "--yakout-floating-bottom": "5.5rem" } as CSSProperties}>
        <SiteHeader />
        <WhatsAppFloatingButton />
        <main className="pt-[80px]">
          {/* Premium hero */}

          <PackageBuilder data={builderData} selectedPackage={selectedPackageContext} basePackage={basePackageContext} mode={normalizePackageMode(mode, selectedPackageContext, basePackageContext)} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ "--yakout-floating-bottom": "4rem" } as CSSProperties}>
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Contact</p>
              <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                Organiser votre demande <span className="text-gold">avec Yakout</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">{typeMessage}</p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="rounded-sm border border-border bg-card p-8 shadow-elevation-1">
                <p className="text-sm font-medium text-foreground">{typeTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{typeHelp}</p>
                <div className="mt-6">
                  {requestType === "reservation" ? (
                    <ApartmentBookingForm
                      mode={bookingApartment ? "selected_apartment" : "apartment_search"}
                      apartment={bookingApartment}
                      source="contact_form"
                    />
                  ) : (
                    <LeadForm
                      requestType={requestType}
                      source="contact_form"
                      relatedType={relatedType}
                      relatedSlug={relatedSlug}
                      entityName={entityName}
                      apartments={apartments.map((a) => ({ id: a.id, slug: a.slug, public_name: a.public_name }))}
                      vehicles={vehicles.map((v) => ({ id: v.id, slug: v.slug, public_name: v.display_name }))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contact direct</p>
                <div className="mt-5 space-y-3">
                  <a
                    href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-sm border border-[#25D366]/20 bg-[#25D366]/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#25D366]/10 hover:shadow-glow-gold"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/15">
                      <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">{site.phoneDisplay}</p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-center gap-3 rounded-sm border border-gold/15 bg-gold/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold/10 hover:shadow-glow-gold"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
                      <Mail className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-xs text-muted-foreground">{site.email}</p>
                    </div>
                  </a>

                  <a
                    href={`tel:${site.whatsappNumber}`}
                    className="flex items-center gap-3 rounded-sm border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/15 hover:bg-gold/5 hover:shadow-glow-gold"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                      <Phone className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Téléphone</p>
                      <p className="text-xs text-muted-foreground">{site.phoneDisplay}</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coordonnées</p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-gold" />
                    {site.address}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-gold" />
                    Lun - Sam : 9h - 19h
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Types de demandes</p>
                <div className="mt-5 space-y-2">
                  {leadRequestTypes.map((key) => (
                    <a
                      key={key}
                      href={`/contact?type=${key}`}
                      className={`flex items-center justify-between rounded-sm px-3 py-2 text-xs transition-colors duration-200 hover:bg-gold/5 ${
                        requestType === key ? "bg-gold/10 font-medium text-gold" : "text-muted-foreground"
                      }`}
                    >
                      {leadTypeLabels[key]}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

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

function toPackageContext(pack: Package): PackageContext {
  return {
    slug: pack.slug,
    title: pack.public_title ?? pack.title,
    shortDescription: pack.short_description,
    durationLabel: pack.duration_label,
    imageUrl: pack.image_url,
    imageAlt: pack.image_alt_text,
    priceFrom: pack.price_from,
    items: pack.package_items?.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      priceAmount: item.price_amount,
      isOptional: item.is_optional,
    })) ?? [],
  };
}

function normalizePackageMode(mode: string | undefined, selectedPackage?: PackageContext, basePackage?: PackageContext) {
  if (selectedPackage) return "order" as const;
  if (basePackage) return "customize" as const;
  if (mode === "order" || mode === "customize") return mode;
  return "custom" as const;
}
