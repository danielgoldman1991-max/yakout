import { z } from "zod";
import { userRoles } from "@/types/auth";
import { leadRequestTypes, normalizeLeadRequestType } from "@/lib/leads";

const optionalEmail = z.union([z.email(), z.literal("")]).optional();
const optionalNumber = (defaultValue: number, min = 0) =>
  z.preprocess((value) => (value === "" || value == null ? defaultValue : value), z.coerce.number().min(min));

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

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire."),
  phone: z.string().trim().min(6, "Le téléphone est obligatoire."),
  email: optionalEmail,
  request_type: z.preprocess((value) => normalizeLeadRequestType(value), z.enum(leadRequestTypes, { message: "Type de demande invalide." })),
  district: z.string().optional(),
  source: z.string().trim().optional().default("contact_form"),
  page_url: z.string().trim().optional().transform((value) => value || undefined),
  related_type: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["apartment", "vehicle"]).optional()),
  related_slug: z.string().trim().optional().transform((value) => value || undefined),
  message: z.string().trim().min(5, "Le message est obligatoire."),
  desired_date: z.string().optional(),
  people_count: optionalNumber(1, 1).optional(),
  estimated_budget: optionalNumber(0).optional(),
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
  bathrooms: optionalNumber(0),
  bedrooms: optionalNumber(0),
  capacity: optionalNumber(1, 1),
  price_from: optionalNumber(0),
  short_description: z.string().optional(),
  detailed_description: z.string().optional(),
  amenities: z.string().optional(),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  is_published: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
});

export const reservationSchema = z.object({
  client_id: z.string().optional(),
  apartment_id: z.string().optional(),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  people_count: optionalNumber(1, 1),
  total_amount: optionalNumber(0),
  deposit_amount: optionalNumber(0),
});

export const vehicleSchema = z.object({
  internal_name: z.string().min(2),
  public_name: z.string().min(2),
  slug: z.string().min(2),
  brand: z.string().min(2),
  model: z.string().min(1),
  capacity: optionalNumber(1, 1),
  price_from: optionalNumber(0),
  with_driver: z.coerce.boolean().default(true),
  is_published: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  public_description: z.string().optional(),
  image_url: optionalImageUrl,
  image_alt_text: z.string().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
});

export const tripSchema = z.object({
  client_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  trip_date: z.string().min(1),
  trip_time: z.string().optional(),
  departure: z.string().min(2),
  destination: z.string().min(2),
  sold_price: optionalNumber(0),
  cost_price: optionalNumber(0),
});

export const partnerSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  phone: z.string().min(6),
  email: optionalEmail,
  commission: optionalNumber(0).optional(),
});

export const paymentSchema = z.object({
  client_id: z.string().optional(),
  amount: optionalNumber(0),
  paid_at: z.string().min(1),
  payment_method: z.string().min(2),
  activity_type: z.string().min(2),
  status: z.string().default("En attente"),
});

export const expenseSchema = z.object({
  expense_date: z.string().min(1),
  amount: optionalNumber(0),
  category: z.string().min(2),
  activity_type: z.string().min(2),
});

export const blogPostSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  excerpt: z.string().min(5),
  content: z.string().min(10),
  category: z.string().min(2),
  cover_image_url: optionalImageUrl,
  cover_image_alt: z.string().optional(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
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

export type LeadInput = z.infer<typeof leadSchema>;
