"use server";

import { createSupabaseActionClient } from "@/lib/supabase/server";
import { revalidateClientBookingGraph } from "@/lib/cache/client-booking-revalidation";
import { logger } from "@/lib/utils/logger";

export type ClientRequestBookingState = {
  ok: boolean;
  message: string;
  reservationId?: string | null;
  packageBookingId?: string | null;
  transportBookingId?: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createBookingFromClientRequestAction(
  _previous: ClientRequestBookingState,
  formData: FormData,
): Promise<ClientRequestBookingState> {
  const leadId = String(formData.get("lead_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (!uuidPattern.test(leadId) || !uuidPattern.test(clientId)) return { ok: false, message: "La demande ou le client est invalide." };

  const supabase = await createSupabaseActionClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { ok: false, message: "Votre session a expiré." };
  const { data: profile } = await supabase.from("profiles").select("role,company_id").eq("user_id", authData.user.id).single();
  if (!profile?.company_id || !["admin", "manager"].includes(String(profile.role))) return { ok: false, message: "Vous n’avez pas la permission de créer une réservation." };

  const payload = {
    lead_id: leadId,
    kind: String(formData.get("kind") ?? "accommodation"),
    apartment_id: String(formData.get("apartment_id") ?? ""),
    package_id: String(formData.get("package_id") ?? ""),
    check_in: String(formData.get("check_in") ?? ""),
    check_out: String(formData.get("check_out") ?? ""),
    guests_count: String(formData.get("guests_count") ?? "1"),
    expected_amount: String(formData.get("expected_amount") ?? ""),
    currency: String(formData.get("currency") ?? "MAD"),
    include_transport: formData.get("include_transport") === "on",
    transport_date: String(formData.get("transport_date") ?? ""),
    transport_time: String(formData.get("transport_time") ?? ""),
    pickup_location: String(formData.get("pickup_location") ?? ""),
    dropoff_location: String(formData.get("dropoff_location") ?? ""),
    flight_number: String(formData.get("flight_number") ?? ""),
    idempotency_key: String(formData.get("idempotency_key") ?? ""),
  };
  const { data, error } = await supabase.rpc("create_booking_from_client_request", { p_request: payload });
  if (error) {
    logger.error("createBookingFromClientRequestAction failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    const messages: Record<string, string> = {
      APARTMENT_DATE_CONFLICT: "L’appartement demandé n’est plus disponible aux dates sélectionnées.",
      APARTMENT_UNAVAILABLE_OR_CAPACITY: "L’appartement est indisponible ou sa capacité est insuffisante.",
      REQUEST_ALREADY_PROCESSED: "Une réservation existe déjà pour cette demande.",
      INVALID_DATES: "Les dates de séjour sont invalides.",
      NO_BOOKING_COMPONENT: "Sélectionnez au moins une prestation à réserver.",
    };
    const key = Object.keys(messages).find((item) => error.message.includes(item));
    return { ok: false, message: key ? messages[key] : "La réservation n’a pas pu être créée. Les informations saisies ont été conservées." };
  }
  const result = data as { reservation_id?: string | null; package_booking_id?: string | null; transport_booking_id?: string | null; client_id?: string } | null;
  if (!result || result.client_id !== clientId) return { ok: false, message: "La réservation a renvoyé une relation client incohérente." };
  revalidateClientBookingGraph({
    clientId,
    leadId,
    reservationIds: result.reservation_id ? [result.reservation_id] : [],
    apartmentIds: payload.apartment_id ? [payload.apartment_id] : [],
    packageBookingIds: result.package_booking_id ? [result.package_booking_id] : [],
    transportBookingIds: result.transport_booking_id ? [result.transport_booking_id] : [],
    organizationId: String(profile.company_id),
  });
  return { ok: true, message: "La réservation a été créée.", reservationId: result.reservation_id, packageBookingId: result.package_booking_id, transportBookingId: result.transport_booking_id };
}
