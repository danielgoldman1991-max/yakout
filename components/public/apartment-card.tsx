import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { normalizeListItems } from "@/lib/utils/lists";
import type { Apartment } from "@/types/business";

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const image = apartment.image_url || fallbackImages.apartment.url;
  const title = apartment.public_name || apartment.internal_name;
  const amenities = normalizeListItems(apartment.amenities).slice(0, 3);
  return (
    <article className="overflow-hidden rounded-sm border border-border bg-surface transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5">
      <Link href={`/apartments/${apartment.slug}`} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={image}
            alt={apartment.image_alt_text || `${title} a Marrakech`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized={Boolean(apartment.image_url)}
          />
          <div className="absolute bottom-3 left-3 rounded-sm bg-background/80 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
            <MapPin className="mr-1 inline h-3 w-3" />
            {apartment.address_public_hint || apartment.district}
          </div>
        </div>
      </Link>
      <div className="p-6">
        <Link href={`/apartments/${apartment.slug}`} className="font-display text-lg text-foreground transition-colors hover:text-gold">
          {title}
        </Link>
        {apartment.short_description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{apartment.short_description}</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gold" />{apartment.capacity} pers.</span>
          <span className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5 text-gold" />{apartment.bedrooms} ch.</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="h-3.5 w-3.5 text-gold" />{apartment.bathrooms ?? 1} sdb</span>
        </div>
        {amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.map((item, index) => (
              <span key={`apartment-card-amenity-${item}-${index}`} className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">{item}</span>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">A partir de</p>
            <p className="text-lg font-light text-gold">
              {formatCurrency(apartment.price_per_night ?? apartment.price_from)}
              <span className="text-xs text-muted-foreground"> / nuit</span>
            </p>
          </div>
          <PremiumButton href={`/apartments/${apartment.slug}`} variant="secondary">Voir le detail</PremiumButton>
        </div>
        <div className="mt-3">
          <PremiumButton href={`/contact?type=reservation&apartment=${apartment.slug}`} variant="primary" className="w-full">Demander ce logement</PremiumButton>
        </div>
      </div>
    </article>
  );
}
