import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayments, getReservationById } from "@/lib/data";
import { updateReservationAction, deleteReservationAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function ReservationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getReservationById(id);
  if (!reservation) notFound();

  const allPayments = await getPayments();
  const payments = allPayments.filter((payment) => payment.reservation_id === id);
  const paidTotal = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingTotal = payments.filter((payment) => ["pending", "partial"].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const remaining = Math.max(0, Number(reservation.total_amount ?? 0) - paidTotal);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Reservations / {reservation.id}</p>
          <h1 className="mt-2 text-3xl font-semibold">Reservation #{reservation.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(reservation.check_in)} - {formatDate(reservation.check_out)} | {formatCurrency(reservation.total_amount)}</p>
        </div>
        <Link href={`/dashboard/payments/new?type=accommodation&reservationId=${reservation.id}${reservation.apartment_id ? `&apartmentId=${reservation.apartment_id}` : ""}`}>
          <Button>Ajouter paiement</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Total sejour" value={formatCurrency(reservation.total_amount)} />
        <Metric title="Encaisse" value={formatCurrency(paidTotal)} />
        <Metric title="En attente" value={formatCurrency(pendingTotal)} />
        <Metric title="Reste a payer" value={formatCurrency(remaining)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier la reservation</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateReservationAction.bind(null, id)} className="space-y-4">
              <input type="hidden" name="client_id" value={reservation.client_id ?? ""} />
              <input type="hidden" name="apartment_id" value={reservation.apartment_id ?? ""} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Arrivee *</label>
                  <Input name="check_in" type="date" defaultValue={reservation.check_in} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Depart *</label>
                  <Input name="check_out" type="date" defaultValue={reservation.check_out} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Personnes</label>
                  <Input name="people_count" type="number" min="1" defaultValue={reservation.people_count || reservation.guests_count || 1} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Total (DH)</label>
                  <Input name="total_amount" type="number" min="0" defaultValue={reservation.total_amount || 0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Acompte (DH)</label>
                  <Input name="deposit_amount" type="number" min="0" defaultValue={reservation.deposit_amount || 0} />
                </div>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paiements lies</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun paiement rattache a cette reservation.</p>
            ) : (
              payments.map((payment) => (
                <Link key={payment.id} href={`/dashboard/payments/${payment.id}`} className="block rounded-sm border border-border/60 p-3 text-sm hover:border-gold/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{payment.title ?? "Paiement reservation"}</p>
                    <Badge tone={payment.status === "paid" ? "success" : payment.status === "partial" ? "info" : "warning"}>{payment.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(payment.paid_at)} · {formatCurrency(payment.amount)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action={deleteReservationAction.bind(null, id)}>
            <Button type="submit" variant="danger" className="w-full sm:w-auto">Supprimer cette reservation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-xl font-semibold">{value}</p></CardContent>
    </Card>
  );
}
