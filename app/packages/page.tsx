import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PackagesExperience } from "@/components/public/packages/packages-experience";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { getPublishedPackages } from "@/lib/data/transport";
import { enrichPublicPackages, fallbackPublicPackages } from "@/lib/packages/public-packages";

export const metadata: Metadata = {
  title: "Packs & séjours à Marrakech | Yakout Conciergerie",
  description: "Composez votre séjour à Marrakech avec Yakout : hébergement sélectionné, mobilité, chauffeur privé et conciergerie selon vos besoins.",
  openGraph: {
    title: "Packs & séjours à Marrakech | Yakout Conciergerie",
    description: "Hébergement, mobilité et conciergerie réunis dans une proposition adaptée à votre séjour à Marrakech.",
    type: "website",
    images: [{ url: "/images/yakout/yakout-hero-terrace.webp", width: 1200, height: 630, alt: "Terrasse d’un hébergement sélectionné à Marrakech" }],
  },
};

export default async function PublicPackagesPage() {
  const publishedPackages = await getPublishedPackages();
  const packages = publishedPackages.length > 0 ? publishedPackages : fallbackPublicPackages;

  return (
    <div className="min-h-screen bg-background" style={{ "--yakout-floating-bottom": "5.5rem" } as CSSProperties}>
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <PackagesExperience packages={enrichPublicPackages(packages)} isFallback={publishedPackages.length === 0} />
      </main>
      <SiteFooter />
    </div>
  );
}
