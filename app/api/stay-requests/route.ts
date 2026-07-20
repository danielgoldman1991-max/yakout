import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { logger } from "@/lib/utils/logger";
import { stayComposerSchema } from "@/lib/validations/stay-composer";

const failure = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

function nightsBetween(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000);
}

export async function POST(request: Request) {
  try {
    const parsed = stayComposerSchema.safeParse(await request.json());
    if (!parsed.success) return failure(400, parsed.error.issues[0]?.message ?? "Vérifiez les informations saisies.");
    if (!hasSupabaseEnv()) return failure(503, "Le service de demande est momentanément indisponible.");

    const input = parsed.data;
    const supabase = createSupabaseAdminClient();
    const [{ data: company }, { data: duplicate }] = await Promise.all([
      process.env.YAKOUT_COMPANY_ID
        ? Promise.resolve({ data: { id: process.env.YAKOUT_COMPANY_ID } })
        : supabase.from("companies").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("leads").select("id,created_at").contains("metadata", { operation_id: input.operationId }).limit(1).maybeSingle(),
    ]);
    if (!company?.id) return failure(503, "L’équipe Yakout ne peut pas recevoir la demande pour le moment.");
    if (duplicate?.id) return NextResponse.json({ ok: true, duplicate: true, reference: `YK-${duplicate.id.slice(0, 8).toUpperCase()}` });

    let apartment: { id: string; slug: string; public_name: string; capacity: number; public_district: string | null } | null = null;
    if (input.apartmentId) {
      const result = await supabase.from("apartments")
        .select("id,slug,public_name,capacity,public_district")
        .eq("id", input.apartmentId).eq("is_published", true).maybeSingle();
      apartment = result.data;
      if (!apartment) return failure(409, "L’appartement sélectionné n’est plus disponible. Choisissez une autre option ou laissez Yakout vous proposer un logement.");
      const guests = input.stay.adults + input.stay.children;
      if (guests > apartment.capacity) return failure(409, `Cet appartement accueille au maximum ${apartment.capacity} voyageurs.`);
    }

    let selectedPackage: { id: string; slug: string; public_title: string | null; title: string } | null = null;
    if (input.packageId) {
      const result = await supabase.from("packages").select("id,slug,public_title,title")
        .eq("id", input.packageId).eq("public_status", "published").maybeSingle();
      selectedPackage = result.data;
      if (!selectedPackage) return failure(409, "Le séjour sélectionné n’est plus disponible.");
    }

    const serviceIds = [...new Set(input.serviceIds)];
    const { data: services } = serviceIds.length
      ? await supabase.from("services").select("id,title").in("id", serviceIds).eq("is_published", true)
      : { data: [] as Array<{ id: string; title: string }> };
    if ((services?.length ?? 0) !== serviceIds.length) return failure(409, "Un service sélectionné n’est plus disponible.");

    const destination = input.accommodation.mode === "selected_apartment"
      ? { entity_type: "apartment", entity_id: apartment?.id, label: apartment?.public_name }
      : input.accommodation.mode === "yakout_suggestion"
        ? { entity_type: "yakout_accommodation", entity_id: null, label: "Hébergement Yakout à confirmer" }
        : { entity_type: "external_location", entity_id: null, label: input.accommodation.accommodationName, public_location: input.accommodation.publicLocation };
    const nights = nightsBetween(input.stay.checkIn, input.stay.checkOut);
    const totalGuests = input.stay.adults + input.stay.children + input.stay.infants;
    const metadata = {
      operation_id: input.operationId,
      composer_mode: input.composerMode,
      package_id: selectedPackage?.id ?? null,
      apartment_id: apartment?.id ?? null,
      stay: { check_in: input.stay.checkIn, check_out: input.stay.checkOut, nights, ...input.stay, total_guests: totalGuests },
      accommodation: { ...input.accommodation, apartment_id: apartment?.id ?? null },
      airport_transfer: { ...input.airportTransfer, destination },
      private_driver: input.privateDriver,
      services: (services ?? []).map((service) => ({ id: service.id, title: service.title, details: input.serviceDetails[service.id] || undefined })),
      contact: input.contact,
      price_estimate: { state: "unavailable", reason: "Disponibilités et options à confirmer" },
    };
    const summary = `${nights} nuit${nights > 1 ? "s" : ""}, ${totalGuests} voyageur${totalGuests > 1 ? "s" : ""}. Hébergement : ${destination.label}.`;
    const { data: lead, error } = await supabase.from("leads").insert([{
      company_id: company.id,
      name: input.contact.name,
      phone: input.contact.phone,
      email: input.contact.email || null,
      request_type: "package",
      source: "stay_composer",
      page_url: input.pageUrl,
      related_type: selectedPackage ? "package" : apartment ? "apartment" : null,
      related_slug: selectedPackage?.slug ?? apartment?.slug ?? null,
      related_id: selectedPackage?.id ?? apartment?.id ?? null,
      desired_date: input.stay.checkIn,
      people_count: totalGuests,
      message: input.message ? `${summary}\n\n${input.message}` : summary,
      metadata,
      status: "new",
    }]).select("id,created_at").single();
    if (error || !lead) {
      logger.error("[API/stay-requests] Supabase insert error", error);
      return failure(500, "Votre demande n’a pas pu être envoyée. Vos informations ont été conservées, vous pouvez réessayer.");
    }
    return NextResponse.json({ ok: true, reference: `YK-${lead.id.slice(0, 8).toUpperCase()}` }, { status: 201 });
  } catch (error) {
    logger.error("[API/stay-requests] Unexpected error", error);
    return failure(500, "Votre demande n’a pas pu être envoyée. Vos informations ont été conservées, vous pouvez réessayer.");
  }
}
