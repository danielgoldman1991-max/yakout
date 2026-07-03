"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Camera, Clock, MapPin, Sparkles, Users, X } from "lucide-react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils/cn";
import { fallbackImages } from "@/lib/images";
import type { Apartment, ApartmentImage } from "@/types/business";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  order: number;
  cover: boolean;
};

function normalizeImages(images: ApartmentImage[], apartment: Apartment): GalleryImage[] {
  const raw = images.map((image) => ({
    id: image.id,
    url: image.image_url ?? image.url,
    alt: image.image_alt_text ?? image.alt_text ?? apartment.image_alt_text ?? apartment.public_name,
    order: image.sort_order ?? image.display_order ?? 0,
    cover: Boolean(image.is_cover),
  }));
  const normalized: GalleryImage[] = raw
    .filter((image): image is { id: string; url: string; alt: string; order: number; cover: boolean } => Boolean(image.url))
    .sort((a, b) => Number(b.cover) - Number(a.cover) || a.order - b.order)
    .slice(0, 6);
  if (normalized.length > 0) return normalized;
  return [{
    id: "fallback",
    url: apartment.image_url || fallbackImages.apartment.url,
    alt: apartment.image_alt_text || fallbackImages.apartment.alt,
    order: 0,
    cover: true,
  }];
}

function Chip({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function ApartmentGallery({
  apartment,
  images,
  title,
  district,
  price,
  capacity,
  bedrooms,
  bathrooms,
  beds,
  hasTerrace,
  hasParking,
  minimumNights,
}: {
  apartment: Apartment;
  images: ApartmentImage[];
  title: string;
  district: string;
  price: number;
  capacity: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  hasTerrace?: boolean;
  hasParking?: boolean;
  minimumNights?: number;
}) {
  const gallery = normalizeImages(images, apartment);
  const total = gallery.length;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex((index + total) % total);
  }, [total]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 50) { if (dx > 0) goPrev(); else goNext(); }
  };

  return (
    <>
      <section className="relative w-full overflow-hidden bg-surface">
        <div className="relative h-[50vh] min-h-[400px] w-full md:min-h-[520px] md:max-h-[700px]">
          <Image
            src={gallery[0].url}
            alt={gallery[0].alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            unoptimized={Boolean(gallery[0].url && !gallery[0].url.startsWith("/"))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-sm bg-black/50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition hover:bg-black/70 md:bottom-6 md:right-6"
            aria-label="Voir les photos"
          >
            <Camera className="h-3.5 w-3.5" />
            {total} photo{total > 1 ? "s" : ""}
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                  {district} &middot; Marrakech
                </p>
                <h1 className="mt-2 font-display text-[clamp(1.5rem,4vw,3.2rem)] font-semibold leading-[1.05] tracking-tight text-white">
                  {title}
                </h1>
                {apartment.short_description && (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-[15px] md:leading-7">
                    {apartment.short_description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Chip icon={Users} label={`${capacity} voyageurs`} />
                  <Chip icon={BedDouble} label={`${bedrooms ?? 0} chambre${(bedrooms ?? 0) > 1 ? "s" : ""}`} />
                  <Chip icon={Bath} label={`${bathrooms ?? 0} salle${(bathrooms ?? 0) > 1 ? "s" : ""} de bain`} />
                  {beds ? <Chip icon={BedDouble} label={`${beds} lit${beds > 1 ? "s" : ""}`} /> : null}
                  {hasTerrace ? <Chip icon={Sparkles} label="Terrasse" /> : null}
                  {hasParking ? <Chip icon={MapPin} label="Parking" /> : null}
                  <Chip icon={Clock} label={`Mini ${minimumNights ?? 1} nuit${minimumNights !== 1 ? "s" : ""}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">A partir de</p>
                <p className="font-display text-2xl text-gold md:text-3xl">
                  {new Intl.NumberFormat("fr-FR").format(price)} <span className="text-sm text-white/60">MAD / nuit</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          role="dialog"
          aria-label="Galerie photos"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative flex flex-1 items-center justify-center">
            <button
              onClick={closeLightbox}
              className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Fermer la galerie"
            >
              <X className="h-5 w-5" />
            </button>

            {total > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:flex"
                  aria-label="Photo precedente"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:flex"
                  aria-label="Photo suivante"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="relative h-full w-full max-w-5xl px-4 py-20 md:py-24">
              <div className="relative h-full w-full">
                <Image
                  src={gallery[currentIndex].url}
                  alt={gallery[currentIndex].alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized={Boolean(gallery[currentIndex].url && !gallery[currentIndex].url.startsWith("/"))}
                />
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/60">
              {currentIndex + 1} / {total}
            </div>
          </div>

          {total > 1 && (
            <div className="flex justify-center gap-2 border-t border-white/10 px-4 py-4">
              {gallery.map((image, i) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-sm border-2 transition",
                    i === currentIndex ? "border-gold opacity-100" : "border-transparent opacity-50 hover:opacity-80",
                  )}
                  aria-label={`Voir la photo ${i + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized={Boolean(image.url && !image.url.startsWith("/"))}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
