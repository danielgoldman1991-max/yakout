"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ApartmentImage } from "@/types/business";

const MAX_IMAGES = 6;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

type ExistingImage = {
  id: string;
  url: string;
  alt?: string;
  isCover?: boolean;
};

export function ApartmentGalleryManager({
  images = [],
}: {
  images?: ApartmentImage[];
}) {
  const initialImages = useMemo<ExistingImage[]>(() => images.map((image) => ({
    id: image.id,
    url: image.image_url ?? image.url ?? "",
    alt: image.image_alt_text ?? image.alt_text ?? "",
    isCover: Boolean(image.is_cover),
  })).filter((image) => image.url), [images]);

  const [existing, setExisting] = useState(initialImages);
  const [selectedCount, setSelectedCount] = useState(0);
  const [newPreviews, setNewPreviews] = useState<Array<{ name: string; url: string }>>([]);
  const [error, setError] = useState("");
  const total = existing.length + selectedCount;
  const coverId = existing.find((image) => image.isCover)?.id ?? existing[0]?.id ?? "";

  function moveImage(index: number, direction: -1 | 1) {
    setExisting((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-4 rounded-sm border border-border/60 bg-surface/40 p-4">
      <input type="hidden" name="gallery_touched" value="1" />
      <input type="hidden" name="existing_image_ids" value={existing.map((image) => image.id).join(",")} />
      <input type="hidden" name="cover_image_id" value={coverId} />

      <div>
        <p className="text-sm font-medium">Photos</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajoutez jusqu&apos;a 6 photos. La photo de couverture sera utilisee dans les cartes du site.
        </p>
      </div>

      {existing.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {existing.map((image, index) => (
            <div key={image.id} className="overflow-hidden rounded-sm border border-border bg-card">
              <div className="relative aspect-[4/3]">
                <Image src={image.url} alt={image.alt || "Photo appartement"} fill sizes="240px" className="object-cover" unoptimized />
                {image.id === coverId && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Star className="h-3 w-3" /> Cover
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setExisting((current) => current.map((item) => ({ ...item, isCover: item.id === image.id })))}>
                  <Star className="h-4 w-4" /> Cover
                </Button>
                <Button type="button" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => setExisting((current) => current.filter((item) => item.id !== image.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {newPreviews.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {newPreviews.map((preview, index) => (
            <div key={`new-preview-${index}`} className="overflow-hidden rounded-sm border border-gold/30 bg-card">
              <div className="relative aspect-[4/3]">
                <Image src={preview.url} alt={preview.name} fill sizes="240px" className="object-cover" unoptimized />
              </div>
              <p className="truncate px-3 py-2 text-xs text-muted-foreground">Nouvelle photo : {preview.name}</p>
            </div>
          ))}
        </div>
      )}

      <label
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-card px-4 py-6 text-center transition hover:border-gold/40",
          total >= MAX_IMAGES && "cursor-not-allowed opacity-60",
        )}
      >
        {total >= MAX_IMAGES ? <ImagePlus className="h-6 w-6 text-muted-foreground" /> : <UploadCloud className="h-6 w-6 text-gold" />}
        <span className="text-sm font-medium">{total >= MAX_IMAGES ? "Maximum 6 photos par appartement." : "Glisser ou choisir des photos"}</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP. 5 MB par image.</span>
        <input
          name="images"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={total >= MAX_IMAGES}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            const remaining = MAX_IMAGES - existing.length;
            if (files.length > remaining) {
              setError("Maximum 6 photos par appartement.");
              event.target.value = "";
              setSelectedCount(0);
              setNewPreviews([]);
              return;
            }
            const invalid = files.find((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_SIZE);
            if (invalid) {
              setError("Format invalide ou image trop lourde. Utilisez JPG, PNG ou WebP, 5 MB maximum.");
              event.target.value = "";
              setSelectedCount(0);
              setNewPreviews([]);
              return;
            }
            setError("");
            setSelectedCount(files.length);
            setNewPreviews(files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })));
          }}
        />
      </label>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total}/{MAX_IMAGES} photos</span>
            {selectedCount > 0 && <span>{selectedCount} nouvelle(s) photo(s) prete(s) a l&apos;envoi</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
