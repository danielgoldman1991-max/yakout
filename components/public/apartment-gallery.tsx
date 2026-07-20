"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fallbackImages } from "@/lib/images";
import type { ApartmentImage } from "@/types/business";

type GalleryImage = { id: string; url: string; alt: string; cover: boolean; order: number };

type PublicGalleryApartment = { public_name: string; image_url?: string; image_alt_text?: string };

function resolveImages(apartment: PublicGalleryApartment, images: ApartmentImage[]): GalleryImage[] {
  const resolved = images.map((image, index) => ({ id: image.id, url: image.image_url ?? image.url ?? "", alt: image.image_alt_text ?? image.alt_text ?? `${apartment.public_name} à Marrakech`, cover: Boolean(image.is_cover), order: image.sort_order ?? image.display_order ?? index })).filter((image) => image.url).sort((a, b) => Number(b.cover) - Number(a.cover) || a.order - b.order);
  if (resolved.length) return resolved;
  return [{ id: "fallback", url: apartment.image_url || fallbackImages.apartment.url, alt: apartment.image_alt_text || fallbackImages.apartment.alt, cover: true, order: 0 }];
}

export function ApartmentGallery({ apartment, images }: { apartment: PublicGalleryApartment; images: ApartmentImage[] }) {
  const gallery = useMemo(() => resolveImages(apartment, images), [apartment, images]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchX, setTouchX] = useState(0);
  const total = gallery.length;
  const go = useCallback((next: number) => setIndex((next + total) % total), [total]);
  const show = (next: number) => { setIndex(next); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); if (event.key === "ArrowLeft") go(index - 1); if (event.key === "ArrowRight") go(index + 1); };
    document.addEventListener("keydown", onKey); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [go, index, open]);

  return <>
    <section aria-label="Galerie du logement" className="relative overflow-hidden rounded-2xl bg-surface">
      <div className="hidden h-[470px] grid-cols-4 grid-rows-2 gap-2 lg:grid">
        {gallery.slice(0, 5).map((image, imageIndex) => <button key={image.id} type="button" onClick={() => show(imageIndex)} className={cn("group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold", imageIndex === 0 && "col-span-2 row-span-2", total === 1 && "col-span-4 row-span-2")} aria-label={`Ouvrir la photo ${imageIndex + 1} sur ${total}`}>
          <Image src={image.url} alt={image.alt} fill priority={imageIndex === 0} sizes={imageIndex === 0 ? "(min-width: 1024px) 600px, 100vw" : "300px"} className="object-cover transition duration-500 group-hover:scale-[1.02]" unoptimized={!image.url.startsWith("/")} />
          {imageIndex === Math.min(4, total - 1) && <span className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-background/95 px-4 text-sm font-semibold text-foreground shadow-lg"><Camera className="h-4 w-4" />Afficher les {total} photos</span>}
        </button>)}
      </div>
      <div className="relative aspect-[4/3] md:aspect-[16/9] lg:hidden" onTouchStart={(event) => setTouchX(event.touches[0].clientX)} onTouchEnd={(event) => { const delta = event.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1)); }}>
        <button type="button" className="relative h-full w-full" onClick={() => setOpen(true)} aria-label={`Ouvrir la photo ${index + 1} sur ${total}`}><Image src={gallery[index].url} alt={gallery[index].alt} fill priority sizes="100vw" className="object-cover" unoptimized={!gallery[index].url.startsWith("/")} /></button>
        {total > 1 && <><GalleryArrow side="left" onClick={() => go(index - 1)} /><GalleryArrow side="right" onClick={() => go(index + 1)} /></>}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">{index + 1} / {total}</span>
      </div>
    </section>
    {open && <div role="dialog" aria-modal="true" aria-label="Toutes les photos" className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white" onTouchStart={(event) => setTouchX(event.touches[0].clientX)} onTouchEnd={(event) => { const delta = event.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1)); }}>
      <div className="flex h-16 items-center justify-between px-4 md:px-8"><span className="text-sm">{index + 1} / {total}</span><button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Fermer la galerie"><X className="h-5 w-5" /></button></div>
      <div className="relative min-h-0 flex-1"><Image src={gallery[index].url} alt={gallery[index].alt} fill sizes="100vw" className="object-contain p-4 md:p-10" unoptimized={!gallery[index].url.startsWith("/")} />{total > 1 && <><GalleryArrow side="left" onClick={() => go(index - 1)} modal /><GalleryArrow side="right" onClick={() => go(index + 1)} modal /></>}</div>
      {gallery[index].alt && <p className="px-6 pb-5 text-center text-sm text-white/70">{gallery[index].alt}</p>}
    </div>}
  </>;
}

function GalleryArrow({ side, onClick, modal = false }: { side: "left" | "right"; onClick: () => void; modal?: boolean }) {
  const Icon = side === "left" ? ArrowLeft : ArrowRight;
  return <button type="button" onClick={(event) => { event.stopPropagation(); onClick(); }} className={cn("absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-lg", side === "left" ? "left-3" : "right-3", modal ? "bg-white/10 text-white hover:bg-white/20" : "bg-background/90 text-foreground hover:bg-background")} aria-label={side === "left" ? "Photo précédente" : "Photo suivante"}><Icon className="h-5 w-5" /></button>;
}
