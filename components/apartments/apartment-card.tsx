import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { normalizeListItems } from "@/lib/utils/lists";
import type { Apartment } from "@/types/business";

type Props = {
  apartment: Apartment;
  priority?: boolean;
};

export function ApartmentCard({ apartment, priority = false }: Props) {
  const image = apartment.image_url || fallbackImages.apartment.url;
  const title = apartment.public_name || apartment.internal_name;
  const highlights = normalizeListItems(apartment.highlights).slice(0, 2);

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-surface transition-all duration-500 hover:border-gold/15 hover:shadow-lg hover:shadow-gold/5">
      <Link href={`/apartments/${apartment.slug}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image}
            alt={apartment.image_alt_text || `${title} à Marrakech`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-105"
            priority={priority}
            unoptimized={Boolean(apartment.image_url)}
          />
          <div className="absolute bottom-3 left-3 rounded-sm bg-[#1a1410]/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            <MapPin className="-mt-0.5 mr-1 inline h-3 w-3 text-gold" />
            {apartment.public_district || apartment.district}
          </div>
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/apartments/${apartment.slug}`}>
          <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
            {title}
          </h3>
        </Link>

        {apartment.short_description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {apartment.short_description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gold/70" />
            {apartment.capacity} pers.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-gold/70" />
            {apartment.bedrooms} ch.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5 text-gold/70" />
            {apartment.bathrooms ?? 1} sdb
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {highlights.map((h, i) => (
              <span key={`hl-${i}`} className="rounded-full border border-gold/10 bg-gold/5 px-2.5 py-0.5 text-[10px] text-gold">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              À partir de
            </p>
            <p className="font-display text-xl font-medium text-gold">
              {formatCurrency(apartment.price_per_night ?? apartment.price_from)}
              <span className="text-xs font-normal text-muted-foreground"> /nuit</span>
            </p>
          </div>
          <PremiumButton href={`/apartments/${apartment.slug}`} variant="secondary">
            Voir l&apos;appartement
          </PremiumButton>
        </div>

        <div className="mt-3">
          <PremiumButton
            href={`/contact?type=reservation&apartment=${apartment.slug}`}
            variant="primary"
            className="w-full"
          >
            Demander ce logement
          </PremiumButton>
        </div>
      </div>
    </article>
  );
}
