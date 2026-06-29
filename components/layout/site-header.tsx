"use client";

import Link from "next/link";
import { Menu, X, MessageCircle, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/constants/site";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { YakoutLogo } from "@/components/brand/yakout-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const nav = [
  ["Accueil", "/"],
  ["Appartements", "/apartments"],
  ["Conciergerie", "/concierge"],
  ["Chauffeur privé", "/chauffeur"],
  ["Véhicules", "/vehicles"],
  ["Services", "/services"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 h-[80px] border-b border-border/50 bg-background/85 shadow-elevation-1 backdrop-blur-2xl">
        <div className="container mx-auto flex h-[80px] items-center justify-between px-6 md:px-12">
          <Link href="/" className="flex items-center gap-3">
            <YakoutLogo width={152} height={46} />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation principale">
            {nav.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-sm px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 relative ${
                    active
                      ? "text-gold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-[1px] after:bg-ruby after:rotate-45"
                      : "text-muted-foreground/75 hover:text-foreground hover:bg-gold/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/8 text-[#25D366] transition hover:bg-[#25D366]/15 hover:shadow-glow-gold md:inline-flex"
              aria-label="Contacter sur WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="hidden h-10 items-center gap-2 rounded-sm border border-gold/30 bg-gold/5 px-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-[#050505] hover:shadow-glow-gold md:inline-flex"
            >
              Organiser mon séjour
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:text-foreground md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" role="navigation" aria-label="Navigation mobile" className="absolute inset-x-0 top-[80px] border-b border-border/50 bg-background/98 shadow-elevation-3 backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-0.5 px-6 py-8">
              {nav.map(([label, href]) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className={`rounded-sm px-4 py-3.5 text-sm font-medium tracking-wide transition ${
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="mt-6 flex flex-col gap-4 border-t border-border/60 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Thème</span>
                  <ThemeToggle />
                </div>
                <Link
                  href={buildWhatsAppUrl(site.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-sm border border-[#25D366]/20 bg-[#25D366]/8 px-4 py-3.5 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Link>
                <Link
                  href="/contact"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-sm bg-gold px-4 py-3.5 text-sm font-semibold text-[#050505] shadow-elevation-1 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold"
                >
                  Organiser mon séjour
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
