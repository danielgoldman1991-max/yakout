import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { fallbackImages } from "@/lib/images";

interface Apartment {
  id: string;
  slug: string;
  public_name: string;
  district: string;
  capacity: number;
  bedrooms: number;
  price_from: number;
  image_url?: string | null;
}

export function PropertySectionV2({ apartments }: { apartments: Apartment[] }) {
  if (apartments.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface-light">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="ruby-diamond" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Sélection</p>
              <span className="gold-sep" />
            </div>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Appartements sélectionnés pour votre séjour
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Des biens premium dans les meilleurs quartiers de Marrakech.
            </p>
          </div>
          <Link
            href="/apartments"
            className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:text-gold-light md:block"
          >
            Tous les appartements <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => (
            <article
              key={apt.id}
              className="group relative overflow-hidden rounded-sm border border-border bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-gold/15 hover:shadow-elevation-3 hover:shadow-gold/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-gold/5">
                <Image
                  src={apt.image_url || fallbackImages.apartment.url}
                  alt={apt.public_name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  unoptimized={Boolean(apt.image_url)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="inline-flex items-center gap-1.5 rounded-sm bg-gold/10 px-2.5 py-1 text-[10px] font-medium text-gold backdrop-blur-sm">
                    <MapPin className="h-3 w-3" />
                    {apt.district}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-5">
                <h3 className="font-display text-lg text-foreground">{apt.public_name}</h3>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3 text-gold" />{apt.capacity} pers.
                  </span>
                  {apt.bedrooms > 0 && <span>{apt.bedrooms} ch.</span>}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-5">
                  <div>
                    <span className="text-lg font-semibold text-gold">{formatCurrency(apt.price_from)}</span>
                    <span className="text-xs text-muted-foreground"> / nuit</span>
                  </div>
                  <Link
                    href={`/apartments/${apt.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-gold px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#050505] shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold"
                  >
                    Voir le bien
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link
            href="/apartments"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:text-gold-light"
          >
            Tous les appartements <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
