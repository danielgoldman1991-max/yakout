"use client";

import { useRef, useState, useCallback } from "react";
import { CalendarIcon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiDateToDisplayDate, displayDateToApiDate, parseDisplayDate } from "@/lib/dates";
import { isValid } from "date-fns";

type DateFieldProps = {
  id: string;
  name: string;
  label: string;
  value?: string | null;
  onChange?: (apiDate: string | null) => void;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
};

const digitsAndSlash = /^[\d/]*$/;

export function DateField({
  id,
  name,
  label,
  value,
  onChange,
  required,
  min,
  max,
  disabled,
  error,
  placeholder = "JJ/MM/AAAA",
}: DateFieldProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const displayValue = editingValue !== null ? editingValue : apiDateToDisplayDate(value);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      if (!digitsAndSlash.test(raw)) return;

      if (raw.length > 10) return;

      if (raw.length === 2 && !raw.includes("/") && editingValue?.length !== 3) {
        raw += "/";
      }
      if (raw.length === 5 && raw[2] === "/" && !raw.includes("/", 3) && editingValue?.length !== 6) {
        raw += "/";
      }

      setEditingValue(raw);

      const parsed = parseDisplayDate(raw);
      if (parsed && isValid(parsed)) {
        const apiVal = displayDateToApiDate(raw);
        if (apiVal) {
          onChange?.(apiVal);
          if (nativeRef.current) {
            nativeRef.current.value = apiVal;
          }
          return;
        }
      }

      if (raw.length < 10) {
        onChange?.(null);
      }
    },
    [onChange, editingValue],
  );

  const handleNativeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val) {
        setEditingValue(null);
        onChange?.(val);
      }
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setEditingValue("");
    onChange?.(null);
    if (nativeRef.current) nativeRef.current.value = "";
  }, [onChange]);

  const handleCalendarClick = useCallback(() => {
    setEditingValue(null);
    nativeRef.current?.showPicker();
  }, []);

  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          ref={nativeRef}
          type="date"
          name={name}
          defaultValue={value ?? ""}
          min={min}
          max={max}
          onChange={handleNativeChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          className={cn(
            "w-full rounded-sm border bg-surface px-3 py-2.5 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-ring",
            error ? "border-destructive" : "border-border",
            disabled && "opacity-45 pointer-events-none",
          )}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {displayValue && (
            <button
              type="button"
              onClick={handleClear}
              className="flex size-6 items-center justify-center rounded-sm text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="Effacer la date"
              tabIndex={-1}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCalendarClick}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground/50 hover:text-gold transition-colors"
            aria-label={`Ouvrir le calendrier pour ${label.toLowerCase()}`}
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
