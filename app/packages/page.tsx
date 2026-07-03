import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PackagesExperience } from "@/components/public/packages/packages-experience";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { getPublishedPackages } from "@/lib/data/transport";
import { enrichPublicPackages, fallbackPublicPackages } from "@/lib/packages/public-packages";

export const metadata: Metadata = {
  title: "Packs & sejours sur mesure a Marrakech | Yakout",
  description: "Packs prets et sejours sur mesure a Marrakech : appartement, transfert aeroport, chauffeur, circuits Ourika ou Agafay et services premium.",
};

export default async function PublicPackagesPage() {
  const publishedPackages = await getPublishedPackages();
  const packages = publishedPackages.length > 0 ? publishedPackages : fallbackPublicPackages;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <PackagesExperience packages={enrichPublicPackages(packages)} isFallback={publishedPackages.length === 0} />
      </main>
      <SiteFooter />
    </div>
  );
}
