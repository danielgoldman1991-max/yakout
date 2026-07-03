"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { Search, Users, BedDouble, MapPin, Coins } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  districts: string[];
};

export function ApartmentSearchBar({ districts }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [district, setDistrict] = useState(params.get("district") ?? "");
  const [guests, setGuests] = useState(params.get("guests") ?? "");
  const [bedrooms, setBedrooms] = useState(params.get("bedrooms") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const sp = new URLSearchParams();
      if (district) sp.set("district", district);
      if (guests) sp.set("guests", guests);
      if (bedrooms) sp.set("bedrooms", bedrooms);
      if (maxPrice) sp.set("max_price", maxPrice);
      const qs = sp.toString();
      router.push(qs ? `/apartments?${qs}` : "/apartments");
    },
    [district, guests, bedrooms, maxPrice, router],
  );

  const hasFilters = district || guests || bedrooms || maxPrice;

  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-8 md:px-12">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <MapPin className="mr-1 inline h-3 w-3" />
              Quartier
            </label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les quartiers" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[100px] flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Users className="mr-1 inline h-3 w-3" />
              Voyageurs
            </label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} pers.</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[100px] flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <BedDouble className="mr-1 inline h-3 w-3" />
              Chambres
            </label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} ch.</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px] flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Coins className="mr-1 inline h-3 w-3" />
              Budget max / nuit
            </label>
            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les budgets" />
              </SelectTrigger>
              <SelectContent>
                {[500, 800, 1200, 1500, 2000, 3000, 5000].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n.toLocaleString()} MAD</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            className="flex h-11 items-center gap-2 rounded-sm bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-all duration-300 hover:bg-gold-light hover:shadow-glow-gold"
          >
            <Search className="h-4 w-4" />
            Rechercher
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setDistrict("");
                setGuests("");
                setBedrooms("");
                setMaxPrice("");
                router.push("/apartments");
              }}
              className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Réinitialiser
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
