"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, MapPin, Clock, Home, Car, Heart } from "lucide-react";
import { site } from "@/lib/constants/site";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export function PremiumHeroV2() {
  return (
    <section className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden py-16 md:py-20">
      {/* Brand background image — Moroccan identity visible as ambiance */}
      <Image
        src={yakoutImages.brandMoroccanBg}
        alt=""
        fill
        priority
        aria-hidden
        className="object-cover opacity-45 dark:opacity-30"
      />

      {/* Warm gradient overlay — brand image shows through on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/15 to-background/0" />

      {/* Warm ambient light accents — gold + ruby */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-gold/[0.05] blur-[180px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-ruby/[0.03] blur-[150px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-amber-500/[0.03] blur-[120px]" />

      <div className="relative z-10 container mx-auto px-6 md:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
          {/* ─── Left column: content ─── */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
              <span className="ruby-diamond" />
              Marrakech · Conciergerie premium
            </div>

            <h1 className="mt-8 font-display text-[clamp(2rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              Séjours premium,{" "}
              <span className="text-gold">appartements sélectionnés</span>{" "}
              et chauffeur privé à Marrakech.
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground">
              {site.heroSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact?type=reservation"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light"
              >
                Organiser mon séjour
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={buildWhatsAppUrl(site.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border/70 px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:text-gold hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Contacter Yakout sur WhatsApp
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-sm border border-gold/10 bg-card/55 px-5 py-3 md:px-6 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-gold/8">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                </div>
                <span className="text-[13px] text-muted-foreground">Présence locale à Marrakech</span>
              </div>
              <div className="hidden h-5 w-px bg-border/60 lg:block" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-gold/8">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-gold" />
                </div>
                <span className="text-[13px] text-muted-foreground">Réponse rapide sur WhatsApp</span>
              </div>
              <div className="hidden h-5 w-px bg-border/60 lg:block" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-gold/8">
                  <Heart className="h-3.5 w-3.5 shrink-0 text-gold" />
                </div>
                <span className="text-[13px] text-muted-foreground">Séjours & biens suivis avec attention</span>
              </div>
            </div>
          </div>

          {/* ─── Right column: image + floating card ─── */}
          <div className="order-1 lg:order-2 lg:translate-y-8">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-gold/10 shadow-elevation-3 shadow-gold/5 lg:aspect-[5/4]">
                <Image
                  src={yakoutImages.hero}
                  alt={yakoutImageAlts.hero}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-l from-gold/[0.05] via-transparent to-transparent" />
              </div>

              {/* Floating premium card */}
              <div className="absolute -bottom-5 -left-5 right-8 rounded-sm border border-gold/15 bg-background/90 p-5 shadow-elevation-3 backdrop-blur-md lg:-bottom-4 lg:-left-7 lg:right-auto lg:w-64">
                <div className="flex items-center gap-2.5">
                  <span className="ruby-diamond" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                    Votre séjour, organisé avec soin
                  </span>
                </div>
                <div className="mt-3 h-px bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold/8">
                      <Home className="h-4 w-4 text-gold" />
                    </div>
                    Appartement sélectionné
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold/8">
                      <Car className="h-4 w-4 text-gold" />
                    </div>
                    Chauffeur privé
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold/8">
                      <Heart className="h-4 w-4 text-gold" />
                    </div>
                    Accompagnement local
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60">
              <Clock className="h-3.5 w-3.5 text-gold" />
              Disponible du lundi au samedi — 9h à 19h
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
