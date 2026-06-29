import Link from "next/link";
import { MessageCircle, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { site } from "@/lib/constants/site";
import { YakoutLogo } from "@/components/brand/yakout-logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  const footerNav = [
    { label: "Appartements", href: "/apartments" },
    { label: "Conciergerie", href: "/concierge" },
    { label: "Chauffeur privé", href: "/chauffeur" },
    { label: "Véhicules", href: "/vehicles" },
    { label: "Services", href: "/services" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="border-t border-border/40 bg-surface">
      {/* Fine gold decorative line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="container mx-auto px-6 py-16 md:px-12">
        {/* Brand signature line */}
        <div className="flex items-center gap-3">
          <span className="ruby-diamond" />
          <span className="gold-sep" />
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/50">
            Conciergerie premium à Marrakech
          </span>
        </div>

        <div className="mt-10 grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <YakoutLogo width={168} height={52} />
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              {site.heroSubtitle}
            </p>
            <p className="mt-3 text-[11px] leading-6 text-muted-foreground/50 max-w-xs">
              Conciergerie premium à Marrakech pour séjours, appartements et déplacements privés.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${site.email}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={`tel:${site.whatsappNumber}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1"
                aria-label="Téléphone"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Navigation</p>
            <ul className="mt-5 space-y-3">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition hover:text-foreground inline-flex items-center gap-1.5"
                  >
                    {item.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Contact</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a href={`tel:${site.whatsappNumber}`} className="text-sm text-muted-foreground transition hover:text-foreground">{site.phoneDisplay}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="text-sm text-muted-foreground transition hover:text-foreground">{site.email}</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                {site.address}
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Horaires</p>
            <ul className="mt-5 space-y-3">
              <li className="text-sm text-muted-foreground">Lundi — Samedi</li>
              <li className="text-sm font-medium text-foreground">9h — 19h</li>
              <li className="mt-4">
                <Link
                  href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/15 bg-gold/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold transition hover:border-gold/30 hover:bg-gold/10"
                >
                  <MessageCircle className="h-3 w-3" />
                  Réponse rapide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-border/40 pt-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="ruby-diamond ruby-diamond-sm" />
            <p className="text-xs text-muted-foreground/50">
              © {year} {site.companyName}. Tous droits réservés.
            </p>
          </div>
          <Link
            href="/dashboard/ecosystem"
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/30 transition hover:text-gold"
          >
            Espace Maria
          </Link>
        </div>
      </div>
    </footer>
  );
}
