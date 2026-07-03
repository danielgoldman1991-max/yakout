import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export type PublicVehicle = {
  id: string;
  display_name: string;
  slug: string;
  category: string | null;
  vehicle_type: string | null;
  capacity: number;
  luggage_capacity: number | null;
  price_from: number;
  price_transfer: number | null;
  currency: string;
  with_driver: boolean;
  short_description: string | null;
  description: string | null;
  use_cases: string[] | null;
  amenities: string[] | null;
  cover_image: string | null;
  cover_alt: string | null;
  public_status: string | null;
};

type PublicVehicleRow = {
  id: string;
  public_name: string | null;
  public_title: string | null;
  slug: string;
  category: string | null;
  vehicle_type: string | null;
  capacity: number;
  luggage_capacity: number | null;
  price_from: number;
  price_transfer: number | null;
  currency: string | null;
  with_driver: boolean;
  short_description: string | null;
  description: string | null;
  use_cases: string[] | null;
  amenities: string[] | null;
  image_url: string | null;
  image_alt_text: string | null;
  public_status: string | null;
  vehicle_images: Array<{
    url: string | null;
    image_url: string | null;
    image_alt_text: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
  }> | null;
};

function normalizePublicVehicle(row: PublicVehicleRow): PublicVehicle {
  const images = (row.vehicle_images ?? [])
    .map((img) => ({
      url: img.url ?? null,
      image_url: img.image_url ?? null,
      image_alt_text: img.image_alt_text ?? null,
      is_cover: Boolean(img.is_cover),
      sort_order: img.sort_order ?? 0,
    }))
    .filter((img) => img.image_url || img.url)
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);

  const cover = images[0];
  const coverImage = cover?.image_url ?? cover?.url ?? row.image_url ?? null;
  const coverAlt = cover?.image_alt_text ?? row.image_alt_text ?? null;

  return {
    id: row.id,
    display_name: row.public_title ?? row.public_name ?? "Vehicule",
    slug: row.slug,
    category: row.category ?? null,
    vehicle_type: row.vehicle_type ?? null,
    capacity: row.capacity ?? 1,
    luggage_capacity: row.luggage_capacity ?? null,
    price_from: row.price_from ?? 0,
    price_transfer: row.price_transfer ?? null,
    currency: row.currency ?? "MAD",
    with_driver: row.with_driver ?? true,
    short_description: row.short_description ?? null,
    description: row.description ?? null,
    use_cases: row.use_cases ?? null,
    amenities: row.amenities ?? null,
    cover_image: coverImage,
    cover_alt: coverAlt,
    public_status: row.public_status ?? null,
  };
}

export async function getPublicTransportVehicles(): Promise<PublicVehicle[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      public_name,
      public_title,
      slug,
      category,
      vehicle_type,
      capacity,
      luggage_capacity,
      price_from,
      price_transfer,
      currency,
      with_driver,
      short_description,
      description,
      use_cases,
      amenities,
      image_url,
      image_alt_text,
      public_status,
      vehicle_images (
        url,
        image_url,
        image_alt_text,
        is_cover,
        sort_order
      )
    `)
    .eq("public_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    logger.warn("getPublicTransportVehicles failed", { message: error.message, details: error.details });
    return [];
  }

  return ((data ?? []) as PublicVehicleRow[]).map(normalizePublicVehicle);
}
