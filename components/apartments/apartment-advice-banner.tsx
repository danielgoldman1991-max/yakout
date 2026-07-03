import { PremiumButton } from "@/components/ui/premium-button";
import { ArrowRight } from "lucide-react";

export function ApartmentAdviceBanner() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-sm border border-gold/10 bg-gradient-to-br from-surface-elevated to-surface px-10 py-14 text-center md:px-16 md:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold/5 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Conseil personnalisé
            </p>
            <h2 className="mt-4 font-display text-[clamp(1.4rem,3vw,2.4rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              Vous hésitez entre plusieurs appartements&nbsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">
              Indiquez-nous vos dates, le nombre de voyageurs et le style de séjour recherché. Yakout vous proposera le logement et les services les plus adaptés.
            </p>
            <div className="mt-8">
              <PremiumButton href="/contact?type=reservation" variant="primary">
                Recevoir une recommandation <ArrowRight className="h-4 w-4" />
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
