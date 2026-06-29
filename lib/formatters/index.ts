export const timeZone = "Africa/Casablanca";

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Non renseigne";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone,
  }).format(new Date(value));
}

export function nightsBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
