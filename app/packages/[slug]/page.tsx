import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, Compass, MessageCircle, Sparkles, Users } from "lucide-react";
import { LeadForm } from "@/components/public/lead-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { getPackageBySlug } from "@/lib/data/transport";
import { formatCurrency } from "@/lib/formatters";
import { enrichPublicPackages, fallbackPublicPackages } from "@/lib/packages/public-packages";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const pack = await resolvePublicPackage(slug);
  if (!pack) return { title: "Pack Yakout" };
  return {
    title: `${pack.public_title ?? pack.title} | Yakout`,
    description: pack.short_description,
  };
}

export default async function PublicPackagePage({ params }: Params) {
  const { slug } = await params;
  const pack = await resolvePublicPackage(slug);
  if (!pack) notFound();

  const title = pack.public_title ?? pack.title;
  const required = pack.package_items?.filter((item) => !item.is_optional) ?? [];
  const optional = pack.package_items?.filter((item) => item.is_optional) ?? [];
  const priceLabel = pack.price_from && pack.price_from > 0 ? formatCurrency(pack.price_from) : "Sur estimation";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0">
            <Image src={pack.displayImage} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(26,20,16,0.98),rgba(34,28,22,0.82)_52%,rgba(26,20,16,0.98)),radial-gradient(circle_at_74%_20%,rgba(212,175,55,0.18),transparent_28%)]" />
          </div>
          <div className="container relative mx-auto grid gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Pack {pack.levelLabel}
              </div>
              <h1 className="mt-6 font-display text-[clamp(2.3rem,6vw,5rem)] font-semibold leading-[1.02] tracking-tight">{title}</h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-muted-foreground">{pack.short_description}</p>
              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                <InfoPill icon={<Users className="h-4 w-4" />} label={`${pack.capacity_min ?? 1}-${pack.capacity_max ?? "sur mesure"} personnes`} />
                <InfoPill icon={<CalendarDays className="h-4 w-4" />} label={pack.duration_label ?? "Duree sur mesure"} />
                <InfoPill icon={<Compass className="h-4 w-4" />} label={pack.destination ?? "Marrakech"} />
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PremiumButton href={`/contact?type=package&package=${pack.slug}&mode=order`} variant="primary" size="lg">
                  Demander ce pack <ArrowRight className="h-4 w-4" />
                </PremiumButton>
                <PremiumButton href={`/contact?type=package&basePackage=${pack.slug}&mode=customize`} variant="outline" size="lg">
                  Personnaliser
                </PremiumButton>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.055] shadow-elevation-3 backdrop-blur-xl">
              <div className="relative aspect-[4/3]">
                <Image src={pack.displayImage} alt={pack.displayImageAlt} fill priority sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">A partir de</p>
                    <p className="mt-1 font-display text-3xl font-semibold">{priceLabel}</p>
                  </div>
                  <div className="rounded-sm border border-gold/25 bg-background/70 px-3 py-2 text-right text-xs backdrop-blur">
                    <p className="font-semibold text-gold">{pack.servicesCount} services inclus</p>
                    <p className="text-muted-foreground">{pack.levelLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <div className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Experience incluse</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">Ce que le pack organise pour vous</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">{pack.description}</p>
            </div>

            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Elements inclus</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold">Composition du sejour</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {required.map((item, index) => (
                  <div key={item.id} className="rounded-sm border border-border bg-card p-5 shadow-elevation-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-sm font-semibold text-gold">{index + 1}</span>
                      <p className="font-semibold">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description || "Personnalisable selon vos dates et disponibilites."}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Ideal pour</p>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">{pack.idealFor}</p>
              </div>
              <div className="rounded-sm border border-border bg-card p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Deroule</p>
                <div className="mt-4 space-y-2">
                  {pack.flow.map((step, index) => (
                    <div key={`${step}-${index}`} className="flex gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {optional.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Options personnalisables</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {optional.map((item) => (
                    <div key={item.id} className="rounded-sm border border-border bg-card p-5">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-sm border border-border bg-card shadow-elevation-2">
              <div className="border-b border-border bg-gold/8 px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Demande de pack</p>
                <p className="mt-2 font-display text-3xl font-semibold text-gold">{priceLabel}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">Recevez une proposition ajustee a vos dates et au nombre de voyageurs.</p>
              </div>
              <div className="space-y-4 p-6">
                <LeadForm requestType="package" source="package_detail" relatedType="package" relatedSlug={pack.slug} entityName={title} />
                <Link
                  href={buildWhatsAppUrl(`Bonjour Yakout, je souhaite demander le pack ${title}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-sm border border-border bg-background/50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-gold" />
                  Demander par WhatsApp
                </Link>
                <PremiumButton href="/packages" variant="outline" className="w-full">
                  Voir tous les packs
                </PremiumButton>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

async function resolvePublicPackage(slug: string) {
  const supabasePack = await getPackageBySlug(slug);
  const pack = supabasePack ?? fallbackPublicPackages.find((item) => item.slug === slug);
  return pack ? enrichPublicPackages([pack])[0] : null;
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-muted-foreground backdrop-blur">
      <span className="text-gold">{icon}</span>
      {label}
    </div>
  );
}
