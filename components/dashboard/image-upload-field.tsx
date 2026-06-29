"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageUploadFieldProps = {
  label: string;
  folder: "apartments" | "vehicles" | "blog" | "services" | "pages" | "site";
  name: string;
  altName?: string;
  defaultUrl?: string | null;
  defaultAlt?: string | null;
  helperText?: string;
  required?: boolean;
  className?: string;
};

export function ImageUploadField({
  label,
  folder,
  name,
  altName,
  defaultUrl,
  defaultAlt,
  helperText,
  required,
  className,
}: ImageUploadFieldProps) {
  const id = useId();
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [alt, setAlt] = useState(defaultAlt ?? "");
  const [preview, setPreview] = useState(defaultUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format invalide. Utilisez JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Image trop lourde. Taille maximum : 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setIsUploading(true);
    const payload = new FormData();
    payload.append("file", file);
    payload.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: payload,
    });
    const result = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !result.url) {
      setError(result.error ?? "Upload impossible pour le moment.");
      setIsUploading(false);
      return;
    }

    setUrl(result.url);
    setPreview(result.url);
    setIsUploading(false);
  }

  return (
    <div className={cn("space-y-3 rounded-sm border border-border/60 bg-surface/40 p-4", className)}>
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label} {required ? "*" : ""}
        </label>
        {helperText && <p className="text-xs text-muted-foreground/70">{helperText}</p>}
      </div>

      <input type="hidden" name={name} value={url} />

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm border border-border/70 bg-card">
          {preview ? (
            <Image src={preview} alt={alt || label} fill sizes="160px" className="object-cover" unoptimized />
          ) : (
            <ImagePlus className="h-8 w-8 text-gold/70" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-3">
          <label
            htmlFor={id}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-gold/40 hover:text-gold"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {url ? "Remplacer l'image" : "Uploader une image"}
          </label>
          <input
            id={id}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-describedby={`${id}-error`}
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />

          {altName && (
            <Input
              name={altName}
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Texte alternatif de l'image"
              aria-label="Texte alternatif de l'image"
            />
          )}

          {url && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 text-destructive hover:text-destructive"
              onClick={() => {
                setUrl("");
                setPreview("");
                setError("");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Retirer du champ
            </Button>
          )}

          <p className="text-xs text-muted-foreground/60">JPG, PNG ou WebP. 5 MB maximum.</p>
          {error && (
            <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
