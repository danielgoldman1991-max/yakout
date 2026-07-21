import "server-only";

import { createSupabaseActionClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { validateFinancialTransaction, type FinancialTransactionInput } from "@/lib/finance/unified-finance";

export type RecordFinancialTransactionResult =
  | { ok: true; paymentId: string; transactionNumber: string }
  | { ok: false; code: string; message: string };

export async function recordFinancialTransaction(input: FinancialTransactionInput): Promise<RecordFinancialTransactionResult> {
  try {
    validateFinancialTransaction(input);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_TRANSACTION";
    return { ok: false, code, message: "La transaction financière est invalide ou sa ventilation est incomplète." };
  }

  const supabase = await createSupabaseActionClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { ok: false, code: "AUTH_REQUIRED", message: "Connexion requise." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,company_id")
    .eq("user_id", authData.user.id)
    .single();
  if (profileError || !profile?.company_id) return { ok: false, code: "ORGANIZATION_REQUIRED", message: "Organisation introuvable." };
  if (!new Set(["admin", "manager"]).has(String(profile.role))) return { ok: false, code: "FINANCE_CREATE_FORBIDDEN", message: "Permission financière insuffisante." };

  const { allocations, ...transaction } = input;
  const { data, error } = await supabase.rpc("record_financial_transaction", {
    p_transaction: transaction,
    p_allocations: allocations,
  });
  if (error) {
    logger.error("recordFinancialTransaction failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    if (error.code === "23505") return { ok: false, code: "DUPLICATE_TRANSACTION", message: "Cette transaction a déjà été enregistrée." };
    return { ok: false, code: error.code || "FINANCIAL_TRANSACTION_FAILED", message: "La transaction financière n’a pas pu être enregistrée." };
  }

  const result = data as { payment_id?: string; transaction_number?: string } | null;
  if (!result?.payment_id || !result.transaction_number) return { ok: false, code: "INVALID_RPC_RESULT", message: "Réponse financière inexploitable." };
  return { ok: true, paymentId: result.payment_id, transactionNumber: result.transaction_number };
}
