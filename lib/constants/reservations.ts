export const RESERVATION_STATUS = {
  DRAFT: "draft",
  OPTION: "option",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  EXPIRED: "expired",
} as const;

export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  option: "Option",
  confirmed: "Confirmee",
  checked_in: "Voyageur arrive",
  checked_out: "Sejour termine",
  cancelled: "Annulee",
  no_show: "Non-presentation",
  expired: "Option expiree",
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["option", "confirmed", "cancelled"],
  option: ["confirmed", "expired", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
  expired: ["option", "cancelled"],
};

export const BLOCKING_STATUSES = ["option", "confirmed", "checked_in"];

export const RESERVATION_SOURCES = {
  DIRECT: "direct",
  WEBSITE: "website",
  WHATSAPP: "whatsapp",
  AIRBNB: "airbnb",
  BOOKING: "booking",
  PARTNER: "partner",
  PACKAGE: "package",
  OWNER: "owner",
  OTHER: "other",
} as const;

export type ReservationSource = (typeof RESERVATION_SOURCES)[keyof typeof RESERVATION_SOURCES];

export const RESERVATION_SOURCE_LABELS: Record<string, string> = {
  direct: "Reservation directe",
  website: "Site Yakout",
  whatsapp: "WhatsApp",
  airbnb: "Airbnb",
  booking: "Booking.com",
  partner: "Partenaire",
  package: "Pack Yakout",
  owner: "Proprietaire",
  other: "Autre",
};

export const PAYMENT_PARTS = {
  DEPOSIT: "deposit",
  BALANCE: "balance",
  FULL: "full",
  EXTRA: "extra",
  REFUND: "refund",
} as const;

export const PAYMENT_PART_LABELS: Record<string, string> = {
  deposit: "Acompte",
  balance: "Solde",
  full: "Paiement complet",
  extra: "Supplement",
  refund: "Remboursement",
};

export const PAYMENT_TYPE = {
  ACCOMMODATION: "accommodation",
  TRANSPORT: "transport",
  SERVICE: "service",
  OTHER: "other",
} as const;

export const RESERVATION_ITEM_TYPES = {
  ACCOMMODATION: "accommodation",
  CLEANING: "cleaning",
  TOURIST_TAX: "tourist_tax",
  TRANSPORT: "transport",
  PACKAGE: "package",
  SERVICE: "service",
  DISCOUNT: "discount",
  OTHER: "other",
} as const;

export const RESERVATION_EVENT_TYPES = {
  CREATED: "created",
  UPDATED: "updated",
  STATUS_CHANGED: "status_changed",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  EXPIRED: "expired",
  PAYMENT_ADDED: "payment_added",
  PAYMENT_REFUNDED: "payment_refunded",
  DOCUMENT_ADDED: "document_added",
  CLIENT_CHANGED: "client_changed",
  APARTMENT_CHANGED: "apartment_changed",
  DATES_CHANGED: "dates_changed",
  PRICE_CHANGED: "price_changed",
} as const;

export function formatTotalGuests(adults: number, children: number, infants: number): string {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} adulte${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} enfant${children > 1 ? "s" : ""}`);
  if (infants > 0) parts.push(`${infants} bebe${infants > 1 ? "s" : ""}`);
  return parts.join(", ");
}
