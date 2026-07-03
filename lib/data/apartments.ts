import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import type { Apartment, ApartmentImage, Document, Expense, MaintenanceTask, Payment, Reservation } from "@/types/business";

export const MAX_APARTMENT_IMAGES = 6;

export const managementStatusLabels: Record<string, string> = {
  prospect: "Prospect",
  info_missing: "Infos a completer",
  visit_scheduled: "Visite prevue",
  contract_pending: "Contrat en attente",
  contract_signed: "Contrat signe",
  preparation: "Preparation",
  ready_to_publish: "Pret a publier",
  published: "Publie",
  active_management: "Gestion active",
  paused: "En pause",
  ended: "Gestion terminee",
};

export const publicStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  ready: "Pret a publier",
  published: "Publie",
  paused: "En pause",
  archived: "Archive",
};

export const contractStatusLabels: Record<string, string> = {
  missing: "Manquant",
  to_prepare: "A preparer",
  sent: "Envoye",
  signed: "Signe",
  expired: "Expire",
};

export function normalizeApartmentImage(row: ApartmentImage): ApartmentImage {
  return {
    ...row,
    image_url: row.image_url ?? row.url,
    image_alt_text: row.image_alt_text ?? row.alt_text,
    sort_order: row.sort_order ?? row.display_order ?? 0,
    is_cover: row.is_cover ?? false,
  };
}

export function sortApartmentImages(images: ApartmentImage[]): ApartmentImage[] {
  return images
    .map(normalizeApartmentImage)
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function apartmentCover(apartment: Apartment, images: ApartmentImage[]): { url?: string; alt?: string } {
  const sorted = sortApartmentImages(images);
  const cover = sorted.find((image) => image.is_cover) ?? sorted[0];
  return {
    url: cover?.image_url ?? apartment.image_url,
    alt: cover?.image_alt_text ?? apartment.image_alt_text,
  };
}

function apartmentPublicationResult(apartment: Partial<Apartment>, hasImage: boolean) {
  const missing: string[] = [];
  if (!(apartment.public_name || apartment.internal_name)) missing.push("Ajouter nom public");
  if (!apartment.slug) missing.push("Ajouter slug");
  if (!apartment.district) missing.push("Ajouter quartier");
  if (!apartment.short_description) missing.push("Ajouter description courte");
  if (!Number(apartment.price_per_night ?? apartment.price_from)) missing.push("Ajouter prix");
  if (!Number(apartment.capacity)) missing.push("Ajouter capacite");
  if (!hasImage) missing.push("Ajouter au moins une photo");
  if (apartment.public_status === "archived") missing.push("Sortir l'appartement des archives");
  return { ok: missing.length === 0, missing };
}

export function canPublishApartment(apartment: Partial<Apartment>, images: ApartmentImage[] = []) {
  const cover = apartmentCover(apartment as Apartment, images);
  return apartmentPublicationResult(apartment, Boolean(cover.url));
}

export function canPublishApartmentWithCounts(
  apartment: Partial<Apartment>,
  existingImagesCount: number,
  pendingImagesCount: number,
) {
  return apartmentPublicationResult(apartment, existingImagesCount + pendingImagesCount > 0);
}

export async function getApartmentImages(apartmentId: string, client?: SupabaseClient): Promise<ApartmentImage[]> {
  const supabase = client ?? createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("apartment_images")
    .select("*")
    .eq("apartment_id", apartmentId)
    .order("sort_order", { ascending: true });
  if (error) {
    logger.warn("getApartmentImages failed", error);
    return [];
  }
  return sortApartmentImages((data ?? []) as ApartmentImage[]);
}

export async function getApartmentDocuments(apartmentId: string): Promise<Document[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("documents").select("*").eq("apartment_id", apartmentId).order("created_at", { ascending: false });
  if (error) {
    logger.warn("getApartmentDocuments failed", error);
    return [];
  }
  return (data ?? []) as Document[];
}

export async function getApartmentReservations(apartmentId: string): Promise<Reservation[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("reservations").select("*").eq("apartment_id", apartmentId).order("check_in", { ascending: false });
  if (error) {
    logger.warn("getApartmentReservations failed", error);
    return [];
  }
  return (data ?? []) as Reservation[];
}

export async function getApartmentPayments(apartmentId: string): Promise<Payment[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("payments").select("*").eq("apartment_id", apartmentId).order("paid_at", { ascending: false });
  if (error) {
    logger.warn("getApartmentPayments failed", error);
    return [];
  }
  return (data ?? []) as Payment[];
}

export async function getApartmentExpenses(apartmentId: string): Promise<Expense[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("expenses").select("*").eq("apartment_id", apartmentId).order("expense_date", { ascending: false });
  if (error) {
    logger.warn("getApartmentExpenses failed", error);
    return [];
  }
  return (data ?? []) as Expense[];
}

export async function getApartmentMaintenanceTasks(apartmentId: string): Promise<MaintenanceTask[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("maintenance_tasks").select("*").eq("apartment_id", apartmentId).order("created_at", { ascending: false });
  if (error) {
    logger.warn("getApartmentMaintenanceTasks failed", error);
    return [];
  }
  return (data ?? []) as MaintenanceTask[];
}
