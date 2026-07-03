"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import type { Apartment } from "@/types/business";

type Props = {
  apartments: Apartment[];
  totalCount: number;
  hasActiveFilters: boolean;
};

const sortOptions = [
  { label: "Recommandés", value: "" },
  { label: "Prix croissant", value: "price_asc" },
  { label: "Prix décroissant", value: "price_desc" },
  { label: "Plus grande capacité", value: "capacity_desc" },
  { label: "Nouveautés", value: "newest" },
];

export function ApartmentResultsHeader({ apartments, totalCount, hasActiveFilters }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-xl text-foreground">Nos appartements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {apartments.length === totalCount
            ? `Découvrez notre sélection de ${totalCount} appartement${totalCount > 1 ? "s" : ""} à Marrakech`
            : `${apartments.length} appartement${apartments.length > 1 ? "s" : ""} correspondent à votre recherche`
          }
        </p>
      </div>
      <div className="flex items-center gap-3">
        {hasActiveFilters && (
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-gold">{apartments.length}</span> résultat{apartments.length > 1 ? "s" : ""}
          </p>
        )}
        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <ArrowUpDown className="h-3 w-3" />
          <select
            value={sort}
            onChange={(e) => {
              const sp = new URLSearchParams(params.toString());
              if (e.target.value) sp.set("sort", e.target.value);
              else sp.delete("sort");
              router.push(`/apartments?${sp.toString()}`);
            }}
            className="h-9 rounded-sm border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-gold/50"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
