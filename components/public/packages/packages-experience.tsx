import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MapPin, MessageCircle, SlidersHorizontal, UserRoundCheck } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { formatCurrency } from "@/lib/formatters";
import type { PublicPackageModel } from "@/lib/packages/public-packages";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

type Props = { packages: PublicPackageModel[]; isFallback?: boolean };

const reassurance = [
  { icon: MapPin, title: "Assistance locale", text: "Un accompagnement basé à Marrakech." },
  { icon: SlidersHorizontal, title: "Services personnalisables", text: "La proposition s’adapte à votre programme." },
  { icon: UserRoundCheck, title: "Interlocuteur unique", text: "Un échange clair avant et pendant le séjour." },
];

export function PackagesExperience({ packages, isFallback = false }: Props) {
  const generalMessage = "Bonjour, je souhaite créer un séjour à Marrakech avec Yakout. Pouvez-vous me renseigner ?";

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#120d0d] text-white">
        <Image src="/images/yakout/yakout-hero-terrace.webp" alt="Terrasse d’un hébergement sélectionné à Marrakech" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-ruby/25" />
        <div className="container relative mx-auto grid min-h-[520px] items-end px-4 py-14 sm:min-h-[560px] sm:py-20 lg:grid-cols-[1fr_0.55fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Yakout Conciergerie · Marrakech</p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Packs & séjours à Marrakech</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Hébergement, mobilité et conciergerie réunis dans une demande claire, adaptée à vos dates et à votre programme.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href={buildWhatsAppUrl(generalMessage)} variant="whatsapp" size="lg" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Créer mon séjour
              </PremiumButton>
              <PremiumButton href="#packs" variant="outline" size="lg" className="border-white/35 bg-black/20 text-white hover:bg-white/10 hover:text-white">
                Découvrir les packs
              </PremiumButton>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Une organisation plus simple</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Un séjour construit autour de vos besoins</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Les packs Yakout réunissent les éléments essentiels d’un séjour à Marrakech. Chaque demande est vérifiée avant confirmation selon les dates, le nombre de voyageurs et les services souhaités.
          </p>
        </div>

        <div id="packs" className="mt-10 scroll-mt-28">
          {isFallback && <p className="mb-5 text-center text-xs text-muted-foreground">Exemples de formules Yakout · contenu et disponibilités à confirmer lors de la demande.</p>}
          <div className="grid gap-6 md:grid-cols-2">
            {packages.map((pack) => <PackageCard key={pack.id} pack={pack} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/45">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {reassurance.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-sm border border-border/70 bg-card p-6 shadow-elevation-1">
                <Icon className="h-6 w-6 text-gold" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Les prestations et disponibilités sont confirmées avant la réservation.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 pb-28 sm:py-20">
        <div className="overflow-hidden rounded-sm border border-gold/20 bg-[linear-gradient(135deg,rgba(123,0,28,0.14),rgba(212,175,55,0.13))] p-7 text-center shadow-elevation-2 sm:p-12">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Parlons de votre séjour à Marrakech</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Indiquez vos dates, le nombre de voyageurs et les services recherchés. Yakout vous répond avec une proposition à confirmer.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <PremiumButton href={buildWhatsAppUrl(generalMessage)} variant="whatsapp" size="lg" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Créer mon séjour
            </PremiumButton>
            <PremiumButton href="/contact?type=package" variant="outline" size="lg">Utiliser le formulaire</PremiumButton>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <PremiumButton href={buildWhatsAppUrl(generalMessage)} variant="whatsapp" className="w-full" target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" /> Créer mon séjour
        </PremiumButton>
      </div>
    </>
  );
}

function PackageCard({ pack }: { pack: PublicPackageModel }) {
  const title = pack.public_title ?? pack.title;
  const items = (pack.package_items ?? []).filter((item) => !item.is_optional).slice(0, 5);
  const message = `Bonjour, je souhaite recevoir des informations sur le pack « ${title} » pour un séjour à Marrakech.`;
  const hasPrice = pack.price_from != null && Number(pack.price_from) > 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card shadow-elevation-1 transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-elevation-3">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={pack.displayImage} alt={pack.displayImageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold backdrop-blur">{pack.levelLabel}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-semibold leading-tight">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{pack.short_description}</p>
        <ul className="mt-5 space-y-3" aria-label={`Prestations du pack ${title}`}>
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm text-foreground/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />{item.title}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tarif</p>
            <p className="mt-1 font-semibold text-gold">{hasPrice ? `À partir de ${formatCurrency(Number(pack.price_from))}` : "Sur devis"}</p>
          </div>
          <Link href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-gold px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
            Demander ce pack <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
