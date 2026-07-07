import Link from "next/link";
import { MessageCircle, Mail, Phone, ArrowRight, LogIn } from "lucide-react";
import { site } from "@/lib/constants/site";
import { YakoutLogo } from "@/components/brand/yakout-logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-surface">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="container mx-auto px-6 py-16 md:px-12">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <YakoutLogo width={168} height={52} />
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              Appartements sélectionnés, transport privé, packs et services sur mesure pour vos séjours à Marrakech.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href={`mailto:${site.email}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1" aria-label="Email">
                <Mail className="h-4 w-4" />
              </a>
              <a href={`tel:${site.whatsappNumber}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1" aria-label="Téléphone">
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Découvrir</p>
            <ul className="mt-5 space-y-3">
              <li><Link href="/apartments" className="text-sm text-muted-foreground transition hover:text-foreground">Appartements</Link></li>
              <li><Link href="/transport" className="text-sm text-muted-foreground transition hover:text-foreground">Transport privé</Link></li>
              <li><Link href="/packages" className="text-sm text-muted-foreground transition hover:text-foreground">Packs & Séjours</Link></li>
              <li><Link href="/services" className="text-sm text-muted-foreground transition hover:text-foreground">Services</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Propriétaires</p>
            <ul className="mt-5 space-y-3">
              <li><Link href="/contact?type=proprietaire" className="text-sm text-muted-foreground transition hover:text-foreground">Confier mon bien</Link></li>
            </ul>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Yakout</p>
            <ul className="mt-5 space-y-3">
              <li><Link href="/" className="text-sm text-muted-foreground transition hover:text-foreground">Accueil</Link></li>
              <li><Link href="/blog" className="text-sm text-muted-foreground transition hover:text-foreground">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground transition hover:text-foreground">Contact</Link></li>
              <li>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                  <LogIn className="h-4 w-4" />
                  Espace équipe
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Contact</p>
            <ul className="mt-5 space-y-3">
              <li><a href={`tel:${site.whatsappNumber}`} className="text-sm text-muted-foreground transition hover:text-foreground">{site.phoneDisplay}</a></li>
              <li><a href={`mailto:${site.email}`} className="text-sm text-muted-foreground transition hover:text-foreground">{site.email}</a></li>
              <li className="text-sm text-muted-foreground">Marrakech, Maroc</li>
            </ul>
            <div className="mt-6">
              <Link
                href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/15 bg-gold/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-gold transition hover:border-gold/30 hover:bg-gold/10"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Réponse rapide <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-border/40 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground/50">
            © {year} {site.companyName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
