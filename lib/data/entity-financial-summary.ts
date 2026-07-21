import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeFinancialSummary, type FinancialSummary } from "@/lib/finance/unified-finance";
import { logger } from "@/lib/utils/logger";

const entityColumns = {
  reservation: "reservation_id",
  apartment: "apartment_id",
  client: "client_id",
  owner: "owner_id",
  trip: "trip_id",
  transfer: "transfer_id",
  package: "package_id",
  maintenance: "maintenance_id",
  partner: "partner_id",
  service: "service_id",
  expense: "expense_id",
  owner_payout: "owner_payout_id",
} as const;

export async function getEntityFinancialSummary(input: {
  entityType: keyof typeof entityColumns;
  entityId: string;
  expectedAmount?: unknown;
  currency: string;
}): Promise<FinancialSummary> {
  const supabase = await createSupabaseServerClient();
  const column = entityColumns[input.entityType];
  const { data, error } = await supabase
    .from("payment_allocations")
    .select("amount,payments!inner(currency,direction,status,category,is_reconciled)")
    .eq(column, input.entityId);
  if (error) {
    logger.error("getEntityFinancialSummary failed", { entityType: input.entityType, entityId: input.entityId, code: error.code, message: error.message });
    return { state: "unavailable", reason: "La synthèse financière centrale est indisponible.", errorCode: error.code };
  }
  const rows = (data ?? []).map((allocation) => {
    const payment = Array.isArray(allocation.payments) ? allocation.payments[0] : allocation.payments;
    return { amount: allocation.amount, ...(payment ?? {}) };
  });
  return computeFinancialSummary({ expectedAmount: input.expectedAmount, currency: input.currency, rows });
}
