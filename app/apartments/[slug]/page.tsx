import type { Metadata } from "next";
import Link from "next/link";
import type { ElementType } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, BedDouble, Check, CheckCircle, HeartHandshake, HelpCircle, MapPin, MessageCircle, Shield, ShoppingCart, Sparkles, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { SectionHeader } from "@/components/ui/section-header";
import { ApartmentGallery } from "@/components/public/apartment-gallery";
import { getApartmentBySlug } from "@/lib/data";
import { getApartmentImages } from "@/lib/data/apartments";
import { formatCurrency } from "@/lib/formatters";
import { normalizeListItems } from "@/lib/utils/lists";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) return { title: "Appartement introuvable" };
  return {
    title: apartment.meta_title || `${apartment.public_name} - ${apartment.district}, Marrakech | Yakout`,
    description: apartment.meta_description || apartment.short_description || `Appartement a ${apartment.district}, Marrakech.`,
    openGraph: {
      title: `${apartment.public_name} - ${apartment.district} | Yakout Marrakech`,
      description: apartment.meta_description || apartment.short_description,
      images: apartment.image_url ? [{ url: apartment.image_url }] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ApartmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();

  const images = await getApartmentImages(apartment.id);
  const title = apartment.public_name || apartment.internal_name;
  const district = apartment.address_public_hint || apartment.district;
  const price = apartment.price_per_night ?? apartment.price_from;
  const description = apartment.detailed_description || apartment.description || apartment.short_description || "";
  const paragraphs = normalizeListItems(description.split(/\n{1,}/));
  const highlights = normalizeListItems(apartment.highlights?.length ? apartment.highlights : [
    "Bien selectionne par Yakout",
    "Disponibilite sur demande",
    "Accompagnement local",
  ]);
  const amenities = normalizeListItems(apartment.amenities?.length ? apartment.amenities : ["Wi-Fi", "Climatisation", "Cuisine equipee"]);
  const rules = normalizeListItems(apartment.house_rules?.length ? apartment.house_rules : ["Respect du voisinage", "Check-in sur demande"]);
  const reservationHref = `/contact?type=reservation&apartment=${apartment.slug}`;
  const whatsappMsg = `Bonjour Yakout, je souhaite reserver l'appartement ${title} a ${district}.`;

  const services = [
    { icon: HeartHandshake, title: "Conciergerie", description: "Accueil et assistance tout au long de votre sejour.", href: "/concierge" },
    { icon: Users, title: "Chauffeur prive", description: "Transferts aeroport et deplacements avec chauffeur.", href: "/chauffeur" },
    { icon: ShoppingCart, title: "Courses avant arrivee", description: "Frigo rempli selon vos preferences a l'arrivee.", href: "/contact?type=services" },
    { icon: MessageCircle, title: "Assistance WhatsApp", description: "Equipe disponible 7j/7 pour toute question.", href: "/contact?type=general" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main>
        <ApartmentGallery
          apartment={apartment}
          images={images}
          title={title}
          district={district}
          price={price}
          capacity={apartment.capacity}
          bedrooms={apartment.bedrooms}
          bathrooms={apartment.bathrooms}
          beds={apartment.beds}
          hasTerrace={apartment.has_terrace}
          hasParking={apartment.has_parking}
          minimumNights={apartment.minimum_nights}
        />

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-6 md:px-12">
            <Link href="/apartments" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-gold">
              <ArrowRight className="h-3 w-3 rotate-180" />
              Retour aux appartements
            </Link>
          </div>
          <div className="container mx-auto px-6 pb-10 md:px-12 md:pb-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                {paragraphs.length > 0 && (
                  <div className="mt-6">
                    <SectionHeader label="Apercu" title="Le logement" />
                    <div className="mt-5 max-w-prose space-y-4 text-[15px] leading-7 text-muted-foreground">
                      {paragraphs.map((p, i) => <p key={`desc-${i}`}>{p}</p>)}
                    </div>
                  </div>
                )}

                <ListSection sectionKey="highlights" label="Points forts" title="Ce que vous allez apprecier" items={highlights} icon={Sparkles} />
                <ListSection sectionKey="amenities" label="Equipements" title="Confort & equipements" items={amenities} icon={Check} />
                <ListSection sectionKey="conditions" label="Conditions" title="A savoir avant votre sejour" items={[
                  apartment.check_in_time ? `Check-in : ${apartment.check_in_time}` : "Check-in sur demande",
                  apartment.check_out_time ? `Check-out : ${apartment.check_out_time}` : "Check-out sur demande",
                  ...rules,
                ]} icon={Shield} />

                <div className="mt-10 border-t border-border pt-8">
                  <SectionHeader label="Services Yakout" title="Completez votre sejour avec Yakout" description="Des services sur mesure pour rendre votre sejour fluide et agreable." />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {services.map((s, i) => (
                      <ServiceCard key={`service-${i}`} icon={s.icon} title={s.title} description={s.description} href={s.href} />
                    ))}
                  </div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-sm border border-gold/20 bg-card shadow-elevation-2">
                  <div className="border-b border-border/60 px-6 py-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Demander ce logement</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">A partir de</p>
                    <p className="mt-1 font-display text-3xl text-gold">{formatCurrency(price)} <span className="text-sm text-muted-foreground">/ nuit</span></p>

                    <div className="mt-5 space-y-2 border-t border-border/40 pt-5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-gold" />{district}, Marrakech</span>
                      <span className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-gold" />{apartment.capacity} voyageurs</span>
                      <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 shrink-0 text-gold" />{apartment.bedrooms ?? 0} chambre{(apartment.bedrooms ?? 0) > 1 ? "s" : ""}</span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Disponibilite sur demande</p>
                      <p className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Accompagnement Yakout</p>
                    </div>

                    <PremiumButton href={reservationHref} variant="primary" className="mt-6 w-full">
                      Demander ce logement <ArrowRight className="h-4 w-4" />
                    </PremiumButton>

                    <Link
                      href="/contact?type=reservation"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                    >
                      Besoin d&apos;une recommandation ?
                    </Link>

                    <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
                      Envoyez votre demande, Yakout vous confirme la disponibilite et vous accompagne dans l&apos;organisation du sejour.
                    </p>
                  </div>

                  <div className="border-t border-border/60 px-6 py-4">
                    <Link
                      href={buildWhatsAppUrl(whatsappMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold/70 transition hover:text-gold"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Disponibilite rapide par WhatsApp
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <HelpCircle className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 font-display text-2xl text-foreground md:text-3xl">
                Vous ne savez pas quel appartement choisir&nbsp;?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">
                Indiquez vos dates et vos preferences. Yakout vous recommande le logement le plus adapte parmi notre selection.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <PremiumButton href="/contact?type=reservation" variant="primary">
                  Demander une recommandation <ArrowRight className="h-4 w-4" />
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto px-6 py-16 text-center md:px-12 md:py-20">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Vous aimez ce logement&nbsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">
              Envoyez votre demande, nous vous confirmons la disponibilite et les meilleures options pour votre sejour a Marrakech.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href={reservationHref} variant="primary">
                Demander ce logement <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl(whatsappMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Disponibilite par WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ListSection({ sectionKey, label, title, items, icon: Icon }: { sectionKey: string; label: string; title: string; items: string[]; icon: ElementType }) {
  const safeItems = normalizeListItems(items);
  if (safeItems.length === 0) return null;

  return (
    <div className="mt-10">
      <SectionHeader label={label} title={title} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {safeItems.map((item, index) => (
          <div key={`${sectionKey}-${item}-${index}`} className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 transition-colors hover:border-gold/20 hover:bg-gold/[0.02]">
            <Icon className="h-4 w-4 shrink-0 text-gold" />
            <span className="text-sm text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, description, href }: { icon: ElementType; title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-sm border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-elevation-2"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-surface transition-colors group-hover:border-gold/30 group-hover:bg-gold/5">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground group-hover:text-gold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
