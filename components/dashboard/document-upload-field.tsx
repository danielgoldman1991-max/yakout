"use client";

import { useId, useRef, useCallback, useState, useMemo, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  UploadCloud,
  Replace,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);
const ACCEPTED_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.txt";

const typeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "text/csv": "CSV",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "text/plain": "TXT",
};

const typeIcons: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.ms-excel": FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "text/csv": FileSpreadsheet,
  "image/jpeg": FileImage,
  "image/png": FileImage,
  "image/webp": FileImage,
  "text/plain": File,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type Props = {
  value?: File | null;
  onChange?: (file: File | null) => void;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
};

export function DocumentUploadField({
  value: controlledValue,
  onChange: controlledOnChange,
  error: externalError,
  label = "Fichier",
  required,
  className,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;

  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [internalError, setInternalError] = useState("");

  const value = isControlled ? controlledValue : internalFile;
  const displayError = isControlled ? externalError : (externalError || internalError);

  const isImage = value?.type.startsWith("image/");
  const previewUrl = useMemo(() => {
    if (!isImage || !value) return null;
    return URL.createObjectURL(value);
  }, [isImage, value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      return "Format non accepté. Formats autorisés : PDF, Word, Excel, CSV, JPG, PNG, WEBP.";
    }
    if (file.size > MAX_SIZE) {
      return "Le fichier dépasse la taille maximale autorisée de 10 MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      if (isControlled) {
        controlledOnChange?.(null);
      } else {
        setInternalError(validationError);
      }
      return;
    }
    if (isControlled) {
      controlledOnChange?.(file);
    } else {
      setInternalFile(file);
      setInternalError("");
    }
  }, [validateFile, isControlled, controlledOnChange]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleClear = useCallback(() => {
    if (isControlled) {
      controlledOnChange?.(null);
    } else {
      setInternalFile(null);
      setInternalError("");
    }
    if (inputRef.current) inputRef.current.value = "";
  }, [isControlled, controlledOnChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {!isControlled && (
        <>
          <input type="hidden" name="file_name" value={value?.name ?? ""} />
          <input type="hidden" name="file_size" value={String(value?.size ?? "")} />
          <input type="hidden" name="mime_type" value={value?.type ?? ""} />
          <input type="hidden" name="file_extension" value={value?.name.split(".").pop()?.toLowerCase() ?? ""} />
        </>
      )}

      <label className="text-xs font-medium text-muted-foreground">
        {label} {required ? "*" : ""}
      </label>

      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-border/60 bg-surface/40 px-6 py-10 text-center transition hover:border-gold/40 hover:bg-gold/[0.02]"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Cliquez pour sélectionner un fichier
            </p>
            <p className="text-xs text-muted-foreground/60">
              ou glissez-déposez ici
            </p>
          </div>
          <p className="text-xs text-muted-foreground/50">
            PDF, Word, Excel, CSV, JPG, PNG, WEBP — 10 Mo max
          </p>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="rounded-sm border border-border/60 bg-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {isImage && previewUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-border/70 bg-card">
                  <img
                    src={previewUrl}
                    alt="Aperçu"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-border/70 bg-card">
                  {(() => {
                    const Icon = typeIcons[value.type] ?? FileText;
                    return <Icon className="h-6 w-6 text-gold/70" />;
                  })()}
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {value.name}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
                  <span>{typeLabels[value.type] ?? value.type}</span>
                  <span>{formatSize(value.size)}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                title="Remplacer le fichier"
                onClick={() => inputRef.current?.click()}
              >
                <Replace className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Supprimer le fichier"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {displayError && (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
