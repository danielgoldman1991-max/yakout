import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayments, getReservationById, getReservationEvents } from "@/lib/data";
import { getReservationItems } from "@/lib/data/reservations";
import { changeReservationStatusAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants/reservations";
import { CancelReservationForm } from "@/components/dashboard/cancel-reservation-form";
import { DeleteReservationForm } from "@/components/dashboard/delete-reservation-form";

type BadgeTone = "default" | "gold" | "ruby" | "muted" | "success" | "warning" | "info";
const STATUS_TONES: Record<string, BadgeTone> = {
  draft: "muted", option: "warning", confirmed: "success",
  checked_in: "info", checked_out: "muted", cancelled: "ruby", no_show: "ruby", expired: "muted",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "muted"}>{RESERVATION_STATUS_LABELS[status] ?? status}</Badge>;
}

function Metric({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent><p className="text-xl font-semibold">{value}</p>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</CardContent></Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{String(value)}</span>
    </div>
  );
}

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getReservationById(id);
  if (!reservation) notFound();

  const [payments, events, items] = await Promise.all([
    getPayments().then((all) => all.filter((p) => p.reservation_id === id)),
    getReservationEvents(id),
    getReservationItems(id),
  ]);

  const paidTotal = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const remaining = Math.max(0, Number(reservation.total_amount ?? 0) - paidTotal);

  const canCheckIn = reservation.status === "confirmed";
  const canCheckOut = reservation.status === "checked_in";
  const canCancel = ["draft", "option", "confirmed"].includes(reservation.status);

  const eventTypeLabels: Record<string, string> = {
    created: "Creation", updated: "Modification", status_changed: "Changement de statut",
    confirmed: "Confirmation", checked_in: "Arrivee", checked_out: "Depart",
    cancelled: "Annulation", payment_added: "Paiement ajoute",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Reservations / {reservation.reservation_number ?? reservation.id.slice(0, 8)}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-semibold">{reservation.reservation_number ?? reservation.id.slice(0, 8)}</h1>
            <StatusBadge status={reservation.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {reservation.client_id ?? "Sans client"} · {formatDate(reservation.check_in)} → {formatDate(reservation.check_out)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/payments/new?type=accommodation&reservationId=${reservation.id}&apartmentId=${reservation.apartment_id ?? ""}`}>
            <Button variant="secondary">Ajouter paiement</Button>
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Total sejour" value={formatCurrency(reservation.total_amount)} subtitle={reservation.currency} />
        <Metric title="Encaisse" value={formatCurrency(paidTotal)} subtitle={`${payments.length} paiement${payments.length > 1 ? "s" : ""}`} />
        <Metric title="Reste a payer" value={formatCurrency(remaining)} subtitle={remaining <= 0 ? "Solde" : "En attente"} />
        <Metric title="Nuits / Voyageurs" value={`${reservation.nights} nuits`} subtitle={`${reservation.total_guests ?? reservation.people_count} voyageur${(reservation.total_guests ?? reservation.people_count) > 1 ? "s" : ""}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Guest & Stay Info */}
        <Section title="Voyageur">
          <div className="space-y-2">
            <InfoRow label="Voyageurs" value={String(reservation.total_guests ?? reservation.people_count ?? 1)} />
            <InfoRow label="Client" value={reservation.client_id ?? "Non lie"} />
            <InfoRow label="Client lie" value={reservation.client_id ? "Oui" : "Non"} />
            <InfoRow label="Lead d&apos;origine" value={reservation.lead_id ? "Lie" : "Aucun"} />
            {reservation.special_requests && (
              <div className="pt-2"><p className="text-xs text-muted-foreground">Demandes particulieres</p><p className="text-sm">{reservation.special_requests}</p></div>
            )}
          </div>
        </Section>

        <Section title="Sejour">
          <div className="space-y-2">
            <InfoRow label="Arrivee" value={formatDate(reservation.check_in)} />
            <InfoRow label="Depart" value={formatDate(reservation.check_out)} />
            <InfoRow label="Nuits" value={`${reservation.nights} nuit${reservation.nights > 1 ? "s" : ""}`} />
            <InfoRow label="Heure arrivee" value={reservation.arrival_time ?? "—"} />
            <InfoRow label="Heure depart" value={reservation.departure_time ?? "—"} />
            <InfoRow label="Adultes" value={reservation.adults} />
            <InfoRow label="Enfants" value={reservation.children} />
            <InfoRow label="Bebes" value={reservation.infants} />
            <InfoRow label="Appartement" value={reservation.apartment_id ? reservation.apartment_id.slice(0, 8) : "Non assigne"} />
            {reservation.apartment_id && (
              <Link href={`/dashboard/apartments/${reservation.apartment_id}`} className="text-xs text-gold hover:underline">Voir la fiche appartement →</Link>
            )}
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Tarification">
          <div className="space-y-2">
            <InfoRow label="Total" value={formatCurrency(reservation.total_amount)} />
            <InfoRow label="Acompte" value={formatCurrency(reservation.deposit_amount)} />
            <InfoRow label="Solde restant" value={formatCurrency(Math.max(0, reservation.total_amount - reservation.deposit_amount))} />
            <InfoRow label="Statut paiement" value={reservation.payment_status === "paid" ? "Paye" : reservation.payment_status === "partial" ? "Partiel" : reservation.payment_status === "unpaid" ? "Non paye" : reservation.payment_status ?? "—"} />
          </div>
        </Section>

        {/* Status Actions */}
        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            {canCheckIn && (
              <form action={changeReservationStatusAction.bind(null, id)}>
                <input type="hidden" name="status" value="checked_in" />
                <Button type="submit" variant="primary" className="text-sm">Marquer arrivée</Button>
              </form>
            )}
            {canCheckOut && (
              <form action={changeReservationStatusAction.bind(null, id)}>
                <input type="hidden" name="status" value="checked_out" />
                <Button type="submit" variant="primary" className="text-sm">Marquer départ</Button>
              </form>
            )}
            {canCancel && (
              <CancelReservationForm id={id} />
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/reservations/${id}/edit`}>
              <Button variant="secondary" className="text-sm">Modifier</Button>
            </Link>
            {(["draft", "option", "expired", "cancelled"].includes(reservation.status)) && (
              <DeleteReservationForm id={id} />
            )}
          </div>
        </Section>
      </div>

      {/* Payments */}
      <Section title="Paiements lies">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <Link key={payment.id} href={`/dashboard/payments/${payment.id}`}
                className="flex items-center justify-between gap-4 rounded-sm border border-border/60 p-3 text-sm hover:border-gold/40 transition-colors">
                <div>
                  <p className="font-medium">{payment.title ?? "Paiement"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.paid_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <Badge tone={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Reservation items */}
      {items.length > 0 && (
        <Section title="Lignes de reservation">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                <span>{item.label} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                <span className="font-medium">{formatCurrency(item.total_amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Events timeline */}
      {events.length > 0 && (
        <Section title="Historique">
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/30" />
                <div className="min-w-0">
                  <p className="font-medium">{eventTypeLabels[event.event_type] ?? event.event_type}</p>
                  <p className="text-xs text-muted-foreground">{event.description ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground/50">{formatDate(event.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Internal notes */}
      {reservation.internal_notes && (
        <Section title="Notes internes">
          <p className="whitespace-pre-wrap text-sm">{reservation.internal_notes}</p>
        </Section>
      )}

      {/* Cancellation info */}
      {reservation.status === "cancelled" && (
        <Card className="border-ruby/30">
          <CardHeader><CardTitle className="text-sm text-ruby">Reservation annulee</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <InfoRow label="Motif" value={reservation.cancellation_reason ?? "Non renseigne"} />
            <InfoRow label="Date d&apos;annulation" value={reservation.cancelled_at ? formatDate(reservation.cancelled_at) : "—"} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
