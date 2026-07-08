/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { isValidUuid } from "@/lib/utils/uuid";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { OwnerReport, OwnerPayout, OwnerPayoutItem, OwnerDashboardKPIs, OwnerPropertyPerformance, OwnerFinancialSummary, OwnerReportGeneration } from "@/types/business";

function isDemo() {
  return !hasSupabaseEnv();
}

function demoWarning(entity: string) {
  logger.warn(`[DEMO] ${entity} — Supabase non configure.`);
}

async function getClient() {
  return await createSupabaseServerClient();
}

// ─── Dashboard KPIs ───

export async function getOwnerDashboard(
  ownerId: string,
  periodStart?: string,
  periodEnd?: string,
  apartmentId?: string
): Promise<OwnerDashboardKPIs> {
  const fallback: OwnerDashboardKPIs = {
    propertyCount: 0, availableNights: 0, occupiedNights: 0, occupancyRate: 0,
    accommodationRevenue: 0, collectedRevenue: 0, ownerExpenses: 0, yakoutCommission: 0,
    netOwner: 0, payoutsMade: 0, balanceDue: 0, futureReservations: 0, openIncidents: 0,
  };
  if (!isValidUuid(ownerId)) return fallback;
  if (isDemo()) { demoWarning("getOwnerDashboard"); return fallback; }

  try {
    const supabase = await getClient();
    const ps = periodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const pe = periodEnd ?? new Date().toISOString().slice(0, 10);

    // Properties count & IDs
    const { count: propertyCount } = await supabase.from("apartments").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
    const { data: ownerApts } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
    const aptIds = (ownerApts ?? []).map(a => a.id);

    if (aptIds.length === 0) return fallback;

    // Reservations in period
    let resQuery = supabase.from("reservations").select("id, check_in, check_out, nights, total_amount, reservation_status, people_count, apartment_id").in("apartment_id", aptIds);
    if (apartmentId) resQuery = resQuery.eq("apartment_id", apartmentId);
    const { data: allRes } = await resQuery.order("check_in", { ascending: false });

    if (!allRes) return fallback;

    const reservations = allRes as any[];
    const activeRes = reservations.filter(r => r.reservation_status !== "cancelled" && r.reservation_status !== "refunded");

    // Nuits disponibles (basé sur les logements du propriétaire × jours dans la période)
    const periodDays = Math.max(1, Math.round((new Date(pe).getTime() - new Date(ps).getTime()) / 86400000) + 1);
    const aptCount = propertyCount ?? 0;
    const availableNights = aptCount * periodDays;

    // Nuits occupées dans la période (répartition par nuit)
    let occupiedNights = 0;
    for (const r of activeRes) {
      const cin = new Date(r.check_in);
      const cout = new Date(r.check_out);
      const resStart = cin < new Date(ps) ? new Date(ps) : cin;
      const resEnd = cout > new Date(pe) ? new Date(pe) : cout;
      const nights = Math.max(0, Math.round((resEnd.getTime() - resStart.getTime()) / 86400000));
      occupiedNights += nights;
    }

    const occupancyRate = availableNights > 0 ? (occupiedNights / availableNights) * 100 : 0;

    // Revenus hébergement (réservations actives dans période)
    const accommodationRevenue = activeRes.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

    // Paiements collectés
    let payQuery = supabase.from("payments").select("id, amount, status, paid_at").eq("payment_type", "accommodation").gte("paid_at", ps).lte("paid_at", pe);
    if (apartmentId) {
      const { data: aptRes } = await supabase.from("reservations").select("id").eq("apartment_id", apartmentId);
      const resIds = (aptRes ?? []).map(r => r.id);
      if (resIds.length > 0) payQuery = payQuery.in("reservation_id", resIds);
    }
    const { data: payments } = await payQuery;
    const collectedRevenue = (payments ?? []).filter((p: any) => p.status === "confirmed" || p.status === "completed").reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Dépenses propriétaire
    let expQuery = supabase.from("expenses").select("id, amount, status").eq("owner_id", ownerId);
    if (apartmentId) expQuery = expQuery.eq("apartment_id", apartmentId);
    const { data: expenses } = await expQuery;
    const ownerExpenses = (expenses ?? []).filter((e: any) => e.status !== "cancelled").reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    // Commission Yakout (commission_rate from apartments)
    const commRate = 0.20; // 20% default commission
    const yakoutCommission = accommodationRevenue * commRate;

    // Net propriétaire
    const netOwner = collectedRevenue - ownerExpenses - yakoutCommission;

    // Reversements effectués
    const { data: payouts } = await supabase.from("owner_payouts").select("id, amount, payout_status").eq("owner_id", ownerId);
    const payoutsMade = (payouts ?? []).filter((p: any) => p.payout_status === "paid").reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Solde à reverser
    const balanceDue = Math.max(0, netOwner - payoutsMade);

    // Réservations futures
    const futureReservations = activeRes.filter(r => new Date(r.check_in) > new Date()).length;

    // Incidents ouverts
    const { data: incidents } = await supabase.from("maintenance_tasks").select("id", { count: "exact", head: true }).eq("owner_id", ownerId).in("status", ["open", "in_progress", "waiting_owner"]);
    const openIncidents = (incidents as any)?.length ?? 0;

    return {
      propertyCount: aptCount,
      availableNights,
      occupiedNights,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      accommodationRevenue: Math.round(accommodationRevenue * 100) / 100,
      collectedRevenue: Math.round(collectedRevenue * 100) / 100,
      ownerExpenses: Math.round(ownerExpenses * 100) / 100,
      yakoutCommission: Math.round(yakoutCommission * 100) / 100,
      netOwner: Math.round(netOwner * 100) / 100,
      payoutsMade: Math.round(payoutsMade * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
      futureReservations,
      openIncidents,
    };
  } catch (err) {
    logger.error("getOwnerDashboard failed", err);
    return fallback;
  }
}

// ─── Property Performance ───

export async function getOwnerPropertyPerformance(
  ownerId: string,
  periodStart: string,
  periodEnd: string,
  apartmentId?: string
): Promise<OwnerPropertyPerformance[]> {
  if (!isValidUuid(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerPropertyPerformance"); return []; }

  try {
    const supabase = await getClient();
    const ps = periodStart;
    const pe = periodEnd;
    const periodDays = Math.max(1, Math.round((new Date(pe).getTime() - new Date(ps).getTime()) / 86400000) + 1);

    let aptQuery = supabase.from("apartments").select("id, title, owner_id").eq("owner_id", ownerId);
    if (apartmentId) aptQuery = aptQuery.eq("id", apartmentId);
    const { data: apartments } = await aptQuery;

    if (!apartments || apartments.length === 0) return [];

    const result: OwnerPropertyPerformance[] = [];

    for (const apt of apartments) {
      const { data: res } = await supabase
        .from("reservations")
        .select("id, check_in, check_out, nights, total_amount, reservation_status")
        .eq("apartment_id", apt.id)
        .order("check_in", { ascending: false });

      const active = (res ?? []).filter((r: any) => r.reservation_status !== "cancelled");
      const cancelled = (res ?? []).filter((r: any) => r.reservation_status === "cancelled");

      let occupiedNights = 0;
      for (const r of active) {
        const cin = new Date(r.check_in);
        const cout = new Date(r.check_out);
        const start = cin < new Date(ps) ? new Date(ps) : cin;
        const end = cout > new Date(pe) ? new Date(pe) : cout;
        occupiedNights += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      }

      // Previous period for comparison
      const prevStart = new Date(new Date(ps).getTime() - periodDays * 86400000).toISOString().slice(0, 10);
      const prevEnd = new Date(new Date(pe).getTime() - periodDays * 86400000).toISOString().slice(0, 10);
      const { data: prevRes } = await supabase
        .from("reservations")
        .select("id, check_in, check_out, total_amount, reservation_status")
        .eq("apartment_id", apt.id)
        .gte("check_in", prevStart)
        .lte("check_out", prevEnd);

      const prevActive = (prevRes ?? []).filter((r: any) => r.reservation_status !== "cancelled");
      const prevRevenue = prevActive.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);

      let prevOccupied = 0;
      for (const r of prevActive) {
        const cin = new Date(r.check_in);
        const cout = new Date(r.check_out);
        const start = cin < new Date(prevStart) ? new Date(prevStart) : cin;
        const end = cout > new Date(prevEnd) ? new Date(prevEnd) : cout;
        prevOccupied += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      }

      const availableNights = periodDays;
      const occupancyRate = availableNights > 0 ? (occupiedNights / availableNights) * 100 : 0;
      const revenue = active.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);
      const adr = occupiedNights > 0 ? revenue / occupiedNights : 0;
      const revpar = availableNights > 0 ? revenue / availableNights : 0;
      const avgStay = active.length > 0 ? occupiedNights / active.length : 0;

      result.push({
        apartmentId: apt.id,
        apartmentName: apt.title ?? "Sans titre",
        availableNights,
        blockedNights: 0,
        occupiedNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        revpar: Math.round(revpar * 100) / 100,
        avgStayDays: Math.round(avgStay * 100) / 100,
        reservationCount: active.length,
        cancellationCount: cancelled.length,
        revenue: Math.round(revenue * 100) / 100,
        prevPeriodRevenue: Math.round(prevRevenue * 100) / 100,
        prevPeriodOccupancy: Math.round((prevOccupied / (periodDays || 1)) * 100 * 100) / 100,
      });
    }

    return result;
  } catch (err) {
    logger.error("getOwnerPropertyPerformance failed", err);
    return [];
  }
}

// ─── Financial Summary (by accounting basis) ───

export async function getOwnerFinancialSummary(
  ownerId: string,
  periodStart?: string,
  periodEnd?: string,
  apartmentId?: string,
  basis: "activity" | "cash" = "activity"
): Promise<OwnerFinancialSummary> {
  const fallback: OwnerFinancialSummary = {
    reservedAmount: 0, invoicedAmount: 0, collectedAmount: 0, remainingAmount: 0,
    refundedAmount: 0, expensesAmount: 0, commissionAmount: 0, ownerAmount: 0,
    payoutsMade: 0, balanceDue: 0,
  };
  if (!isValidUuid(ownerId)) return fallback;
  if (isDemo()) { demoWarning("getOwnerFinancialSummary"); return fallback; }

  try {
    const supabase = await getClient();
    const ps = periodStart ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const pe = periodEnd ?? new Date().toISOString().slice(0, 10);

    // Reservations in period
    const { data: ownerApts } = await supabase.from("apartments").select("id").eq("owner_id", ownerId);
    const aptIds = (ownerApts ?? []).map(a => a.id);
    if (aptIds.length === 0) return fallback;

    let resQuery = supabase.from("reservations").select("id, check_in, check_out, total_amount, deposit_amount, remaining_amount, reservation_status").in("apartment_id", aptIds);
    if (apartmentId) resQuery = resQuery.eq("apartment_id", apartmentId);

    if (basis === "activity") {
      resQuery = resQuery.gte("check_in", ps).lte("check_out", pe);
    }

    const { data: reservations } = await resQuery;
    const resActive = (reservations ?? []).filter((r: any) => r.reservation_status !== "cancelled");
    const resCancelled = (reservations ?? []).filter((r: any) => r.reservation_status === "cancelled");

    // reservedAmount = total of active reservations
    const reservedAmount = resActive.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);
    // refundedAmount = total of cancelled reservations
    const refundedAmount = resCancelled.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);

    // Payments
    let payQuery = supabase.from("payments").select("id, amount, status, paid_at, payment_type");
    if (apartmentId) {
      const { data: aptRes } = await supabase.from("reservations").select("id").eq("apartment_id", apartmentId);
      const resIds = (aptRes ?? []).map(r => r.id);
      if (resIds.length > 0) payQuery = payQuery.in("reservation_id", resIds);
    }
    if (basis === "cash") {
      payQuery = payQuery.gte("paid_at", ps).lte("paid_at", pe);
    }
    const { data: payments } = await payQuery;
    const confirmedPayments = (payments ?? []).filter((p: any) => p.status === "confirmed" || p.status === "completed");
    const collectedAmount = confirmedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Commission (20% of reserved)
    const commissionRate = 0.20;
    const commissionAmount = reservedAmount * commissionRate;

    // Owner expenses
    let expQuery = supabase.from("expenses").select("id, amount, status").eq("owner_id", ownerId);
    if (apartmentId) expQuery = expQuery.eq("apartment_id", apartmentId);
    const { data: expenses } = await expQuery;
    const expensesAmount = (expenses ?? []).filter((e: any) => e.status !== "cancelled").reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    // Invoiced = collected (cash basis) or reserved (activity)
    const invoicedAmount = basis === "cash" ? collectedAmount : reservedAmount;
    const remainingAmount = Math.max(0, invoicedAmount - collectedAmount);
    const ownerAmount = invoicedAmount - expensesAmount - commissionAmount;

    // Payouts
    const { data: payouts } = await supabase.from("owner_payouts").select("id, amount, payout_status").eq("owner_id", ownerId);
    const payoutsMade = (payouts ?? []).filter((p: any) => p.payout_status === "paid").reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, ownerAmount - payoutsMade);

    return {
      reservedAmount: Math.round(reservedAmount * 100) / 100,
      invoicedAmount: Math.round(invoicedAmount * 100) / 100,
      collectedAmount: Math.round(collectedAmount * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      refundedAmount: Math.round(refundedAmount * 100) / 100,
      expensesAmount: Math.round(expensesAmount * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      ownerAmount: Math.round(ownerAmount * 100) / 100,
      payoutsMade: Math.round(payoutsMade * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
    };
  } catch (err) {
    logger.error("getOwnerFinancialSummary failed", err);
    return fallback;
  }
}

// ─── Reports ───

export async function getOwnerReports(ownerId: string): Promise<OwnerReport[]> {
  if (!isValidUuid(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerReports"); return []; }
  try {
    const supabase = await getClient();
    const { data, error } = await supabase.from("owner_reports").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
    if (error) { logger.error("getOwnerReports failed", error); return []; }
    return (data ?? []) as OwnerReport[];
  } catch { return []; }
}

export async function getOwnerReportById(id: string): Promise<OwnerReport | null> {
  if (!isValidUuid(id)) return null;
  const supabase = await getClient();
  const { data } = await supabase.from("owner_reports").select("*").eq("id", id).single();
  return data as OwnerReport ?? null;
}

export async function getOwnerReportVersions(ownerId: string, reportType: string, periodStart: string, periodEnd: string): Promise<OwnerReport[]> {
  if (!isValidUuid(ownerId)) return [];
  const supabase = await getClient();
  const { data } = await supabase
    .from("owner_reports")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("report_type", reportType)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .order("version", { ascending: false });
  return (data ?? []) as OwnerReport[];
}

export async function createOwnerReport(input: OwnerReportGeneration): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createOwnerReport"); return { error: "Supabase n'est pas configure." }; }
  try {
    const supabase = await getClient();

    // Check for existing versions
    const { data: existing } = await supabase
      .from("owner_reports")
      .select("version")
      .eq("owner_id", input.ownerId)
      .eq("report_type", input.reportType)
      .eq("period_start", input.periodStart)
      .eq("period_end", input.periodEnd)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existing && existing.length > 0) ? existing[0].version + 1 : 1;

    // Build report label
    const typeLabels: Record<string, string> = {
      monthly_owner_statement: "Relevé mensuel propriétaire",
      property_performance: "Performance du bien",
      reservation_activity: "Activité des réservations",
      financial_ledger: "Recettes et dépenses",
      maintenance_operations: "Exploitation et maintenance",
      owner_payout_statement: "Relevé de reversement",
      forward_forecast: "Prévision 30/60/90 jours",
      annual_owner_summary: "Rapport annuel",
    };

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("owner_reports").insert([{
      owner_id: input.ownerId,
      apartment_id: input.apartmentId ?? null,
      report_type: input.reportType,
      label: `${typeLabels[input.reportType] ?? input.reportType} — ${input.periodStart} → ${input.periodEnd}`,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      accounting_basis: input.accountingBasis,
      currency: input.currency,
      status: "draft",
      version: nextVersion,
      snapshot: {},
    }]).select("id").single();

    if (error) { logger.error("createOwnerReport failed", error); return { error: error.message }; }
    return { id: data.id };
  } catch (err) {
    logger.error("createOwnerReport failed", err);
    return { error: "Erreur lors de la creation du rapport." };
  }
}

export async function finalizeOwnerReport(reportId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isValidUuid(reportId)) return { ok: false, error: "ID invalide." };
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("owner_reports").update({
      status: "finalized",
      finalized_at: new Date().toISOString(),
    }).eq("id", reportId);
    if (error) { logger.error("finalizeOwnerReport failed", error); return { ok: false, error: error.message }; }
    return { ok: true };
  } catch (err) {
    logger.error("finalizeOwnerReport failed", err);
    return { ok: false, error: "Erreur lors de la finalisation." };
  }
}

export async function supersedeOwnerReport(reportId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isValidUuid(reportId)) return { ok: false, error: "ID invalide." };
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("owner_reports").update({ status: "superseded" }).eq("id", reportId);
    if (error) { logger.error("supersedeOwnerReport failed", error); return { ok: false, error: error.message }; }
    return { ok: true };
  } catch { return { ok: false, error: "Erreur lors du remplacement." }; }
}

// ─── Payouts ───

export async function getOwnerPayoutsWithItems(ownerId: string): Promise<(OwnerPayout & { items?: OwnerPayoutItem[] })[]> {
  if (!isValidUuid(ownerId)) return [];
  if (isDemo()) { demoWarning("getOwnerPayoutsWithItems"); return []; }
  try {
    const supabase = await getClient();
    const { data: payouts } = await supabase.from("owner_payouts").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
    if (!payouts) return [];

    const result: (OwnerPayout & { items?: OwnerPayoutItem[] })[] = [];
    for (const payout of payouts) {
      const { data: items } = await supabase.from("owner_payout_items").select("*").eq("payout_id", payout.id);
      result.push({ ...payout, items: (items ?? []) as OwnerPayoutItem[] } as any);
    }
    return result;
  } catch (err) {
    logger.error("getOwnerPayoutsWithItems failed", err);
    return [];
  }
}

export async function createOwnerPayoutWithItems(
  input: Partial<OwnerPayout>,
  items: Omit<OwnerPayoutItem, "id" | "company_id" | "payout_id" | "created_at">[]
): Promise<{ id?: string; error?: string }> {
  if (isDemo()) { demoWarning("createOwnerPayoutWithItems"); return { error: "Supabase n'est pas configure." }; }
  try {
    const admin = createSupabaseAdminClient();
    const { data: payout, error: pe } = await admin.from("owner_payouts").insert([input]).select("id").single();
    if (pe) { logger.error("createOwnerPayout failed", pe); return { error: pe.message }; }

    const payoutItems = items.map(item => ({ ...item, payout_id: payout.id }));
    const { error: ie } = await admin.from("owner_payout_items").insert(payoutItems);
    if (ie) { logger.error("createPayoutItems failed", ie); return { error: ie.message }; }

    return { id: payout.id };
  } catch (err) {
    logger.error("createOwnerPayoutWithItems failed", err);
    return { error: "Erreur lors de la creation du reversement." };
  }
}

export async function updateOwnerPayoutStatus(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  if (!isValidUuid(id)) return { ok: false, error: "ID invalide." };
  try {
    const admin = createSupabaseAdminClient();
    const update: Record<string, any> = { payout_status: status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    const { error } = await admin.from("owner_payouts").update(update).eq("id", id);
    if (error) { logger.error("updateOwnerPayoutStatus failed", error); return { ok: false, error: error.message }; }
    return { ok: true };
  } catch { return { ok: false, error: "Erreur mise a jour statut." }; }
}

