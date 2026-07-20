"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AvailabilityResult = { ok: boolean; available?: boolean; error?: string; nights?: number; total?: number | null; currency?: string };

export async function checkPublicApartmentAvailability(input: { apartmentId: string; checkIn: string; checkOut: string; guests: number }): Promise<AvailabilityResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.apartmentId)) return { ok: false, error: "Appartement invalide." };
  const start = new Date(`${input.checkIn}T12:00:00`); const end = new Date(`${input.checkOut}T12:00:00`); const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!input.checkIn || !input.checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: false, error: "Indiquez des dates valides." };
  if (start < today) return { ok: false, error: "La date d’arrivée ne peut pas être passée." };
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (nights < 1) return { ok: false, error: "Le départ doit être après l’arrivée." };
  const supabase = createSupabaseAdminClient();
  const { data: apartment, error } = await supabase.from("apartments").select("id,capacity,minimum_nights,price_per_night,price_from,currency,public_status,is_published").eq("id", input.apartmentId).maybeSingle();
  if (error || !apartment || (apartment.public_status !== "published" && !apartment.is_published)) return { ok: false, error: "Ce logement n’est plus disponible à la réservation." };
  if (input.guests < 1 || input.guests > Number(apartment.capacity ?? 1)) return { ok: false, error: `Ce logement peut accueillir au maximum ${apartment.capacity} voyageurs.` };
  if (nights < Number(apartment.minimum_nights ?? 1)) return { ok: false, error: `Le séjour minimum est de ${apartment.minimum_nights} nuit(s).` };
  const { data: conflicts, error: conflictError } = await supabase.from("reservations").select("id").eq("apartment_id", input.apartmentId).lt("check_in", input.checkOut).gt("check_out", input.checkIn).in("reservation_status", ["option", "confirmed", "checked_in", "Pre-reservation", "Confirmée"]).limit(1);
  if (conflictError) return { ok: false, error: "La disponibilité ne peut pas être vérifiée pour le moment." };
  const price = Number(apartment.price_per_night ?? apartment.price_from ?? 0);
  return { ok: true, available: !conflicts?.length, nights, total: price > 0 ? price * nights : null, currency: apartment.currency ?? "MAD" };
}
