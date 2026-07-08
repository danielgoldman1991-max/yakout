import { format, isValid, parse, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";
export const API_DATE_FORMAT = "yyyy-MM-dd";
export const DISPLAY_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const DISPLAY_MONTH_FORMAT = "MMMM yyyy";
export const TIME_ZONE = "Africa/Casablanca";
export const timeZone = TIME_ZONE;

const isoDateOnlyRE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODateOnly(value: string): Date | null {
  const match = isoDateOnlyRE.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isValid(date) ? date : null;
}

export function parseDateValue(value: string): Date | null {
  if (!value) return null;

  if (isoDateOnlyRE.test(value.trim())) {
    return parseISODateOnly(value);
  }

  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;

  const parsedDisplay = parse(value.trim(), DISPLAY_DATE_FORMAT, new Date(), { locale: fr });
  if (isValid(parsedDisplay)) return parsedDisplay;

  return null;
}

export function formatDateFr(value: string | Date | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date || !isValid(date)) return fallback;
  return format(date, DISPLAY_DATE_FORMAT, { locale: fr });
}

export function formatDateTimeFr(value: string | Date | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date || !isValid(date)) return fallback;
  return format(date, DISPLAY_DATETIME_FORMAT, { locale: fr });
}

export function formatDateLongFr(value: string | Date | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date || !isValid(date)) return fallback;
  return format(date, "d MMMM yyyy", { locale: fr });
}

export function parseDisplayDate(value: string): Date | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = parse(normalized, DISPLAY_DATE_FORMAT, new Date(), { locale: fr });
  return isValid(parsed) ? parsed : null;
}

export function displayDateToApiDate(value: string): string | null {
  const parsed = parseDisplayDate(value);
  if (!parsed) return null;
  return format(parsed, API_DATE_FORMAT);
}

export function apiDateToDisplayDate(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseISODateOnly(value);
  if (!parsed) return "";
  return format(parsed, DISPLAY_DATE_FORMAT);
}

export function nightsBetween(start: string, end: string): number {
  const s = parseISODateOnly(start);
  const e = parseISODateOnly(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function todayApi(): string {
  const now = new Date();
  return format(now, API_DATE_FORMAT);
}

export function todayDisplay(): string {
  const now = new Date();
  return format(now, DISPLAY_DATE_FORMAT, { locale: fr });
}

export function nowDisplay(): string {
  const now = new Date();
  return format(now, DISPLAY_DATETIME_FORMAT, { locale: fr });
}
