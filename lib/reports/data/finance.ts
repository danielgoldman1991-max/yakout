import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent, formatInteger, formatReportDate } from "../formatters";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";
import { getReservationFinancialSummaries } from "@/lib/data/reservation-financial";
import { normalizePaymentStatus } from "@/lib/finance/reservation-financial-summary";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getFinanceRevenueJournal(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, amount, currency, paid_at, payment_method, activity_type, category, direction, status")
    .gte("paid_at", ps).lte("paid_at", pe)
    .order("paid_at", { ascending: false });

  assertSupabaseResults("Journal des recettes", [{ error: paymentsError }]);
  if (!payments) {
    return {
      metadata: { reportId: "finance-revenue-journal", title: "Journal des recettes", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: ["Impossible de charger les paiements."], sourceCounts: {},
    };
  }

  const confirmedPayments = payments.filter((p) => normalizePaymentStatus(p.status) === "paid" && p.direction === "inflow" && p.category !== "refund");
  const totalRevenue = confirmedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal = payments.filter((p) => p.status === "En attente" || p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  const byMethod: Record<string, number> = {};
  for (const p of confirmedPayments) {
    byMethod[p.payment_method] = (byMethod[p.payment_method] ?? 0) + Number(p.amount);
  }

  const tables: ReportTable[] = [{
    title: "Paiements enregistrés",
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "activity", label: "Activité" },
      { key: "method", label: "Moyen" },
      { key: "amount", label: "Montant", align: "right", format: "currency" },
      { key: "status", label: "Statut" },
    ],
    rows: confirmedPayments.map((p) => ({
      date: formatReportDate(p.paid_at),
      activity: p.activity_type || "-",
      method: p.payment_method,
      amount: Number(p.amount),
      status: "paid",
    })),
    totals: { amount: totalRevenue },
  }];

  if (Object.keys(byMethod).length > 0) {
    tables.push({
      title: "Répartition par moyen de paiement",
      columns: [
        { key: "method", label: "Moyen" },
        { key: "amount", label: "Montant", align: "right", format: "currency" },
        { key: "percent", label: "%", align: "right", format: "percent" },
      ],
      rows: Object.entries(byMethod).map(([method, amount]) => ({
        method,
        amount,
        percent: (amount / totalRevenue) * 100,
      })),
      totals: { amount: totalRevenue },
    });
  }

  return {
    metadata: {
      reportId: "finance-revenue-journal", title: "Journal des recettes",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Recettes encaissées", value: formatCurrency(totalRevenue) },
      { label: "En attente", value: formatCurrency(pendingTotal) },
      { label: "Nombre d’encaissements", value: formatInteger(confirmedPayments.length) },
    ],
    tables,
    totals: { revenue: totalRevenue, pending: pendingTotal },
    warnings: payments.length === 0 ? ["Aucun paiement trouvé sur la période."] : [],
    sourceCounts: { payments: confirmedPayments.length },
  };
}

export async function getFinanceExpenseJournal(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: expenses, error: expensesError } = await supabase
    .from("payments")
    .select("id, amount, currency, paid_at, category, activity_type, direction, status")
    .eq("direction", "outflow")
    .gte("paid_at", ps).lte("paid_at", pe)
    .order("paid_at", { ascending: false });

  assertSupabaseResults("Journal des dépenses", [{ error: expensesError }]);
  if (!expenses) {
    return {
      metadata: { reportId: "finance-expense-journal", title: "Journal des dépenses", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const paidExpenses = expenses.filter((expense) => normalizePaymentStatus(expense.status) === "paid");
  const totalExpenses = paidExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const e of paidExpenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
  }

  const tables: ReportTable[] = [{
    title: "Dépenses enregistrées",
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "category", label: "Catégorie" },
      { key: "activity", label: "Activité" },
      { key: "amount", label: "Montant", align: "right", format: "currency" },
    ],
    rows: paidExpenses.map((e) => ({
      date: formatReportDate(e.paid_at),
      category: e.category,
      activity: e.activity_type || "-",
      amount: Number(e.amount),
    })),
    totals: { amount: totalExpenses },
  }];

  tables.push({
    title: "Dépenses par catégorie",
    columns: [
      { key: "category", label: "Catégorie" },
      { key: "amount", label: "Montant", align: "right", format: "currency" },
      { key: "percent", label: "%", align: "right", format: "percent" },
    ],
    rows: Object.entries(byCategory).map(([cat, amount]) => ({
      category: cat,
      amount,
      percent: (amount / totalExpenses) * 100,
    })),
    totals: { amount: totalExpenses },
  });

  return {
    metadata: {
      reportId: "finance-expense-journal", title: "Journal des dépenses",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Total dépenses", value: formatCurrency(totalExpenses) },
      { label: "Nombre de décaissements", value: formatInteger(paidExpenses.length) },
      { label: "Moyenne par décaissement", value: paidExpenses.length > 0 ? formatCurrency(totalExpenses / paidExpenses.length) : "Non applicable" },
    ],
    tables,
    totals: { expenses: totalExpenses },
    warnings: paidExpenses.length === 0 ? ["Aucun décaissement réel trouvé sur la période. Les documents de dépense non réglés ne sont pas comptés."] : [],
    sourceCounts: { payments: paidExpenses.length },
  };
}

export async function getFinanceAccountsReceivable(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id, check_in, check_out, total_amount, currency, reservation_status, apartment_id")
    .lte("check_in", pe).gte("check_out", ps);

  assertSupabaseResults("Créances clients", [{ error: reservationsError }]);
  if (!reservations) {
    return {
      metadata: { reportId: "finance-accounts-receivable", title: "Créances clients", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const financial = await getReservationFinancialSummaries(reservations.map((r) => ({ id: r.id, totalAmount: r.total_amount, currency: r.currency })));
  const withDebt = reservations.flatMap((r) => {
    const summary = financial.get(r.id);
    return summary?.state === "available" && summary.balanceDue > 0 && r.reservation_status !== "cancelled" ? [{ reservation: r, summary }] : [];
  });
  const unavailableCount = reservations.filter((r) => financial.get(r.id)?.state !== "available").length;
  const totalDebt = withDebt.reduce((s, item) => s + item.summary.balanceDue, 0);
  const totalReserved = reservations.filter((r) => r.reservation_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);

  const tables: ReportTable[] = [{
    title: "Créances par réservation",
    columns: [
      { key: "id", label: "Réservation" },
      { key: "checkIn", label: "Arrivée", format: "date" },
      { key: "checkOut", label: "Départ", format: "date" },
      { key: "totalAmount", label: "Total", align: "right", format: "currency" },
      { key: "depositAmount", label: "Acompte", align: "right", format: "currency" },
      { key: "remainingAmount", label: "Restant dû", align: "right", format: "currency" },
      { key: "paymentStatus", label: "Statut paiement" },
    ],
    rows: withDebt.map(({ reservation: r, summary }) => ({
      id: r.id.slice(0, 8),
      checkIn: formatReportDate(r.check_in),
      checkOut: formatReportDate(r.check_out),
      totalAmount: summary.reservationTotal,
      depositAmount: summary.netPaid,
      remainingAmount: summary.balanceDue,
      paymentStatus: summary.paymentStatus,
    })),
    totals: { totalAmount: totalDebt, depositAmount: 0, remainingAmount: totalDebt },
  }];

  return {
    metadata: {
      reportId: "finance-accounts-receivable", title: "Créances clients",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Créances totales", value: formatCurrency(totalDebt) },
      { label: "Réservations concernées", value: formatInteger(withDebt.length) },
      { label: "Taux d'endettement", value: formatPercent(totalReserved > 0 ? (totalDebt / totalReserved) * 100 : 0) },
    ],
    tables,
    totals: { debt: totalDebt },
    warnings: [
      ...(withDebt.length === 0 ? ["Aucune créance calculable sur la période."] : []),
      ...(unavailableCount > 0 ? [`Synthèse financière indisponible pour ${unavailableCount} réservation(s) ; aucune valeur de remplacement n’a été inventée.`] : []),
    ],
    sourceCounts: { reservations: reservations.length },
  };
}

export async function getFinanceResultByApartment(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const { data: apartments, error: apartmentsError } = await supabase.from("apartments").select("id, internal_name");
  assertSupabaseResults("Résultat par appartement", [{ error: apartmentsError }]);
  if (!apartments) {
    return {
      metadata: { reportId: "finance-result-by-apartment", title: "Résultat par appartement", generatedAt: new Date().toISOString(), status: "error" },
      kpis: [], tables: [], totals: {}, warnings: [], sourceCounts: {},
    };
  }

  const rows: Record<string, unknown>[] = [];
  let totalReserved = 0;
  let totalInflows = 0;
  let totalOutflows = 0;
  let totalRefunds = 0;

  for (const apt of apartments) {
    if (filters.apartment_id && apt.id !== filters.apartment_id) continue;

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("total_amount, reservation_status")
      .eq("apartment_id", apt.id)
      .lte("check_in", pe).gte("check_out", ps);
    assertSupabaseResults("Résultat par appartement - réservations", [{ error: reservationsError }]);

    const reserved = (reservations ?? [])
      .filter((r) => r.reservation_status !== "cancelled")
      .reduce((s, r) => s + Number(r.total_amount), 0);

    const { data: allocations, error: allocationError } = await supabase.from("payment_allocations")
      .select("amount,payments!inner(direction,status,category,paid_at)")
      .eq("apartment_id", apt.id)
      .gte("payments.paid_at", ps).lte("payments.paid_at", pe);
    assertSupabaseResults("Résultat par appartement - transactions", [{ error: allocationError }]);
    const paid = (allocations ?? []).flatMap((allocation) => {
      const payment = Array.isArray(allocation.payments) ? allocation.payments[0] : allocation.payments;
      return payment && normalizePaymentStatus(payment.status) === "paid" ? [{ amount: Number(allocation.amount), ...payment }] : [];
    });
    const inflows = paid.filter((payment) => payment.direction === "inflow" && payment.category !== "refund").reduce((sum, payment) => sum + payment.amount, 0);
    const outflows = paid.filter((payment) => payment.direction === "outflow" && payment.category !== "refund").reduce((sum, payment) => sum + payment.amount, 0);
    const refunds = paid.filter((payment) => payment.category === "refund").reduce((sum, payment) => sum + payment.amount, 0);
    const net = inflows - outflows - refunds;

    rows.push({
      apartment: apt.internal_name || "Sans titre",
      reserved,
      inflows,
      outflows,
      refunds,
      net,
    });

    totalReserved += reserved;
    totalInflows += inflows;
    totalOutflows += outflows;
    totalRefunds += refunds;
  }

  const tables: ReportTable[] = [{
    title: "Résultat financier par appartement",
    columns: [
      { key: "apartment", label: "Appartement" },
      { key: "reserved", label: "Montant réservé", align: "right", format: "currency" },
      { key: "inflows", label: "Encaissements", align: "right", format: "currency" },
      { key: "outflows", label: "Sorties attribuées", align: "right", format: "currency" },
      { key: "refunds", label: "Remboursements", align: "right", format: "currency" },
      { key: "net", label: "Net", align: "right", format: "currency" },
    ],
    rows,
    totals: { reserved: totalReserved, inflows: totalInflows, outflows: totalOutflows, refunds: totalRefunds, net: totalInflows - totalOutflows - totalRefunds },
  }];

  return {
    metadata: {
      reportId: "finance-result-by-apartment", title: "Résultat par appartement",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Montant réservé", value: formatCurrency(totalReserved) },
      { label: "Encaissements", value: formatCurrency(totalInflows) },
      { label: "Sorties attribuées", value: formatCurrency(totalOutflows + totalRefunds) },
      { label: "Flux net", value: formatCurrency(totalInflows - totalOutflows - totalRefunds) },
    ],
    tables,
    totals: { reserved: totalReserved, inflows: totalInflows, outflows: totalOutflows, refunds: totalRefunds, net: totalInflows - totalOutflows - totalRefunds },
    warnings: rows.length === 0 ? ["Aucun appartement trouvé."] : [],
    sourceCounts: { apartments: apartments.length },
  };
}

export async function getFinanceReconciliation(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const ps = filters.period_start ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const pe = filters.period_end ?? new Date().toISOString().slice(0, 10);

  const [paymentsRes, expensesRes, reservationsRes] = await Promise.all([
    supabase.from("payments").select("id, amount, status, direction, category, paid_at, activity_type, reservation_id, trip_id").gte("paid_at", ps).lte("paid_at", pe),
    supabase.from("expenses").select("id, amount, expense_date, category, apartment_id, vehicle_id, trip_id").gte("expense_date", ps).lte("expense_date", pe),
    supabase.from("reservations").select("id, total_amount, reservation_status, check_in, check_out").lte("check_in", pe).gte("check_out", ps),
  ]);
  assertSupabaseResults("Rapprochement financier", [paymentsRes, expensesRes, reservationsRes]);

  const expenses = expensesRes.data ?? [];
  const reservations = (reservationsRes.data ?? []).filter((r) => r.reservation_status !== "cancelled");
  const financial = await getReservationFinancialSummaries(reservations.map((r) => ({ id: r.id, totalAmount: r.total_amount })));
  const availableFinancial = reservations.flatMap((reservation) => {
    const summary = financial.get(reservation.id);
    return summary?.state === "available" ? [{ reservation, summary }] : [];
  });

  const totalPayments = availableFinancial.reduce((s, item) => s + item.summary.netPaid, 0);
  const paidPayments = (paymentsRes.data ?? []).filter((p) => normalizePaymentStatus(p.status) === "paid");
  const totalExpenses = paidPayments.filter((payment) => payment.direction === "outflow").reduce((s, payment) => s + Number(payment.amount), 0);
  const totalReservations = reservations.reduce((s, r) => s + Number(r.total_amount), 0);

  const paymentNoReservation = paidPayments.filter((p) => !p.reservation_id && !p.trip_id).length;
  const reservationNoPayment = availableFinancial.filter((item) => item.summary.paymentCount === 0).length;
  const unavailableCount = reservations.length - availableFinancial.length;

  const anomalies: Record<string, unknown>[] = [];
  if (paymentNoReservation > 0) {
    anomalies.push({ issue: "Paiements sans réservation ni trajet lié", count: paymentNoReservation });
  }
  if (reservationNoPayment > 0) {
    anomalies.push({ issue: "Réservations sans paiement", count: reservationNoPayment });
  }
  if (unavailableCount > 0) {
    anomalies.push({ issue: "Synthèses financières indisponibles", count: unavailableCount });
  }

  const tables: ReportTable[] = [{
    title: "Rapprochement financier",
    columns: [
      { key: "indicator", label: "Indicateur" },
      { key: "value", label: "Montant", align: "right", format: "currency" },
    ],
    rows: [
      { indicator: "Total des réservations (non annulées)", value: totalReservations },
      { indicator: "Total des paiements encaissés", value: totalPayments },
      { indicator: "Total des dépenses", value: totalExpenses },
      { indicator: "Écart réservations - paiements", value: totalReservations - totalPayments },
      { indicator: "Résultat net (paiements - dépenses)", value: totalPayments - totalExpenses },
    ],
  }];

  if (anomalies.length > 0) {
    tables.push({
      title: "Anomalies détectées",
      columns: [
        { key: "issue", label: "Anomalie" },
        { key: "count", label: "Nombre", align: "right", format: "integer" },
      ],
      rows: anomalies,
    });
  }

  return {
    metadata: {
      reportId: "finance-reconciliation", title: "Rapprochement financier",
      generatedAt: new Date().toISOString(), periodStart: ps, periodEnd: pe, status: "ready",
    },
    kpis: [
      { label: "Réservations", value: formatCurrency(totalReservations) },
      { label: "Paiements encaissés", value: formatCurrency(totalPayments) },
      { label: "Dépenses", value: formatCurrency(totalExpenses) },
      { label: "Écart", value: formatCurrency(totalReservations - totalPayments), trend: { value: formatPercent(totalReservations > 0 ? ((totalReservations - totalPayments) / totalReservations) * 100 : 0), positive: (totalReservations - totalPayments) <= 0 } },
    ],
    tables,
    totals: { reservations: totalReservations, payments: totalPayments, expenses: totalExpenses },
    warnings: [
      ...(anomalies.length > 0 ? [`${anomalies.length} anomalie(s) détectée(s). Vérifiez le détail.`] : []),
      ...(expenses.length > 0 ? ["Les documents de dépense sont rapprochés à titre documentaire ; seuls les décaissements de payments alimentent le flux réel."] : []),
    ],
    sourceCounts: { payments: paidPayments.length, expenseDocuments: expenses.length, reservations: reservations.length },
  };
}
