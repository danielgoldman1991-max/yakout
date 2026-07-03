"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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

export function ApartmentFiltersDrawer({ districts }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const [district, setDistrict] = useState(params.get("district") ?? "");
  const [guests, setGuests] = useState(params.get("guests") ?? "");
  const [bedrooms, setBedrooms] = useState(params.get("bedrooms") ?? "");
  const [bathrooms, setBathrooms] = useState(params.get("bathrooms") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");
  const [terrace, setTerrace] = useState(params.get("terrace") === "1");
  const [pool, setPool] = useState(params.get("pool") === "1");
  const [parking, setParking] = useState(params.get("parking") === "1");
  const [elevator, setElevator] = useState(params.get("elevator") === "1");

  const buildParams = useCallback(() => {
    const sp = new URLSearchParams();
    if (district) sp.set("district", district);
    if (guests) sp.set("guests", guests);
    if (bedrooms) sp.set("bedrooms", bedrooms);
    if (bathrooms) sp.set("bathrooms", bathrooms);
    if (minPrice) sp.set("min_price", minPrice);
    if (maxPrice) sp.set("max_price", maxPrice);
    if (terrace) sp.set("terrace", "1");
    if (pool) sp.set("pool", "1");
    if (parking) sp.set("parking", "1");
    if (elevator) sp.set("elevator", "1");
    return sp;
  }, [district, guests, bedrooms, bathrooms, minPrice, maxPrice, terrace, pool, parking, elevator]);

  const applyFilters = useCallback(() => {
    const sp = buildParams();
    const qs = sp.toString();
    router.push(qs ? `/apartments?${qs}` : "/apartments");
    setOpen(false);
  }, [buildParams, router]);

  const resetAll = useCallback(() => {
    setDistrict("");
    setGuests("");
    setBedrooms("");
    setBathrooms("");
    setMinPrice("");
    setMaxPrice("");
    setTerrace(false);
    setPool(false);
    setParking(false);
    setElevator(false);
    router.push("/apartments");
    setOpen(false);
  }, [router]);

  const hasActive = Boolean(district || guests || bedrooms || bathrooms || minPrice || maxPrice || terrace || pool || parking || elevator);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all hover:border-gold/30 hover:bg-gold/5"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtres
        {hasActive && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-primary-foreground">
            {[district, guests, bedrooms, bathrooms, minPrice || maxPrice, terrace ? "1" : "", pool ? "1" : "", parking ? "1" : "", elevator ? "1" : ""].filter(Boolean).length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg text-foreground">Filtres</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quartier</legend>
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
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Voyageurs</legend>
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
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Chambres</legend>
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
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Salles de bain</legend>
                  <Select value={bathrooms} onValueChange={setBathrooms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} sdb</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Budget par nuit</legend>
                  <Select value={minPrice || maxPrice ? `${minPrice}-${maxPrice}` : ""} onValueChange={(val) => {
                    if (!val) { setMinPrice(""); setMaxPrice(""); }
                    else { const [mn, mx] = val.split("-"); setMinPrice(mn); setMaxPrice(mx); }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les budgets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous budgets</SelectItem>
                      <SelectItem value="0-500">Moins de 500 MAD</SelectItem>
                      <SelectItem value="500-1000">500 – 1 000 MAD</SelectItem>
                      <SelectItem value="1000-2000">1 000 – 2 000 MAD</SelectItem>
                      <SelectItem value="2000-5000">2 000 – 5 000 MAD</SelectItem>
                      <SelectItem value="5000-">5 000 MAD et +</SelectItem>
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Équipements</legend>
                  <div className="space-y-3">
                    {[
                      { key: "terrace", label: "Terrasse", checked: terrace, set: setTerrace },
                      { key: "pool", label: "Piscine", checked: pool, set: setPool },
                      { key: "parking", label: "Parking", checked: parking, set: setParking },
                      { key: "elevator", label: "Ascenseur", checked: elevator, set: setElevator },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.set(e.target.checked)}
                          className="h-4 w-4 accent-gold"
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              {hasActive && (
                <button onClick={resetAll} className="h-11 px-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground">
                  Réinitialiser
                </button>
              )}
              <button onClick={applyFilters} className="ml-auto h-11 rounded-sm bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:bg-gold-light hover:shadow-glow-gold">
                Afficher les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
