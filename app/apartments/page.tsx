import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { ApartmentsHero } from "@/components/apartments/apartments-hero";
import { ApartmentSearchBar } from "@/components/apartments/apartment-search-bar";
import { ApartmentFiltersDrawer } from "@/components/apartments/apartment-filters-drawer";
import { ApartmentResultsHeader } from "@/components/apartments/apartment-results-header";
import { ApartmentsGrid } from "@/components/apartments/apartments-grid";
import { ApartmentAdviceBanner } from "@/components/apartments/apartment-advice-banner";
import { ApartmentRelatedServices } from "@/components/apartments/apartment-related-services";
import { ApartmentOwnersCta } from "@/components/apartments/apartment-owners-cta";
import { getPublicApartments, extractDistricts } from "@/lib/data";
import type { Apartment } from "@/types/business";

export const metadata: Metadata = {
  title: "Appartements à Marrakech — Séjours sélectionnés par Yakout",
  description:
    "Découvrez des appartements sélectionnés à Marrakech pour vos séjours en couple, en famille ou entre amis, avec transport privé et services personnalisés.",
  openGraph: {
    title: "Appartements à Marrakech — Yakout Conciergerie",
    description:
      "Découvrez des appartements sélectionnés à Marrakech pour vos séjours en couple, en famille ou entre amis, avec transport privé et services personnalisés.",
  },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function filterApartments(apartments: Apartment[], params: Record<string, string | undefined>): Apartment[] {
  let filtered = [...apartments];

  const district = params.district;
  if (district) {
    filtered = filtered.filter(
      (a) => (a.public_district || a.district)?.toLowerCase() === district.toLowerCase(),
    );
  }

  const guests = params.guests;
  if (guests) {
    const n = Number(guests);
    if (!isNaN(n)) filtered = filtered.filter((a) => a.capacity >= n);
  }

  const bedrooms = params.bedrooms;
  if (bedrooms) {
    const n = Number(bedrooms);
    if (!isNaN(n)) filtered = filtered.filter((a) => a.bedrooms >= n);
  }

  const bathrooms = params.bathrooms;
  if (bathrooms) {
    const n = Number(bathrooms);
    if (!isNaN(n)) filtered = filtered.filter((a) => (a.bathrooms ?? 1) >= n);
  }

  const minPrice = params.min_price;
  if (minPrice) {
    const n = Number(minPrice);
    if (!isNaN(n)) filtered = filtered.filter((a) => (a.price_per_night ?? a.price_from ?? 0) >= n);
  }

  const maxPrice = params.max_price;
  if (maxPrice) {
    const n = Number(maxPrice);
    if (!isNaN(n)) filtered = filtered.filter((a) => (a.price_per_night ?? a.price_from ?? 0) <= n);
  }

  if (params.terrace === "1") filtered = filtered.filter((a) => a.has_terrace === true);
  if (params.pool === "1") filtered = filtered.filter((a) => a.has_pool === true);
  if (params.parking === "1") filtered = filtered.filter((a) => a.has_parking === true);
  if (params.elevator === "1") filtered = filtered.filter((a) => a.has_elevator === true);

  const sort = params.sort;
  if (sort === "price_asc") filtered.sort((a, b) => (a.price_per_night ?? a.price_from ?? 0) - (b.price_per_night ?? b.price_from ?? 0));
  else if (sort === "price_desc") filtered.sort((a, b) => (b.price_per_night ?? b.price_from ?? 0) - (a.price_per_night ?? a.price_from ?? 0));
  else if (sort === "capacity_desc") filtered.sort((a, b) => b.capacity - a.capacity);
  else if (sort === "newest") filtered.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  else filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

  return filtered;
}

function hasActiveFilters(params: Record<string, string | undefined>): boolean {
  return ["district", "guests", "bedrooms", "bathrooms", "min_price", "max_price", "terrace", "pool", "parking", "elevator"].some(
    (k) => params[k],
  );
}

export default async function ApartmentsPage(props: Props) {
  const searchParams = await props.searchParams;
  const allApartments = await getPublicApartments();
  const districts = extractDistricts(allApartments);
  const filtered = filterApartments(allApartments, searchParams);
  const activeFilters = hasActiveFilters(searchParams);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main>
        <ApartmentsHero />

        <div className="-mt-px">
          <ApartmentSearchBar districts={districts} />
        </div>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-12 md:px-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ApartmentResultsHeader
                apartments={filtered}
                totalCount={allApartments.length}
                hasActiveFilters={activeFilters}
              />
              <ApartmentFiltersDrawer districts={districts} />
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-12 md:px-12">
            <ApartmentsGrid apartments={filtered} />
          </div>
        </section>

        <ApartmentAdviceBanner />
        <ApartmentRelatedServices />
        <ApartmentOwnersCta />
      </main>
      <SiteFooter />
    </div>
  );
}
