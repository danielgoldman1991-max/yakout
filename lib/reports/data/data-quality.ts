import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInteger } from "../formatters";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getDataQualityOverview(_filters: ReportFilters): Promise<ReportData> {
  void _filters;
  const supabase = await getClient();

  const [leadsRes, ownersRes, apartmentsRes, reservationsRes, paymentsRes, allocationsRes, expensesRes, documentsRes] = await Promise.all([
    supabase.from("leads").select("id, client_id, owner_id, status, converted_at"),
    supabase.from("owners").select("id, full_name, status, company_id"),
    supabase.from("apartments").select("id, internal_name, owner_id, company_id, is_published"),
    supabase.from("reservations").select("id, apartment_id, client_id, total_amount, deposit_amount, remaining_amount, payment_status, currency, reservation_status, company_id"),
    supabase.from("payments").select("id, amount, currency, status, direction, category, company_id"),
    supabase.from("payment_allocations").select("payment_id,reservation_id,apartment_id,client_id,owner_id,trip_id,package_id,amount,company_id"),
    supabase.from("expenses").select("id, apartment_id, vehicle_id, trip_id, amount, company_id"),
    supabase.from("documents").select("id, related_entity_type, related_entity_id, company_id"),
  ]);
  assertSupabaseResults("Qualité des données", [leadsRes, ownersRes, apartmentsRes, reservationsRes, paymentsRes, allocationsRes, expensesRes, documentsRes]);

  const leads = leadsRes.data ?? [];
  const owners = ownersRes.data ?? [];
  const apartments = apartmentsRes.data ?? [];
  const reservations = reservationsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const allocations = allocationsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const documents = documentsRes.data ?? [];

  const findings: { check: string; count: number; severity: "high" | "medium" | "low" }[] = [];

  const leadsConvertedNoOwner = leads.filter((l) => l.converted_at && !l.owner_id).length;
  if (leadsConvertedNoOwner > 0) {
    findings.push({ check: "Leads convertis sans propriétaire lié", count: leadsConvertedNoOwner, severity: "medium" });
  }

  const apartmentsNoOwner = apartments.filter((a) => !a.owner_id).length;
  if (apartmentsNoOwner > 0) {
    findings.push({ check: "Appartements sans propriétaire", count: apartmentsNoOwner, severity: "high" });
  }

  const reservationsNoApartment = reservations.filter((r) => !r.apartment_id).length;
  if (reservationsNoApartment > 0) {
    findings.push({ check: "Réservations sans appartement", count: reservationsNoApartment, severity: "high" });
  }

  const reservationsNoClient = reservations.filter((r) => !r.client_id).length;
  if (reservationsNoClient > 0) {
    findings.push({ check: "Réservations sans client", count: reservationsNoClient, severity: "medium" });
  }

  const allocatedPaymentIds = new Set(allocations.map((allocation) => allocation.payment_id));
  const unallocatedPayments = payments.filter((payment) => !allocatedPaymentIds.has(payment.id)).length;
  if (unallocatedPayments > 0) {
    findings.push({ check: "Transactions sans allocation", count: unallocatedPayments, severity: "high" });
  }

  const transactionsWithoutEntity = allocations.filter((allocation) => !allocation.reservation_id && !allocation.apartment_id && !allocation.client_id && !allocation.owner_id && !allocation.trip_id && !allocation.package_id).length;
  if (transactionsWithoutEntity > 0) findings.push({ check: "Allocations sans entité métier", count: transactionsWithoutEntity, severity: "high" });

  const canonicalStatuses = new Set(["pending", "paid", "failed", "cancelled", "refunded", "partially_refunded", "reversed"]);
  const unknownStatuses = payments.filter((payment) => !canonicalStatuses.has(String(payment.status))).length;
  if (unknownStatuses > 0) findings.push({ check: "Statuts financiers inconnus", count: unknownStatuses, severity: "high" });

  const paymentById = new Map(payments.map((payment) => [payment.id, payment]));
  let mixedCurrencies = 0;
  let snapshotDifferences = 0;
  for (const reservation of reservations) {
    const linked = allocations.filter((allocation) => allocation.reservation_id === reservation.id).flatMap((allocation) => {
      const payment = paymentById.get(allocation.payment_id);
      return payment ? [{ allocation, payment }] : [];
    });
    const currencies = new Set(linked.map(({ payment }) => String(payment.currency).toUpperCase()));
    if (currencies.size > 1 || (currencies.size === 1 && !currencies.has(String(reservation.currency || "MAD").toUpperCase()))) mixedCurrencies += 1;
    const net = linked.filter(({ payment }) => payment.status === "paid").reduce((sum, { allocation, payment }) => sum + (payment.direction === "inflow" ? Number(allocation.amount) : -Number(allocation.amount)), 0);
    const expectedBalance = Math.max(Number(reservation.total_amount) - net, 0);
    if (Number(reservation.deposit_amount ?? 0) !== net || Number(reservation.remaining_amount ?? 0) !== expectedBalance) snapshotDifferences += 1;
  }
  if (mixedCurrencies > 0) findings.push({ check: "Devises incompatibles sur les allocations", count: mixedCurrencies, severity: "high" });
  if (snapshotDifferences > 0) findings.push({ check: "Snapshots financiers divergents", count: snapshotDifferences, severity: "medium" });

  const expensesOrphaned = expenses.filter((e) => !e.apartment_id && !e.vehicle_id && !e.trip_id).length;
  if (expensesOrphaned > 0) {
    findings.push({ check: "Dépenses sans entité liée", count: expensesOrphaned, severity: "medium" });
  }

  const documentsOrphaned = documents.filter((d) => !d.related_entity_type || !d.related_entity_id).length;
  if (documentsOrphaned > 0) {
    findings.push({ check: "Documents orphelins", count: documentsOrphaned, severity: "low" });
  }

  const ownersNoCompany = owners.filter((o) => !o.company_id).length;
  if (ownersNoCompany > 0) {
    findings.push({ check: "Propriétaires sans entreprise", count: ownersNoCompany, severity: "high" });
  }

  const apartmentsNoCompany = apartments.filter((a) => !a.company_id).length;
  if (apartmentsNoCompany > 0) {
    findings.push({ check: "Appartements sans entreprise", count: apartmentsNoCompany, severity: "high" });
  }

  const reservationsNoCompany = reservations.filter((r) => !r.company_id).length;
  if (reservationsNoCompany > 0) {
    findings.push({ check: "Réservations sans entreprise", count: reservationsNoCompany, severity: "high" });
  }

  const totalIssues = findings.reduce((s, f) => s + f.count, 0);
  const highIssues = findings.filter((f) => f.severity === "high").reduce((s, f) => s + f.count, 0);

  const tables: ReportTable[] = [{
    title: "Anomalies de qualité des données",
    columns: [
      { key: "check", label: "Contrôle" },
      { key: "count", label: "Nombre", align: "right", format: "integer" },
      { key: "severity", label: "Sévérité" },
    ],
    rows: findings.map((f) => ({
      check: f.check,
      count: f.count,
      severity: f.severity === "high" ? "🔴 Élevée" : f.severity === "medium" ? "🟡 Moyenne" : "🟢 Faible",
    })),
    totals: { count: totalIssues },
  }];

  const noIssues = findings.length === 0;

  return {
    metadata: {
      reportId: "data-quality-overview", title: "Qualité des données",
      generatedAt: new Date().toISOString(), status: noIssues ? "ready" : "partial",
    },
    kpis: [
      { label: "Anomalies totales", value: formatInteger(totalIssues), trend: totalIssues > 0 ? { value: `${highIssues} critiques`, positive: false } : undefined },
      { label: "Critiques", value: formatInteger(highIssues) },
      { label: "Leads", value: formatInteger(leads.length) },
      { label: "Propriétaires", value: formatInteger(owners.length) },
      { label: "Appartements", value: formatInteger(apartments.length) },
      { label: "Réservations", value: formatInteger(reservations.length) },
      { label: "Paiements", value: formatInteger(payments.length) },
      { label: "Allocations", value: formatInteger(allocations.length) },
    ],
    tables: noIssues ? [{
      title: "Qualité des données",
      columns: [{ key: "status", label: "Statut" }],
      rows: [{ status: "Aucune anomalie détectée ✓" }],
    }] : tables,
    totals: { issues: totalIssues },
    warnings: noIssues ? [] : [`${formatInteger(totalIssues)} anomalie(s) détectée(s). ${formatInteger(highIssues)} critique(s).`],
    sourceCounts: { leads: leads.length, owners: owners.length, apartments: apartments.length, reservations: reservations.length, payments: payments.length, allocations: allocations.length, expenseDocuments: expenses.length, documents: documents.length },
  };
}
