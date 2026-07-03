import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { logger } from "@/lib/utils/logger";
import type { Package, PackageItem, Partner, Transfer, Trip, Vehicle, VehicleImage } from "@/types/business";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return uuidRegex.test(value);
}

async function getReader() {
  if (!hasSupabaseEnv()) return null;
  try {
    return createSupabaseAdminClient();
  } catch {
    return createSupabaseServerClient();
  }
}

function warn(entity: string, error: unknown) {
  logger.warn(`${entity} indisponible dans Supabase`, error);
}

type VehicleRow = Vehicle & { vehicle_images?: VehicleImage[] };

export function mapVehicle(row: VehicleRow): Vehicle {
  const images = (row.vehicle_images ?? [])
    .map((image) => ({
      ...image,
      image_url: image.image_url ?? image.url,
      image_alt_text: image.image_alt_text ?? image.alt_text,
      sort_order: image.sort_order ?? image.display_order ?? 0,
    }))
    .filter((image) => image.image_url)
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const cover = images[0];
  const publicStatus = row.public_status ?? (row.is_published ? "published" : "draft");
  const publicName = row.public_title ?? row.public_name ?? row.title ?? row.internal_name;
  const internalName = row.title ?? row.internal_name ?? publicName;

  return {
    ...row,
    internal_name: internalName,
    public_name: publicName,
    title: row.title ?? internalName,
    public_title: row.public_title ?? publicName,
    brand: row.brand ?? "",
    model: row.model ?? "",
    category: row.category ?? "other",
    capacity: row.capacity ?? 1,
    luggage_capacity: row.luggage_capacity ?? 0,
    price_from: row.price_from ?? row.price_transfer ?? 0,
    price_transfer: row.price_transfer ?? row.price_from ?? 0,
    currency: row.currency ?? "MAD",
    with_driver: row.with_driver ?? true,
    driver_required: row.driver_required ?? row.with_driver ?? true,
    public_status: publicStatus,
    is_published: publicStatus === "published" || Boolean(row.is_published),
    short_description: row.short_description ?? row.public_description,
    description: row.description ?? row.public_description,
    public_description: row.public_description ?? row.description ?? row.short_description,
    plate_number: row.plate_number ?? row.registration,
    internal_notes: row.internal_notes ?? row.private_notes,
    image_url: row.image_url ?? cover?.image_url,
    image_alt_text: row.image_alt_text ?? cover?.image_alt_text,
    vehicle_images: images,
  };
}

export async function getTransportVehicles(): Promise<Vehicle[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").order("created_at", { ascending: false });
  if (error) { warn("getTransportVehicles", error); return []; }
  return ((data ?? []) as VehicleRow[]).map(mapVehicle);
}

export async function getTransportVehicleById(id: string): Promise<Vehicle | null> {
  if (!isUUID(id)) return null;
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("vehicles").select("*, vehicle_images(*)").eq("id", id).single();
  if (error) { warn("getTransportVehicleById", error); return null; }
  return mapVehicle(data as VehicleRow);
}

function mapTrip(row: Trip): Trip {
  const amount = row.amount ?? row.sold_price ?? 0;
  const cost = row.cost_amount ?? row.cost_price ?? 0;
  return {
    ...row,
    title: row.title ?? row.destination ?? row.trip_type ?? "Trajet",
    departure: row.departure ?? row.pickup_location ?? "",
    destination: row.destination ?? row.destination_label ?? row.dropoff_location ?? "",
    trip_time: row.trip_time ?? row.start_time,
    sold_price: amount,
    cost_price: cost,
    amount,
    cost_amount: cost,
    currency: row.currency ?? "MAD",
    status: row.status ?? row.trip_status ?? "planned",
    payment_status: row.payment_status ?? "pending",
  };
}

export async function getTransportTrips(): Promise<Trip[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("trips").select("*").order("trip_date", { ascending: false });
  if (error) { warn("getTransportTrips", error); return []; }
  return ((data ?? []) as Trip[]).map(mapTrip);
}

export async function getTransportTripById(id: string): Promise<Trip | null> {
  if (!isUUID(id)) return null;
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error) { warn("getTransportTripById", error); return null; }
  return mapTrip(data as Trip);
}

export async function getTransfers(): Promise<Transfer[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("transfers").select("*").order("pickup_date", { ascending: false });
  if (error) { warn("getTransfers", error); return []; }
  return (data ?? []) as Transfer[];
}

export async function getTransferById(id: string): Promise<Transfer | null> {
  if (!isUUID(id)) return null;
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("transfers").select("*").eq("id", id).single();
  if (error) { warn("getTransferById", error); return null; }
  return data as Transfer;
}

export async function getTransportPartners(): Promise<Partner[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("partners").select("*").order("name", { ascending: true });
  if (error) { warn("getTransportPartners", error); return []; }
  return (data ?? []) as Partner[];
}

export async function getTransportPartnerById(id: string): Promise<Partner | null> {
  if (!id || !isUUID(id)) {
    logger.warn(`getTransportPartnerById: id invalide "${id}"`);
    return null;
  }
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("partners").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (!error.message?.includes("No rows found")) {
      logger.error(`getTransportPartnerById echoué pour ${id}`, error);
    }
    return null;
  }
  return data as Partner | null;
}

type PackageRow = Package & { package_items?: PackageItem[] };

const publicPackageSelect = `
  id,
  title,
  public_title,
  slug,
  package_type,
  short_description,
  description,
  destination,
  duration_label,
  capacity_min,
  capacity_max,
  price_from,
  currency,
  public_status,
  is_featured,
  image_url,
  image_alt_text,
  created_at,
  package_items(
    id,
    package_id,
    item_type,
    item_slug,
    title,
    description,
    quantity,
    unit_label,
    price_amount,
    sort_order,
    is_optional
  )
`;

function mapPackage(row: PackageRow): Package {
  const items = [...(row.package_items ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const total = items.filter((item) => !item.is_optional).reduce((sum, item) => sum + Number(item.price_amount ?? 0), 0);
  return {
    ...row,
    public_title: row.public_title ?? row.title,
    currency: row.currency ?? "MAD",
    public_status: row.public_status ?? "draft",
    price_from: row.price_from ?? total,
    package_items: items,
  };
}

export async function getPackages(): Promise<Package[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("packages").select("*, package_items(*)").order("created_at", { ascending: false });
  if (error) { warn("getPackages", error); return []; }
  return ((data ?? []) as PackageRow[]).map(mapPackage);
}

export async function getPackageById(id: string): Promise<Package | null> {
  if (!isUUID(id)) return null;
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("packages").select("*, package_items(*)").eq("id", id).single();
  if (error) { warn("getPackageById", error); return null; }
  return mapPackage(data as PackageRow);
}

export async function getPublishedPackages(): Promise<Package[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data, error } = await supabase.from("packages").select(publicPackageSelect).eq("public_status", "published").order("is_featured", { ascending: false }).order("created_at", { ascending: true });
  if (error) { warn("getPublishedPackages", error); return []; }
  return ((data ?? []) as PackageRow[]).map(mapPackage);
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  const supabase = await getReader();
  if (!supabase) return null;
  const { data, error } = await supabase.from("packages").select(publicPackageSelect).eq("slug", slug).eq("public_status", "published").single();
  if (error) { warn("getPackageBySlug", error); return null; }
  return mapPackage(data as PackageRow);
}
