import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Check, ChevronRight, Clock, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ApartmentGallery } from "@/components/public/apartment-gallery";
import { ApartmentBookingCard } from "@/components/public/apartment-booking-card";
import { ApartmentShareButton } from "@/components/public/apartment-share-button";
import { getApartmentBySlug, getPublicApartments } from "@/lib/data";
import { getApartmentImages } from "@/lib/data/apartments";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { normalizeListItems } from "@/lib/utils/lists";
import type { Apartment } from "@/types/business";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const apartment = await getApartmentBySlug(slug);
  if (!apartment) return { title: "Appartement introuvable | Yakout" };
  const title = apartment.public_name || apartment.internal_name; const district = apartment.public_district || apartment.district; const capacity = positive(apartment.capacity);
  const description = apartment.meta_description || apartment.short_description || `Découvrez ${title} à ${district || "Marrakech"}${capacity ? `, pour ${capacity} voyageurs` : ""}, avec l’accompagnement Yakout.`;
  const image = apartment.image_url || fallbackImages.apartment.url;
  return { title: apartment.meta_title || `${title} — Appartement à Marrakech | Yakout`, description, alternates: { canonical: `/apartments/${slug}` }, openGraph: { title, description, type: "website", images: [{ url: image }] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

export default async function ApartmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [apartment, allApartments] = await Promise.all([getApartmentBySlug(slug), getPublicApartments()]);
  if (!apartment) notFound();
  const images = await getApartmentImages(apartment.id);
  const title = apartment.public_name || apartment.internal_name; const district = apartment.public_district || apartment.address_public_hint || apartment.district; const city = apartment.city || "Marrakech";
  const priceValue = apartment.price_per_night ?? apartment.price_from; const price = priceValue && priceValue > 0 ? priceValue : null;
  const amenities = normalizeListItems(apartment.amenities ?? []); const highlights = normalizeListItems(apartment.highlights ?? []).slice(0, 4); const rules = normalizeListItems(apartment.house_rules ?? []);
  const description = apartment.detailed_description || apartment.description || apartment.short_description || null;
  const similar = allApartments.filter((item) => item.id !== apartment.id && (item.district === apartment.district || Math.abs((item.capacity ?? 0) - (apartment.capacity ?? 0)) <= 2)).slice(0, 4);
  const facts = [pluralFact(apartment.capacity, "voyageur"), pluralFact(apartment.bedrooms, "chambre"), pluralFact(apartment.beds, "lit"), pluralFact(apartment.bathrooms, "salle de bain")].filter(Boolean);
  const propertyLabel = propertyTypeLabel(apartment.property_type);
  const jsonLd = { "@context": "https://schema.org", "@type": "VacationRental", name: title, description: apartment.short_description || undefined, url: `/apartments/${slug}`, image: images.map((image) => image.image_url ?? image.url).filter(Boolean), address: { "@type": "PostalAddress", addressLocality: city, addressRegion: district || undefined, addressCountry: "MA" }, occupancy: positive(apartment.capacity) ? { "@type": "QuantitativeValue", maxValue: apartment.capacity } : undefined };

  return <div className="min-h-screen bg-background pb-24 md:pb-0"><SiteHeader /><main><div className="mx-auto max-w-[1240px] px-4 pb-16 pt-[104px] sm:px-6 md:pt-[112px] lg:px-8">
    <nav aria-label="Fil d’Ariane" className="mb-5 text-sm text-muted-foreground"><Link href="/apartments" className="inline-flex items-center hover:text-gold md:hidden">← Appartements</Link><ol className="hidden items-center gap-2 md:flex"><li><Link href="/" className="hover:text-gold">Accueil</Link></li><ChevronRight className="h-3 w-3" /><li><Link href="/apartments" className="hover:text-gold">Appartements</Link></li><ChevronRight className="h-3 w-3" /><li className="truncate text-foreground" aria-current="page">{title}</li></ol></nav>
    <div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-4xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{[propertyLabel, district && `${district}, ${city}`].filter(Boolean).join(" · ")}</p></div><ApartmentShareButton title={title} /></div>
    <ApartmentGallery apartment={{ public_name: title, image_url: apartment.image_url, image_alt_text: apartment.image_alt_text }} images={images.map((image) => ({ id: image.id, apartment_id: apartment.id, image_url: image.image_url, image_alt_text: image.image_alt_text, sort_order: image.sort_order, is_cover: image.is_cover, url: image.url, alt_text: image.alt_text, display_order: image.display_order }))} />

    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16"><div className="min-w-0 divide-y divide-border">
      <section className="pb-8"><h2 className="font-display text-2xl font-semibold">{propertyLabel || "Logement"}{district ? ` à ${district}` : ` à ${city}`}</h2>{facts.length ? <p className="mt-2 text-base text-muted-foreground">{facts.join(" · ")}</p> : <p className="mt-2 text-sm text-muted-foreground">Les informations de capacité seront confirmées par Yakout.</p>}
        <div className="mt-7 flex items-center gap-4 rounded-2xl border border-gold/20 bg-gold/[0.04] p-5"><div className="relative h-12 w-12 overflow-hidden rounded-full border border-gold/20 bg-card"><Image src="/logo/yakout_logo_transparent_cropped.png" alt="Yakout" fill sizes="48px" className="object-contain p-2" /></div><div><h3 className="font-semibold">Géré par Yakout</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Une équipe locale vous accompagne pour la réservation, l’arrivée et les services complémentaires.</p></div></div>
      </section>
      {highlights.length > 0 && <DetailSection title="Points forts"><div className="grid gap-3 sm:grid-cols-2">{highlights.map((item) => <InfoLine key={item} icon={Sparkles}>{item}</InfoLine>)}</div></DetailSection>}
      {description && <DetailSection title="À propos de ce logement"><div className="whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{description}</div></DetailSection>}
      {(positive(apartment.bedrooms) || positive(apartment.beds)) && <DetailSection title="Où vous dormirez"><div className="max-w-sm rounded-2xl border border-border p-5"><BedDouble className="h-6 w-6" /><h3 className="mt-4 font-semibold">Couchages</h3><p className="mt-1 text-sm text-muted-foreground">{[pluralFact(apartment.bedrooms, "chambre"), pluralFact(apartment.beds, "lit")].filter(Boolean).join(" · ")}</p></div></DetailSection>}
      {amenities.length > 0 && <DetailSection title="Ce que propose ce logement"><div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{amenities.slice(0, 10).map((item) => <InfoLine key={item} icon={Check}>{item}</InfoLine>)}</div>{amenities.length > 10 && <details className="mt-6 rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Afficher les {amenities.length} équipements</summary><div className="mt-5 grid gap-4 sm:grid-cols-2">{amenities.map((item) => <InfoLine key={item} icon={Check}>{item}</InfoLine>)}</div></details>}</DetailSection>}
      <DetailSection title="Disponibilités"><p className="text-[15px] leading-7 text-muted-foreground">Choisissez vos dates dans la carte de réservation. Yakout vérifie les réservations confirmées et les options existantes sans exposer les informations des voyageurs.</p></DetailSection>
      <DetailSection title="Où se situe le logement"><div className="rounded-2xl border border-border bg-gradient-to-br from-sand/20 to-gold/5 p-6"><MapPin className="h-6 w-6 text-gold" /><h3 className="mt-4 text-lg font-semibold">{district ? `${district}, ${city}` : city}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">L’adresse exacte sera communiquée après confirmation de la réservation.</p></div></DetailSection>
      <DetailSection title="À savoir"><div className="grid gap-6 md:grid-cols-3"><RuleGroup title="Règles du logement" icon={Clock} items={[apartment.check_in_time ? `Arrivée à partir de ${apartment.check_in_time}` : null, apartment.check_out_time ? `Départ avant ${apartment.check_out_time}` : null, ...rules]} /><RuleGroup title="Sécurité" icon={ShieldCheck} items={[]} /><RuleGroup title="Conditions" icon={Users} items={[positive(apartment.capacity) ? `${apartment.capacity} voyageurs maximum` : null, positive(apartment.minimum_nights) ? `${apartment.minimum_nights} nuit${apartment.minimum_nights! > 1 ? "s" : ""} minimum` : null]} /></div></DetailSection>
    </div><aside className="hidden lg:block"><div className="sticky top-24"><ApartmentBookingCard apartmentId={apartment.id} slug={apartment.slug} price={price} currency={apartment.currency || "MAD"} capacity={positive(apartment.capacity)} minimumNights={positive(apartment.minimum_nights)} /></div></aside></div>

    <div id="reservation-mobile" className="mt-12 md:hidden"><ApartmentBookingCard apartmentId={apartment.id} slug={apartment.slug} price={price} currency={apartment.currency || "MAD"} capacity={positive(apartment.capacity)} minimumNights={positive(apartment.minimum_nights)} /></div>
    {similar.length > 0 && <section className="mt-16 border-t border-border pt-12"><h2 className="font-display text-2xl font-semibold">Vous aimerez peut-être aussi</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((item) => <SimilarCard key={item.id} apartment={item} />)}</div></section>}
  </div></main><SiteFooter />
  <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur md:hidden"><div>{price ? <><p className="text-xs text-muted-foreground">À partir de</p><p className="font-semibold">{formatCurrency(price)} <span className="text-xs font-normal">/ nuit</span></p></> : <p className="font-semibold">Tarif sur demande</p>}</div><a href="#reservation-mobile" className="inline-flex min-h-12 items-center rounded-xl bg-gold px-5 text-sm font-semibold text-primary-foreground">Vérifier</a></div>
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /></div>;
}

function positive(value?: number | null) { return value && value > 0 ? value : null; }
function pluralFact(value: number | null | undefined, word: string) { const amount = positive(value); return amount ? `${amount} ${word}${amount > 1 ? "s" : ""}` : null; }
function propertyTypeLabel(value?: string) { const labels: Record<string, string> = { apartment: "Appartement entier", studio: "Studio", villa: "Villa", riad: "Riad", house: "Maison", private_room: "Chambre privée", penthouse: "Penthouse" }; return value ? labels[value] ?? value : null; }
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="py-9"><h2 className="font-display text-2xl font-semibold">{title}</h2><div className="mt-6">{children}</div></section>; }
function InfoLine({ icon: Icon, children }: { icon: typeof Check; children: React.ReactNode }) { return <div className="flex min-h-11 items-center gap-3 text-sm"><Icon className="h-5 w-5 shrink-0 text-gold" /><span>{children}</span></div>; }
function RuleGroup({ title, icon: Icon, items }: { title: string; icon: typeof Clock; items: Array<string | null> }) { const valid = items.filter(Boolean) as string[]; if (!valid.length) return null; return <div><Icon className="h-5 w-5 text-gold" /><h3 className="mt-3 font-semibold">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{valid.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function SimilarCard({ apartment }: { apartment: Apartment }) { const price = apartment.price_per_night ?? apartment.price_from; const image = apartment.image_url || fallbackImages.apartment.url; return <Link href={`/apartments/${apartment.slug}`} className="group"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface"><Image src={image} alt={apartment.image_alt_text || `${apartment.public_name} à Marrakech`} fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" unoptimized={!image.startsWith("/")} /></div><h3 className="mt-3 font-semibold group-hover:text-gold">{apartment.public_name}</h3><p className="mt-1 text-sm text-muted-foreground">{apartment.public_district || apartment.district}{positive(apartment.capacity) ? ` · ${apartment.capacity} voyageurs` : ""}</p><p className="mt-1 text-sm font-medium">{price > 0 ? `${formatCurrency(price)} / nuit` : "Sur demande"}</p></Link>; }
