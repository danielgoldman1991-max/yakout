import { formatDateFr } from "@/lib/dates";

export function formatReportDate(isoDate: string): string {
  return formatDateFr(isoDate);
}

export function formatReportDateTime(value: string | Date | null | undefined): string {
  if (!value) return "Donnée indisponible";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Donnée indisponible";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatCurrency(amount: number, currency = "MAD"): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

export function formatDecimal(value: number, digits = 2): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
