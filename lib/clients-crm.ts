import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clientStatusLabels, clientStatuses, clientTypeLabels, yakoutMessageTemplates } from "@/lib/clients-crm-shared";
import { logger } from "@/lib/utils/logger";
import type { Client, Lead, Payment, Reservation, Trip } from "@/types/business";

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return uuidRegex.test(value);
}

export { clientStatusLabels, clientStatuses, clientTypeLabels, yakoutMessageTemplates };

export type ClientNote = {
  id: string;
  client_id: string;
  note: string;
  created_at: string;
  updated_at?: string;
};

export type ClientFollowup = {
  id: string;
  client_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: string;
  status: string;
  created_at: string;
};

export type ClientInteraction = {
  id: string;
  client_id: string;
  type: string;
  channel?: string | null;
  subject?: string | null;
  content?: string | null;
  direction?: string | null;
  status?: string | null;
  created_at: string;
};

export type ClientReview = {
  id: string;
  client_id: string;
  rating?: number | null;
  comment?: string | null;
  review_source?: string | null;
  status: string;
  requested_at?: string | null;
  received_at?: string | null;
  created_at: string;
};

export type ClientCrmSummary = {
  client: Client;
  leads: Lead[];
  reservations: Reservation[];
  trips: Trip[];
  payments: Payment[];
  reviews: ClientReview[];
  followups: ClientFollowup[];
  lastDemand?: Lead;
  lastService?: string;
  lastContactAt?: string;
  nextFollowup?: ClientFollowup;
  totalValue: number;
  satisfaction?: ClientReview;
};

export type ClientCrmDetail = ClientCrmSummary & {
  notes: ClientNote[];
  interactions: ClientInteraction[];
};

export type Client360Result =
  | { ok: true; data: ClientCrmDetail }
  | { ok: false; error: { code: string; message: string } };

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function serviceLabel(value?: string) {
  const labels: Record<string, string> = {
    reservation: "Appartement",
    chauffeur: "Chauffeur / transfert",
    proprietaire: "Confier mon bien",
    vehicule: "Vehicule avec chauffeur",
    services: "Services sur mesure",
    general: "Demande generale",
  };
  return value ? labels[value] ?? value : undefined;
}

async function safeSelect<T>(label: string, query: PromiseLike<{ data: unknown; error: { message?: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    logger.warn(`${label} indisponible pour le CRM clients`, error);
    return [];
  }
  return (data ?? []) as T[];
}

async function getCompanyId(): Promise<string | null> {
  const serverClient = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await serverClient.auth.getUser();
  if (userError || !user) {
    logger.warn("CRM clients: utilisateur non authentifie", userError);
    return null;
  }
  try {
    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    if (profileError || !profile?.company_id) {
      logger.warn("CRM clients: profil entreprise introuvable", profileError);
      return null;
    }
    return profile.company_id as string;
  } catch (err) {
    logger.error("CRM clients: admin client indisponible", err);
    return null;
  }
}

async function getAdminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function getClientLeads(client: Client): Promise<Lead[]> {
  const admin = await getAdminClient();
  if (!admin) return [];
  const batches: Lead[][] = [];

  batches.push(await safeSelect<Lead>("leads client_id", admin.from("leads").select("*").eq("client_id", client.id).order("created_at", { ascending: false })));
  if (client.email) {
    batches.push(await safeSelect<Lead>("leads email", admin.from("leads").select("*").eq("email", client.email).order("created_at", { ascending: false })));
  }
  if (client.phone) {
    batches.push(await safeSelect<Lead>("leads telephone", admin.from("leads").select("*").eq("phone", client.phone).order("created_at", { ascending: false })));
  }

  return uniqueById(batches.flat()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getClientCrmSummaries(): Promise<ClientCrmSummary[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const admin = await getAdminClient();
  if (!admin) return [];

  const clients = await safeSelect<Client>("clients", admin.from("clients").select("*").eq("company_id", companyId).order("created_at", { ascending: false }));

  const summaries = await Promise.all(clients.map(async (client) => {
    const [leads, reservations, trips, payments, reviews, followups] = await Promise.all([
      getClientLeads(client),
      safeSelect<Reservation>("reservations client", admin.from("reservations").select("*").eq("client_id", client.id).order("check_in", { ascending: false })),
      safeSelect<Trip>("trips client", admin.from("trips").select("*").eq("client_id", client.id).order("trip_date", { ascending: false })),
      safeSelect<Payment>("payments client", admin.from("payments").select("*").eq("client_id", client.id).order("paid_at", { ascending: false })),
      safeSelect<ClientReview>("client_reviews", admin.from("client_reviews").select("*").eq("client_id", client.id).order("created_at", { ascending: false })),
      safeSelect<ClientFollowup>("client_followups", admin.from("client_followups").select("*").eq("client_id", client.id).order("due_date", { ascending: true })),
    ]);

    return buildSummary(client, leads, reservations, trips, payments, reviews, followups);
  }));

  return summaries;
}

export async function getClientCrmDetail(id: string): Promise<ClientCrmDetail | null> {
  if (!isValidUUID(id)) return null;

  const companyId = await getCompanyId();
  if (!companyId) return null;

  const admin = await getAdminClient();
  if (!admin) return null;

  const { data: client, error } = await admin.from("clients").select("*").eq("id", id).eq("company_id", companyId).single();
  if (error || !client) {
    logger.warn("Client CRM introuvable", error);
    return null;
  }

  const [leads, reservations, trips, payments, reviews, followups, notes, interactions] = await Promise.all([
    getClientLeads(client as Client),
    safeSelect<Reservation>("reservations client", admin.from("reservations").select("*").eq("client_id", id).order("check_in", { ascending: false })),
    safeSelect<Trip>("trips client", admin.from("trips").select("*").eq("client_id", id).order("trip_date", { ascending: false })),
    safeSelect<Payment>("payments client", admin.from("payments").select("*").eq("client_id", id).order("paid_at", { ascending: false })),
    safeSelect<ClientReview>("client_reviews", admin.from("client_reviews").select("*").eq("client_id", id).order("created_at", { ascending: false })),
    safeSelect<ClientFollowup>("client_followups", admin.from("client_followups").select("*").eq("client_id", id).order("due_date", { ascending: true })),
    safeSelect<ClientNote>("client_notes", admin.from("client_notes").select("*").eq("client_id", id).order("created_at", { ascending: false })),
    safeSelect<ClientInteraction>("client_interactions", admin.from("client_interactions").select("*").eq("client_id", id).order("created_at", { ascending: false })),
  ]);

  return {
    ...buildSummary(client as Client, leads, reservations, trips, payments, reviews, followups),
    notes,
    interactions,
  };
}

export async function getClient360Data(id: string): Promise<Client360Result> {
  if (!isValidUUID(id)) return { ok: false, error: { code: "INVALID_CLIENT_ID", message: "Identifiant client invalide." } };
  try {
    const data = await getClientCrmDetail(id);
    if (!data) return { ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client introuvable ou inaccessible." } };
    return { ok: true, data };
  } catch (error) {
    logger.error("getClient360Data failed", error);
    return { ok: false, error: { code: "CLIENT_360_UNAVAILABLE", message: "La fiche client complète est temporairement indisponible." } };
  }
}

function buildSummary(
  client: Client,
  leads: Lead[],
  reservations: Reservation[],
  trips: Trip[],
  payments: Payment[],
  reviews: ClientReview[],
  followups: ClientFollowup[],
): ClientCrmSummary {
  const lastDemand = leads[0];
  const latestDates = [
    client.updated_at,
    client.created_at,
    lastDemand?.created_at,
    reservations[0]?.check_in,
    trips[0]?.trip_date,
    payments[0]?.paid_at,
  ].filter(Boolean) as string[];
  const nextFollowup = followups.find((item) => item.status !== "done");
  const totalValue = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
    || reservations.reduce((sum, reservation) => sum + Number(reservation.total_amount ?? 0), 0)
    || trips.reduce((sum, trip) => sum + Number(trip.sold_price ?? 0), 0);

  return {
    client,
    leads,
    reservations,
    trips,
    payments,
    reviews,
    followups,
    lastDemand,
    lastService: serviceLabel(lastDemand?.request_type) ?? (reservations[0] ? "Reservation appartement" : trips[0] ? "Transport" : undefined),
    lastContactAt: latestDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0],
    nextFollowup,
    totalValue,
    satisfaction: reviews.find((review) => review.status === "received" || review.rating),
  };
}
