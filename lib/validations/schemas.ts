import { z } from "zod";
import { userRoles } from "@/types/auth";
import { leadRequestTypes, normalizeLeadRequestType } from "@/lib/leads";

const optionalEmail = z.union([z.email(), z.literal("")]).optional();
const optionalNumber = (defaultValue: number, min = 0) =>
  z.preprocess((value) => (value === "" || value == null ? defaultValue : value), z.coerce.number().min(min));

const emptyToNull = z.literal("").transform(() => null);

const optionalUuid = z.union([emptyToNull, z.string().uuid()]).nullable().optional();

// Accepts: relative path (/images/...), absolute URL (https://...), empty string, or null
const optionalImageUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value.trim() === "") return null;
    return value.trim();
  })
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Chemin d'image invalide. Utilisez /images/... ou une URL https://..." },
  );

export const userRoleSchema = z.enum(userRoles);

export const profileSchema = z.object({
  user_id: z.uuid(),
  company_id: z.uuid(),
  full_name: z.string().min(2),
  role: userRoleSchema,
  avatar_url: optionalImageUrl,
});

const metadataRecord = z.record(z.string(), z.unknown()).optional();

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire."),
  phone: z.string().trim().min(6, "Le téléphone est obligatoire."),
  email: optionalEmail,
  request_type: z.preprocess((value) => normalizeLeadRequestType(value), z.enum(leadRequestTypes, { message: "Type de demande invalide." })),
  district: z.string().optional(),
  source: z.string().trim().optional().default("contact_form"),
  page_url: z.string().trim().optional().transform((value) => value || undefined),
  related_type: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["apartment", "vehicle", "package", "service", "trip", "transfer"]).optional()),
  related_slug: z.string().trim().optional().transform((value) => value || undefined),
  related_id: z.string().uuid().optional().nullable(),
  message: z.string().trim().optional().default(""),
  desired_date: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  people_count: optionalNumber(1, 1).optional(),
  estimated_budget: optionalNumber(0).optional(),
  metadata: metadataRecord,
});

export const clientSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(6),
  email: optionalEmail,
  nationality: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  preferred_language: z.string().optional(),
  client_type: z.string().optional(),
  status: z.string().optional(),
  tags: z.preprocess(
    (value) => typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value,
    z.array(z.string()).optional(),
  ),
  acquisition_source: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  preferences: z.string().optional(),
});

export const clientNoteSchema = z.object({
  note: z.string().trim().min(2, "La note est trop courte."),
});

export const clientFollowupSchema = z.object({
  title: z.string().trim().min(2, "Le titre est obligatoire."),
  description: z.string().trim().optional(),
  due_date: z.string().optional(),
  priority: z.string().trim().default("normal"),
  status: z.string().trim().default("open"),
});

export const clientReviewSchema = z.object({
  rating: optionalNumber(0).optional(),
  comment: z.string().trim().optional(),
  review_source: z.string().trim().optional(),
  status: z.string().trim().default("requested"),
});

export const apartmentSchema = z.object({
  internal_name: z.string().min(2),
  public_name: z.string().min(2),
  slug: z.string().min(2),
  district: z.string().min(2),
  city: z.string().optional().default("Marrakech"),
  public_district: z.string().optional(),
  address_private: z.string().optional(),
  address_public_hint: z.string().optional(),
  map_area: z.string().optional(),
  internal_reference: z.string().optional(),
  property_type: z.string().optional(),
  bathrooms: optionalNumber(0),
  bedrooms: optionalNumber(0),
  beds: optionalNumber(0).optional(),
  capacity: optionalNumber(1, 1),
  floor: z.string().optional(),
  has_elevator: z.coerce.boolean().default(false),
  surface_area: optionalNumber(0).optional(),
  has_terrace: z.coerce.boolean().default(false),
  has_pool: z.coerce.boolean().default(false),
  has_parking: z.coerce.boolean().default(false),
  price_from: optionalNumber(0),
  price_per_night: optionalNumber(0).optional(),
  currency: z.string().optional().default("MAD"),
  cleaning_fee: optionalNumber(0).optional(),
  deposit_amount: optionalNumber(0).optional(),
  minimum_nights: optionalNumber(1, 1).optional(),
  commission_rate: optionalNumber(0).optional(),
  short_description: z.string().optional(),
  detailed_description: z.string().optional(),
  description: z.string().optional(),
  highlights: z.string().optional(),
  amenities: z.string().optional(),
  house_rules: z.string().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  access_instructions: z.string().optional(),
  cleaning_instructions: z.string().optional(),
  wifi_name: z.string().optional(),
  wifi_password: z.string().optional(),
  maintenance_notes: z.string().optional(),
  internal_notes: z.string().optional(),
  management_status: z.enum([
    "prospect", "info_missing", "visit_scheduled", "contract_pending", "contract_signed",
    "preparation", "ready_to_publish", "published", "active_management", "paused", "ended",
  ]).default("prospect"),
  public_status: z.enum(["draft", "ready", "published", "paused", "archived"]).default("draft"),
  contract_status: z.enum(["missing", "to_prepare", "sent", "signed", "expired"]).default("missing"),
  onboarding_status: z.enum(["incomplete", "in_progress", "complete"]).default("incomplete"),
  is_published: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  published_at: z.string().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
  owner_id: z.string().optional(),
});

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? undefined : value;
};

const optionalText = z.preprocess(emptyStringToUndefined, z.string().optional());

const dateString = z.string().min(1, "La date est requise.");

const positiveNumber = (defaultValue: number) =>
  z.preprocess((value) => (value === "" || value == null ? defaultValue : value), z.coerce.number().min(0));

const guestNumber = (defaultValue: number) =>
  z.preprocess((value) => (value === "" || value == null ? defaultValue : value), z.coerce.number().int().min(0));

// Shared base: fields common to all reservation statuses
const reservationBaseSchema = z.object({
  client_id: optionalUuid,
  apartment_id: optionalUuid,
  lead_id: optionalUuid,
  package_id: optionalUuid,
  check_in: dateString,
  check_out: dateString,
  source: optionalText,
  external_reference: optionalText,
  external_url: optionalText,
  adults: guestNumber(1),
  children: guestNumber(0),
  infants: guestNumber(0),
  guest_name: optionalText,
  guest_email: optionalText,
  guest_phone: optionalText,
  guest_country: optionalText,
  arrival_time: optionalText,
  departure_time: optionalText,
  currency: optionalText,
  nightly_rate: positiveNumber(0),
  total_amount: positiveNumber(0),
  deposit_amount: positiveNumber(0),
  cleaning_fee: positiveNumber(0),
  tourist_tax: positiveNumber(0),
  services_total: positiveNumber(0),
  discount_amount: positiveNumber(0),
  special_requests: optionalText,
  internal_notes: optionalText,
}).refine((data) => {
  if (!data.check_in || !data.check_out) return true;
  return new Date(data.check_out).getTime() > new Date(data.check_in).getTime();
}, { message: "La date de depart doit etre posterieure a la date d'arrivee.", path: ["check_out"] });

// Draft: minimal validation, most fields optional via preprocess
export const reservationDraftSchema = reservationBaseSchema;

// Option: dates + apartment required, guest name preferred
export const reservationOptionSchema = reservationBaseSchema.safeExtend({
  apartment_id: z.string().uuid("Selectionnez un appartement."),
  check_in: dateString.min(1, "La date d'arrivee est requise."),
  check_out: dateString.min(1, "La date de depart est requise."),
  guest_name: z.string().min(1, "Le nom du voyageur est requis.").optional(),
}).refine((data) => {
  if (!data.check_in || !data.check_out) return false;
  return new Date(data.check_out).getTime() > new Date(data.check_in).getTime();
}, { message: "La date de depart doit etre posterieure a la date d'arrivee.", path: ["check_out"] });

// Confirmation: all required fields validated
export const reservationConfirmSchema = reservationBaseSchema.safeExtend({
  client_id: z.string().uuid("Selectionnez ou creez un client."),
  apartment_id: z.string().uuid("Selectionnez un appartement."),
  check_in: dateString.min(1, "La date d'arrivee est requise."),
  check_out: dateString.min(1, "La date de depart est requise."),
  guest_name: z.string().min(1, "Le nom du voyageur est requis."),
  adults: guestNumber(1).refine((v) => v >= 1, { message: "Au moins 1 adulte." }),
  total_amount: positiveNumber(0).refine((v) => v > 0, { message: "Le montant total doit etre superieur a 0." }),
}).refine((data) => {
  return new Date(data.check_out).getTime() > new Date(data.check_in).getTime();
}, { message: "La date de depart doit etre posterieure a la date d'arrivee.", path: ["check_out"] });

// Backward-compatible alias
export const reservationSchema = reservationDraftSchema;

export const vehicleSchema = z.object({
  internal_name: z.string().min(2),
  public_name: z.string().min(2),
  title: z.string().optional(),
  public_title: z.string().optional(),
  internal_reference: z.string().optional(),
  partner_id: optionalUuid,
  slug: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().default("other"),
  vehicle_type: z.string().optional(),
  capacity: optionalNumber(1, 1),
  luggage_capacity: optionalNumber(0).optional(),
  transmission: z.string().optional(),
  fuel_type: z.string().optional(),
  color: z.string().optional(),
  plate_number: z.string().optional(),
  ownership_type: z.enum(["owned", "partner", "rental_partner", "occasional"]).default("partner"),
  driver_required: z.coerce.boolean().default(true),
  availability_status: z.enum(["available", "busy", "maintenance", "unavailable"]).default("available"),
  public_status: z.enum(["draft", "published", "paused", "archived"]).default("draft"),
  management_status: z.string().default("active"),
  price_from: optionalNumber(0),
  price_transfer: optionalNumber(0).optional(),
  price_half_day: optionalNumber(0).optional(),
  price_full_day: optionalNumber(0).optional(),
  price_per_km: optionalNumber(0).optional(),
  currency: z.string().default("MAD"),
  commission_rate: optionalNumber(0).optional(),
  with_driver: z.coerce.boolean().default(true),
  is_published: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  short_description: z.string().optional(),
  description: z.string().optional(),
  public_description: z.string().optional(),
  use_cases: z.string().optional(),
  amenities: z.string().optional(),
  internal_notes: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
  technical_visit_expiry_date: z.string().optional(),
  authorization_expiry_date: z.string().optional(),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
});

export const tripSchema = z.object({
  lead_id: optionalUuid,
  client_id: optionalUuid,
  vehicle_id: optionalUuid,
  partner_id: optionalUuid,
  package_id: optionalUuid,
  title: z.string().optional(),
  trip_type: z.string().optional(),
  destination_label: z.string().optional(),
  itinerary: z.string().optional(),
  trip_date: z.string().min(1),
  trip_time: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  passengers_count: optionalNumber(1, 1).optional(),
  departure: z.string().min(2),
  destination: z.string().min(2),
  sold_price: optionalNumber(0),
  cost_price: optionalNumber(0),
  amount: optionalNumber(0).optional(),
  cost_amount: optionalNumber(0).optional(),
  currency: z.string().default("MAD"),
  status: z.string().default("planned"),
  payment_status: z.string().default("pending"),
  notes: z.string().optional(),
});

export const partnerSchema = z.object({
  name: z.string().min(2),
  type: z.string().optional(),
  partner_type: z.string().min(2),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: optionalEmail,
  city: z.string().default("Marrakech"),
  address: z.string().optional(),
  company_name: z.string().optional(),
  ice: z.string().optional(),
  tax_id: z.string().optional(),
  contact_person: z.string().optional(),
  preferred_contact_channel: z.string().default("whatsapp"),
  status: z.string().default("active"),
  service_categories: z.string().optional(),
  zones: z.string().optional(),
  languages: z.string().optional(),
  commission_rate: optionalNumber(0).optional(),
  default_cost_type: z.string().optional(),
  payment_terms: z.string().optional(),
  bank_name: z.string().optional(),
  rib: z.string().optional(),
  rating: optionalNumber(0, 0).optional(),
  reliability_score: optionalNumber(0, 0).optional(),
  commission: optionalNumber(0).optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
});

export const transferSchema = z.object({
  lead_id: optionalUuid,
  client_id: optionalUuid,
  vehicle_id: optionalUuid,
  partner_id: optionalUuid,
  driver_name: z.string().optional(),
  transfer_type: z.string().min(2),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
  pickup_date: z.string().optional(),
  pickup_time: z.string().optional(),
  passengers_count: optionalNumber(1, 1).optional(),
  luggage_count: optionalNumber(0).optional(),
  flight_number: z.string().optional(),
  amount: optionalNumber(0),
  currency: z.string().default("MAD"),
  cost_amount: optionalNumber(0),
  status: z.string().default("pending"),
  payment_status: z.string().default("pending"),
  notes: z.string().optional(),
});

export const packageSchema = z.object({
  title: z.string().min(2),
  public_title: z.string().optional(),
  slug: z.string().min(2),
  package_type: z.string().default("custom"),
  short_description: z.string().optional(),
  description: z.string().optional(),
  destination: z.string().optional(),
  duration_label: z.string().optional(),
  capacity_min: optionalNumber(0).optional(),
  capacity_max: optionalNumber(0).optional(),
  price_from: optionalNumber(0).optional(),
  currency: z.string().default("MAD"),
  public_status: z.enum(["draft", "published", "paused", "archived"]).default("draft"),
  is_featured: z.coerce.boolean().default(false),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  internal_notes: z.string().optional(),
  items_json: z.string().optional(),
});

export const paymentSchema = z.object({
  client_name: z.string().optional(),
  client_id: optionalUuid,
  lead_id: optionalUuid,
  reservation_id: optionalUuid,
  apartment_id: optionalUuid,
  owner_id: optionalUuid,
  trip_id: optionalUuid,
  vehicle_id: optionalUuid,
  partner_id: optionalUuid,
  transfer_id: optionalUuid,
  package_id: optionalUuid,
  title: z.string().optional(),
  description: z.string().optional(),
  amount: optionalNumber(0),
  currency: z.string().default("MAD"),
  payment_reference: z.string().optional(),
  payment_type: z.enum(["accommodation", "transport", "trip", "package", "service", "owner_payout", "other"]).default("other"),
  payment_part: z.union([emptyToNull, z.enum(["deposit", "balance", "full", "adjustment"])]).nullable().optional(),
  source: z.union([emptyToNull, z.enum(["direct", "whatsapp", "website", "airbnb", "booking", "partner", "other"])]).nullable().optional(),
  stay_check_in: z.string().optional(),
  stay_check_out: z.string().optional(),
  guests_count: optionalNumber(1, 1).optional(),
  create_reservation: z.coerce.boolean().optional(),
  total_amount: optionalNumber(0).optional(),
  paid_at: z.string().min(1, "La date de paiement est obligatoire."),
  due_date: z.string().optional(),
  payment_method: z.string().min(1, "Le moyen de paiement est obligatoire."),
  activity_type: z.string().min(1, "Le type d'activite est obligatoire."),
  status: z.enum(["pending", "partial", "paid", "failed", "refunded", "cancelled"]).default("pending"),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.amount <= 0) {
    ctx.addIssue({ code: "custom", message: "Le montant doit etre superieur a 0.", path: ["amount"] });
  }
  if (data.payment_type === "accommodation" && !data.apartment_id) {
    ctx.addIssue({ code: "custom", message: "Appartement obligatoire pour une recette d'hebergement.", path: ["apartment_id"] });
  }
  if (data.stay_check_in && data.stay_check_out && new Date(data.stay_check_out).getTime() <= new Date(data.stay_check_in).getTime()) {
    ctx.addIssue({ code: "custom", message: "La date de depart doit etre apres la date d'arrivee.", path: ["stay_check_out"] });
  }
});

export const accommodationRevenueSchema = z.object({
  apartment_id: z.string().uuid("Selectionnez un appartement valide."),
  reservation_id: optionalUuid,
  client_id: optionalUuid,
  owner_id: optionalUuid,
  amount: z.coerce.number().positive("Le montant doit etre superieur a zero."),
  currency: z.string().trim().min(1, "Selectionnez une devise."),
  payment_part: z.string().trim().min(1, "Selectionnez le type de paiement."),
  status: z.string().trim().min(1, "Selectionnez un statut."),
  payment_date: z.string().trim().min(1, "La date est obligatoire."),
  source: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  description: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  activity_type: z.string().optional(),
  payment_method: z.string().optional(),
  title: z.string().optional(),
  stay_check_in: z.string().optional(),
  stay_check_out: z.string().optional(),
  guests_count: optionalNumber(1, 1).optional(),
});

export const expenseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().min(1, "La date est obligatoire."),
  amount: optionalNumber(0),
  currency: z.string().default("MAD"),
  category: z.string().min(1, "La categorie est obligatoire."),
  expense_status: z.string().default("paid"),
  payment_method: z.string().optional(),
  activity_type: z.string().optional(),
  client_id: optionalUuid,
  lead_id: optionalUuid,
  reservation_id: optionalUuid,
  apartment_id: optionalUuid,
  vehicle_id: optionalUuid,
  trip_id: optionalUuid,
  transfer_id: optionalUuid,
  package_id: optionalUuid,
  partner_id: optionalUuid,
  owner_id: optionalUuid,
  supplier_name: z.string().optional(),
  notes: z.string().optional(),
});

export const documentSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire."),
  description: z.string().optional(),
  type: z.string().min(1, "Le type de document est obligatoire."),
  category: z.string().optional(),
  file_url: z.string().optional(),
  file_path: z.string().optional(),
  file_name: z.string().optional(),
  file_size: z.coerce.number().optional(),
  mime_type: z.string().optional(),
  file_extension: z.string().optional(),
  storage_bucket: z.string().optional(),
  related_type: z.string().optional(),
  related_id: optionalUuid,
  client_id: optionalUuid,
  owner_id: optionalUuid,
  apartment_id: optionalUuid,
  vehicle_id: optionalUuid,
  partner_id: optionalUuid,
  transfer_id: optionalUuid,
  trip_id: optionalUuid,
  package_id: optionalUuid,
  reservation_id: optionalUuid,
  payment_id: optionalUuid,
  expense_id: optionalUuid,
  expiry_date: z.string().optional(),
  reminder_date: z.string().optional(),
  doc_status: z.string().default("active"),
  is_private: z.coerce.boolean().default(true),
  notes: z.string().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().min(2, "Le titre est obligatoire."),
  slug: z.string().min(2, "Le slug est obligatoire.").regex(/^[a-z0-9-]+$/, "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets."),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  category: z.string().min(2, "La categorie est obligatoire."),
  cover_image_url: optionalImageUrl,
  cover_image_alt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"], { message: "Le statut est invalide." }),
  published_at: z.string().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
  author: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status !== "published") return;

  const title = data.title.trim();
  const excerpt = data.excerpt?.trim() ?? "";
  const content = data.content?.trim() ?? "";
  const looksLikeTest = /^(test|tttt+|lorem ipsum|demo)$/i;

  if (title.length < 5 || looksLikeTest.test(title)) {
    ctx.addIssue({ code: "custom", path: ["title"], message: "Le titre public doit contenir au moins 5 caracteres utiles." });
  }
  if (excerpt.length < 40 || looksLikeTest.test(excerpt)) {
    ctx.addIssue({ code: "custom", path: ["excerpt"], message: "L'extrait public doit contenir au moins 40 caracteres utiles." });
  }
  if (content.length < 160 || looksLikeTest.test(content)) {
    ctx.addIssue({ code: "custom", path: ["content"], message: "Le contenu public doit contenir au moins 160 caracteres utiles." });
  }
});

export const serviceSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  short_description: z.string().min(5),
  description: z.string().min(10),
  icon: z.string().optional(),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  price_from: optionalNumber(0).optional(),
  is_published: z.coerce.boolean().default(false),
  display_order: optionalNumber(0),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
});

export const sitePageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  subtitle: z.string().optional(),
  content: z.string().min(10),
  cover_image_url: optionalImageUrl,
  cover_image_alt: z.string().optional(),
  primary_button_text: z.string().optional(),
  primary_button_url: z.string().optional(),
  secondary_button_text: z.string().optional(),
  secondary_button_url: z.string().optional(),
  status: z.enum(["draft", "published"]),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
});

// ─── Booking form schemas (discriminated) ───

const bookingDatesValid = (d: { check_in: string; check_out: string }) =>
  !d.check_in || !d.check_out || new Date(d.check_out).getTime() > new Date(d.check_in).getTime();

export const selectedApartmentSchema = z.object({
  mode: z.literal("selected_apartment"),
  name: z.string().trim().min(2, "Le nom est obligatoire."),
  phone: z.string().trim().min(6, "Le téléphone est obligatoire."),
  email: optionalEmail,
  check_in: dateString,
  check_out: dateString,
  guests_count: z.coerce.number().int().min(1, "Au moins 1 voyageur."),
  message: z.string().trim().optional().default(""),
  apartment_id: z.string().uuid("Appartement invalide."),
  apartment_slug: z.string().min(1),
}).refine(bookingDatesValid, {
  message: "La date de départ doit être après la date d'arrivée.",
  path: ["check_out"],
});

export const apartmentSearchSchema = z.object({
  mode: z.literal("apartment_search"),
  name: z.string().trim().min(2, "Le nom est obligatoire."),
  phone: z.string().trim().min(6, "Le téléphone est obligatoire."),
  email: optionalEmail,
  check_in: dateString,
  check_out: dateString,
  guests_count: z.coerce.number().int().min(1, "Au moins 1 voyageur."),
  budget: z.coerce.number().min(0).optional(),
  bedrooms_needed: z.string().optional(),
  preferred_district: z.string().optional(),
  message: z.string().trim().optional().default(""),
}).refine(bookingDatesValid, {
  message: "La date de départ doit être après la date d'arrivée.",
  path: ["check_out"],
});

export const apartmentBookingSchema = z.discriminatedUnion("mode", [
  selectedApartmentSchema,
  apartmentSearchSchema,
]);

export type ApartmentBookingInput = z.infer<typeof apartmentBookingSchema>;
export type SelectedApartmentInput = z.infer<typeof selectedApartmentSchema>;
export type ApartmentSearchInput = z.infer<typeof apartmentSearchSchema>;

// ─── End booking schemas ───

export type LeadInput = z.infer<typeof leadSchema>;
