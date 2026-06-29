import type { Metadata } from "next";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { LeadForm } from "@/components/public/lead-form";
import { site } from "@/lib/constants/site";
import {
  leadRequestTypes,
  leadTypeDescriptions,
  leadTypeLabels,
  leadTypePlaceholders,
  normalizeLeadRequestType,
} from "@/lib/leads";

export const metadata: Metadata = {
  title: "Organiser votre demande avec Yakout",
  description: "Contactez Yakout Conciergerie et Services à Marrakech. Formulaire de contact, WhatsApp, email et téléphone pour réserver un appartement, un chauffeur ou confier votre bien.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const requestType = normalizeLeadRequestType(type);
  const typeMessage = leadTypeDescriptions[requestType];

  return (
    <div className="min-h-screen bg-background">
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
                <p className="text-sm font-medium text-foreground">Envoyez-nous un message</p>
                <p className="mt-1 text-xs text-muted-foreground">Remplissez ce formulaire et nous vous répondons sous 24h.</p>
                <p className="mt-4 flex items-center gap-2 rounded-sm border border-gold/10 bg-gold/5 px-4 py-2 text-[11px] font-medium text-gold">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[9px]">i</span>
                  Type de demande&thinsp;: <strong>{leadTypeLabels[requestType]}</strong>
                </p>
                <div className="mt-6">
                  <LeadForm requestType={requestType} source="contact_form" messagePlaceholder={leadTypePlaceholders[requestType]} />
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
