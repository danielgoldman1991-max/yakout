const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && uuidRegex.test(value);
}

export function normalizeUuid(value: unknown): string | null {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "none" ||
    value === "aucun" ||
    value === "null" ||
    value === "undefined"
  ) {
    return null;
  }
  if (typeof value === "string" && uuidRegex.test(value)) {
    return value;
  }
  return null;
}

export class InvalidUuidError extends Error {
  constructor(raw: unknown) {
    super(`UUID invalide : "${String(raw)}". La valeur a été ignorée.`);
    this.name = "InvalidUuidError";
  }
}

export function normalizeOptionalUuid(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (!uuidRegex.test(normalized)) throw new InvalidUuidError(value);
  return normalized;
}

export function normalizeRequiredUuid(value: unknown, message: string): string {
  const normalized = normalizeOptionalUuid(value);
  if (!normalized) throw new Error(message);
  return normalized;
}

export function requireUuid(value: unknown, label: string): string | null {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "none" ||
    value === "aucun" ||
    value === "null" ||
    value === "undefined"
  ) {
    return null;
  }
  if (typeof value === "string" && uuidRegex.test(value)) {
    return value;
  }
  throw new InvalidUuidError(`[${label}] ${String(value)}`);
}
