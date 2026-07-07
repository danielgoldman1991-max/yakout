import type { PackageState, PricingBreakdown, PricingEntry } from "./types";

export function calculatePricing(state: PackageState): PricingBreakdown {
  const entries: PricingEntry[] = [];
  const subtotals: Record<string, number> = { apartment: 0, transfer: 0, vehicle: 0, experience: 0, service: 0 };

  const { stay, apartment: aptOpt, transfers, vehicle: vehOpt, experiences, services } = state;

  if (aptOpt.type === "selected") {
    const apt = aptOpt.apartment;
    const total = apt.pricePerNight * stay.nights;
    entries.push({ label: `${apt.title} × ${stay.nights} nuits`, amount: total, type: "apartment" });
    subtotals.apartment += total;
  }

  for (const transfer of transfers) {
    let amount = 0;
    let label = "";
    if (transfer.type === "arrival" || transfer.type === "departure") {
      amount = 250;
      label = transfer.type === "arrival" ? "Transfert arrivée aéroport" : "Transfert départ aéroport";
    } else if (transfer.type === "both") {
      amount = 450;
      label = "Aller-retour aéroport";
    } else if (transfer.type === "half_day") {
      amount = 500;
      label = "Chauffeur demi-journée";
    } else if (transfer.type === "full_day") {
      amount = 900;
      label = "Chauffeur journée complète";
    } else if (transfer.type === "city_trip") {
      amount = 200;
      label = "Trajet privé en ville";
    }
    entries.push({ label, amount, type: "transfer" });
    subtotals.transfer += amount;
  }

  if (vehOpt.type === "selected" || vehOpt.type === "recommendation") {
    const svcType = vehOpt.serviceType;
    const days = vehOpt.days || 1;
    let amount = 0;
    let label = "";
    if (vehOpt.type === "selected") {
      const veh = vehOpt.vehicle;
      if (svcType === "private") amount = veh.priceTransfer;
      else if (svcType === "half_day") amount = veh.priceHalfDay;
      else if (svcType === "full_day") amount = veh.priceFullDay * days;
      else amount = veh.priceFullDay * days * 0.85;
      label = `${veh.title} — ${svcType === "private" ? "Trajet privé" : svcType === "half_day" ? "½ journée" : svcType === "full_day" ? `${days} jour${days > 1 ? "s" : ""}` : `${days} jours`}`;
    } else {
      if (svcType === "private") amount = 250;
      else if (svcType === "half_day") amount = 500;
      else if (svcType === "full_day") amount = 800 * days;
      else amount = 700 * days;
      label = `Véhicule recommandé — ${svcType === "private" ? "Trajet privé" : svcType === "half_day" ? "½ journée" : `${days} jour${days > 1 ? "s" : ""}`}`;
    }
    entries.push({ label, amount, type: "vehicle" });
    subtotals.vehicle += amount;
  }

  for (const exp of experiences) {
    const people = exp.people || stay.adults + stay.children;
    const amount = exp.price * Math.max(1, people);
    entries.push({ label: `${exp.title} (×${Math.max(1, people)} pers.)`, amount, type: "experience" });
    subtotals.experience += amount;
  }

  for (const svc of services) {
    if (svc.price > 0) {
      entries.push({ label: svc.label, amount: svc.price, type: "service" });
      subtotals.service += svc.price;
    }
  }

  const estimatedTotal = Object.values(subtotals).reduce((sum, v) => sum + v, 0);

  return { entries, subtotals, estimatedTotal };
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount == null || amount <= 0) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);
}
