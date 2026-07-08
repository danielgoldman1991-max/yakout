export { timeZone } from "@/lib/dates";

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export { formatDateFr as formatDate, formatDateTimeFr as formatDateTime, nightsBetween } from "@/lib/dates";
