import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Users, Star, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicApartments } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Appartements sélectionnés pour vos séjours à Marrakech",
  description: "Découvrez notre sélection d'appartements premium à Marrakech. Location courte durée dans les plus beaux quartiers : Gueliz, Hivernage, Palmeraie. Confort 5 étoiles.",
  openGraph: {
    title: "Appartements premium à Marrakech - Yakout",
    description: "Appartements de standing en location à Marrakech : Gueliz, Hivernage, Palmeraie.",
  },
};

export const dynamic = "force-dynamic";

export default async function ApartmentsPage() {
  const apartments = await getPublicApartments();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Sélection immobilière</p>
              <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                Appartements sélectionnés pour vos séjours <span className="text-gold">à Marrakech</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                Des biens sélectionnés avec soin dans les meilleurs quartiers de Marrakech,
                équipés et prêts à vous accueillir pour un séjour premium.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Grille appartements premium ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            {apartments.length === 0 ? (
              <EmptyState
                title="Aucun appartement disponible pour le moment"
                description="Notre sélection s'enrichit régulièrement. Contactez-nous pour être informé des nouvelles disponibilités."
                icon={MapPin}
                action={
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, je recherche un appartement à Marrakech.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Rechercher par WhatsApp
                  </Link>
                }
              />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {apartments.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/apartments/${apt.slug}`}
                      className="group overflow-hidden rounded-sm border border-border bg-surface transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={apt.image_url || fallbackImages.apartment.url}
                          alt={`${apt.public_name} à Marrakech`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized={Boolean(apt.image_url)}
                        />
                        {apt.is_featured && (
                          <div className="absolute left-3 top-3 rounded-full bg-gold/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground">
                            <Star className="mr-1 inline h-3 w-3" /> Sélection
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 rounded-sm bg-background/80 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {apt.district}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
                          {apt.public_name}
                        </h3>
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-gold" />
                            {apt.capacity} personnes
                          </span>
                          <span>{apt.bedrooms} chambre{apt.bedrooms > 1 ? "s" : ""}</span>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                          <p className="text-lg font-light text-gold">
                            {formatCurrency(apt.price_from)}
                            <span className="text-xs text-muted-foreground"> / nuit</span>
                          </p>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition group-hover:text-gold-light">
                            Détails <ArrowRight className="ml-1 inline h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="bg-surface">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Vous ne trouvez pas ce que vous cherchez&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous directement, nous trouverons la solution adaptée à vos besoins.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact" variant="primary">
                Nous contacter <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl("Bonjour Yakout, je recherche un appartement à Marrakech.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Rechercher par WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
