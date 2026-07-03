"use client";

import { useId, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { X, Search, ChevronDown } from "lucide-react";

export type SelectOption = { id: string; label: string; description?: string };

type RelationSearchSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
};

export function RelationSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Rechercher...",
  label,
  emptyMessage = "Aucun résultat",
  required,
  disabled,
}: RelationSearchSelectProps) {
  const id = useId();
  const [open, setOpenState] = useState(false);
  const [search, setSearchState] = useState("");
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setSearch = useCallback((value: string | ((prev: string) => string)) => {
    setSearchState(value);
    setHighlightedIdx(-1);
  }, []);

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)),
    );
  }, [options, search]);

  const toggleOpen = useCallback(() => {
    setOpenState((prev) => {
      if (prev) setSearch("");
      return !prev;
    });
  }, [setSearch]);

  const close = useCallback(() => {
    setOpenState(false);
    setSearch("");
    setHighlightedIdx(-1);
  }, [setSearch, setHighlightedIdx]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const selectOption = useCallback(
    (opt: SelectOption) => {
      onChange(opt.id);
      close();
    },
    [onChange, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpenState(true);
          e.preventDefault();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIdx((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIdx >= 0 && filtered[highlightedIdx]) {
            selectOption(filtered[highlightedIdx]);
          }
          break;
        case "Escape":
          close();
          break;
      }
    },
    [open, filtered, highlightedIdx, selectOption, close],
  );

  useEffect(() => {
    if (highlightedIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>("[data-index]");
      items[highlightedIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIdx]);

  const showClear = value && !disabled;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
          {label} {required ? "*" : ""}
        </label>
      )}

      <div
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm transition",
          disabled && "cursor-not-allowed opacity-50",
          open && "border-gold/50 ring-1 ring-gold/20",
        )}
        onClick={() => !disabled && toggleOpen()}
      >
        {selected ? (
          <span className="flex-1 truncate">{selected.label}</span>
        ) : (
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
        )}
        {showClear && (
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-elevation-3">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              id={id}
              type="text"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto" role="listbox">
            <button
              type="button"
              className={cn(
                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                value === "" ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => { onChange(""); close(); }}
              onMouseEnter={() => setHighlightedIdx(-1)}
              role="option"
              aria-selected={value === ""}
            >
              — Aucun
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  data-index={idx}
                  className={cn(
                    "flex w-full flex-col px-3 py-2 text-left transition-colors",
                    highlightedIdx === idx && "bg-accent/20",
                    value === opt.id ? "bg-gold/10" : "hover:bg-accent/10",
                  )}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  role="option"
                  aria-selected={value === opt.id}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
