import Link from "next/link";
import { getApartmentsForSelect, getPayments, getReservationsForSelect } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deletePaymentAction } from "@/lib/data/actions";

const statusTone: Record<string, "warning" | "info" | "success" | "ruby" | "muted"> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  failed: "ruby",
  refunded: "muted",
  cancelled: "muted",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  partial: "Partiel",
  paid: "Paye",
  failed: "Echec",
  refunded: "Rembourse",
  cancelled: "Annule",
};

const paymentTypeLabels: Record<string, string> = {
  accommodation: "Hebergement",
  transport: "Transport",
  service: "Service",
  owner_payout: "Reversement",
  other: "Autre",
};

const sourceLabels: Record<string, string> = {
  website: "Site Yakout",
  whatsapp: "WhatsApp",
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Direct",
  partner: "Partenaire",
  other: "Autre",
};

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

function totalsByCurrency(payments: Awaited<ReturnType<typeof getPayments>>, direction: "inflow" | "outflow") {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== "paid" || (payment.direction ?? "inflow") !== direction) continue;
    const currency = (payment.currency || "MAD").toUpperCase();
    totals.set(currency, (totals.get(currency) ?? 0) + payment.amount);
  }
  return [...totals.entries()].map(([currency, amount]) => new Intl.NumberFormat("fr-MA", { style: "currency", currency }).format(amount)).join(" · ") || "—";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const activeType = params?.type ?? "all";
  const [allPayments, apartments, reservations] = await Promise.all([
    getPayments(),
    getApartmentsForSelect(),
    getReservationsForSelect(),
  ]);

  const payments = activeType === "all" ? allPayments : allPayments.filter((p) => (p.payment_type ?? "other") === activeType);
  const apartmentMap = new Map(apartments.map((a) => [a.id, a.label]));
  const reservationMap = new Map(reservations.map((r) => [r.id, r.label]));

  const pendingCount = allPayments.filter((p) => p.status === "pending" || p.status === "partial").length;

  const { start, end } = getMonthRange();
  const paidThisMonth = allPayments.filter((p) => p.status === "paid" && p.paid_at >= start && p.paid_at <= end).length;

  const filters = [
    ["all", "Tous"],
    ["accommodation", "Hebergement"],
    ["transport", "Transport"],
    ["service", "Services"],
    ["other", "Autres"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Paiements & Trésorerie</p>
          <h1 className="mt-2 text-3xl font-semibold">Paiements & Trésorerie</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Registre central des encaissements, décaissements, ventilations et rapprochements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/payments/new?type=accommodation"><Button variant="secondary">Nouveau paiement hebergement</Button></Link>
          <Link href="/dashboard/payments/new"><Button>Nouveau paiement</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Entrées encaissées" value={totalsByCurrency(allPayments, "inflow")} />
        <Metric title="Sorties décaissées" value={totalsByCurrency(allPayments, "outflow")} />
        <Metric title="En attente / partiel" value={String(pendingCount)} />
        <Metric title="Payes ce mois" value={String(paidThisMonth)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <Link key={value} href={value === "all" ? "/dashboard/payments" : `/dashboard/payments?type=${value}`}>
            <Button variant={activeType === value ? "primary" : "secondary"}>{label}</Button>
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">Aucun paiement enregistre</p>
          <p className="mt-1 text-xs text-muted-foreground">Creez un paiement ou une recette d&apos;hebergement pour commencer le suivi.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Appartement</th>
                  <th className="px-4 py-3 font-medium">Reservation</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.payment_reference ?? p.title ?? "-"}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/payments/${p.id}`} className="hover:text-gold hover:underline">{p.client_name ?? "-"}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{paymentTypeLabels[p.payment_type ?? "other"] ?? p.payment_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.apartment_id ? <Link href={`/dashboard/apartments/${p.apartment_id}`} className="hover:text-gold hover:underline">{apartmentMap.get(p.apartment_id) ?? "Appartement"}</Link> : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.reservation_id ? <Link href={`/dashboard/reservations/${p.reservation_id}`} className="hover:text-gold hover:underline">{reservationMap.get(p.reservation_id) ?? "Reservation"}</Link> : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sourceLabels[p.source ?? ""] ?? p.source ?? "-"}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone[p.status] ?? "default"}>{statusLabels[p.status] ?? p.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/payments/${p.id}`}><Button variant="secondary">Voir</Button></Link>
                        <form action={deletePaymentAction.bind(null, p.id)}><Button type="submit" variant="danger">Supprimer</Button></form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-semibold text-gold">{value}</p></CardContent>
    </Card>
  );
}
