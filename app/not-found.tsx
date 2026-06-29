import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-200px)] items-center justify-center pt-[80px]">
        <div className="relative text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-64 w-64 animate-glow-pulse rounded-full bg-gold/5 blur-3xl" />
          </div>
          <p className="relative font-display text-8xl font-bold text-gold/30">404</p>
          <h1 className="relative mt-4 text-2xl font-semibold text-foreground">Page introuvable</h1>
          <p className="relative mt-2 text-sm text-muted-foreground">La page que vous cherchez n&apos;existe pas ou a ete deplacee.</p>
          <Link
            href="/"
            className="relative mt-6 inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-elevation-3 hover:shadow-glow-gold"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
