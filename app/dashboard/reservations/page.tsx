import Link from "next/link";
import { getReservations } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants/reservations";
import { ReservationFilters } from "@/components/dashboard/reservation-filters";
import { DeleteReservationForm } from "@/components/dashboard/delete-reservation-form";

type BadgeTone = "default" | "gold" | "ruby" | "muted" | "success" | "warning" | "info";
const STATUS_BADGE_TONES: Record<string, BadgeTone> = {
  draft: "muted",
  option: "warning",
  confirmed: "success",
  checked_in: "info",
  checked_out: "muted",
  cancelled: "ruby",
  no_show: "ruby",
  expired: "muted",
};

function StatusBadge({ status }: { status: string }) {
  const label = RESERVATION_STATUS_LABELS[status] ?? status;
  const tone = STATUS_BADGE_TONES[status] ?? "muted";
  return <Badge tone={tone}>{label}</Badge>;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; search?: string }>;
}) {
  const query = await searchParams;
  const reservations = await getReservations({
    status: query?.status || undefined,
    search: query?.search || undefined,
  });

  const todayArrivals = reservations.filter((r) => r.check_in === new Date().toISOString().slice(0, 10) && ["confirmed", "option"].includes(r.status)).length;
  const todayDepartures = reservations.filter((r) => r.check_out === new Date().toISOString().slice(0, 10) && ["checked_in", "confirmed"].includes(r.status)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Reservations</p>
          <h1 className="mt-2 text-3xl font-semibold">Reservations</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/reservations/calendar">
            <Button variant="secondary">Calendrier</Button>
          </Link>
          <Link href="/dashboard/reservations/new">
            <Button>Nouvelle reservation</Button>
          </Link>
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{todayArrivals}</p><p className="text-xs text-muted-foreground">Arrivees ajd</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{todayDepartures}</p><p className="text-xs text-muted-foreground">Departs ajd</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{reservations.filter((r) => r.status === "confirmed").length}</p><p className="text-xs text-muted-foreground">A confirmer</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-semibold">{reservations.filter((r) => r.status === "checked_in").length}</p><p className="text-xs text-muted-foreground">En sejour</p></CardContent></Card>
      </div>

      {/* Filters */}
      <ReservationFilters status={query?.status} search={query?.search} />

      {reservations.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Aucune reservation.</Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reservation</th>
                    <th className="px-4 py-3 font-medium">Voyageur</th>
                    <th className="px-4 py-3 font-medium">Arrivee</th>
                    <th className="px-4 py-3 font-medium">Nuits</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        <a href={`/dashboard/reservations/${r.id}`} className="hover:text-gold hover:underline">{r.reservation_number}</a>
                      </td>
                      <td className="px-4 py-3">{r.guest_name ?? "—"}</td>
                      <td className="px-4 py-3">{formatDate(r.check_in)}</td>
                      <td className="px-4 py-3">{r.nights}</td>
                      <td className="px-4 py-3">{formatCurrency(r.total_amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/reservations/${r.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">Voir</Link>
                          <DeleteReservationForm id={r.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {reservations.map((r) => (
              <Link key={r.id} href={`/dashboard/reservations/${r.id}`} className="block">
                <Card className="hover:border-gold/40 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.reservation_number}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm">{r.guest_name ?? "—"}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(r.check_in)} → {formatDate(r.check_out)}</span>
                      <span>{r.nights} nuits</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{formatCurrency(r.total_amount)}</span>
                      <span className="text-xs text-muted-foreground">{r.source}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
