import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export function FinalCtaV2() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="relative overflow-hidden rounded-sm border border-gold/10 bg-surface px-10 py-20 text-center md:px-20">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/6 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-ruby/[0.04] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-3">
              <span className="ruby-diamond" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Contact</p>
              <span className="ruby-diamond" />
            </div>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              Prêt à organiser votre séjour à Marrakech ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">
              Appartements, chauffeur privé, transferts et conciergerie : Yakout vous accompagne avec une approche locale, premium et réactive.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact?type=general"
                className="inline-flex h-13 items-center gap-2.5 rounded-sm bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#050505] shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light"
              >
                Faire une demande
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={buildWhatsAppUrl("Bonjour Yakout, je souhaite avoir plus d'informations sur vos services à Marrakech.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center gap-2.5 rounded-sm border border-border bg-card px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Contacter sur WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
