"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants/reservations";
import { Button } from "@/components/ui/button";

export function ReservationFilters({ status, search }: { status?: string; search?: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const params = new URLSearchParams();
    const s = (form.elements.namedItem("status") as HTMLSelectElement).value;
    const q = (form.elements.namedItem("search") as HTMLInputElement).value;
    if (s) params.set("status", s);
    if (q) params.set("search", q);
    router.push(`/dashboard/reservations${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center">
      <select name="status" defaultValue={status ?? ""}
        className="h-9 rounded-sm border border-input bg-background px-3 text-sm">
        <option value="">Tous les statuts</option>
        {Object.entries(RESERVATION_STATUS_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <input name="search" type="search" defaultValue={search ?? ""} placeholder="Rechercher..."
        className="h-9 w-48 rounded-sm border border-input bg-background px-3 text-sm" />
      <Button type="submit" variant="secondary" className="h-9 text-xs">Filtrer</Button>
      {(status || search) && (
        <Link href="/dashboard/reservations" className="text-xs text-muted-foreground hover:text-foreground underline">Effacer les filtres</Link>
      )}
    </form>
  );
}
