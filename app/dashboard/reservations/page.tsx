import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { getReservationsList, type ReservationsListFilters } from "@/lib/data/reservations";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RESERVATION_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from "@/lib/constants/reservations";
import { ReservationFilters } from "@/components/dashboard/reservation-filters";
import { ReservationRowActions } from "@/components/dashboard/reservation-row-actions";
import { Eye } from "lucide-react";

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

function PaymentBadge({ paymentStatus }: { paymentStatus: string }) {
  const label = PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus;
  const tone = PAYMENT_STATUS_TONES[paymentStatus] ?? "muted";
  return <Badge tone={tone}>{label}</Badge>;
}

function formatPayment(paid: number, total: number): string {
  if (total <= 0) return "—";
  return formatCurrency(paid);
}

type Props = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function ReservationsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const currentStatus = params.status;
  const currentSearch = params.search;
  const currentPage = Math.max(1, Number(params.page) || 1);

  const filters: ReservationsListFilters = {
    status: currentStatus || undefined,
    search: currentSearch || undefined,
    page: currentPage,
    pageSize: 20,
  };

  const { items: reservations, total, page, pageSize } = await getReservationsList(filters);
  const totalPages = Math.ceil(total / pageSize);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayArrivals = reservations.filter((r) => r.checkIn === todayStr && ["confirmed", "option"].includes(r.status)).length;
  const todayDepartures = reservations.filter((r) => r.checkOut === todayStr && ["checked_in", "confirmed"].includes(r.status)).length;

  function kpiHref(status?: string) {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (currentSearch) p.set("search", currentSearch);
    const q = p.toString();
    return `/dashboard/reservations${q ? "?" + q : ""}`;
  }

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (currentStatus) sp.set("status", currentStatus);
    if (currentSearch) sp.set("search", currentSearch);
    if (p > 1) sp.set("page", String(p));
    return `/dashboard/reservations${sp.toString() ? "?" + sp.toString() : ""}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Réservations</p>
          <h1 className="mt-2 text-3xl font-semibold">Réservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez les séjours, les voyageurs, les paiements et les arrivées.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/reservations/calendar">
            <Button variant="secondary">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendrier
            </Button>
          </Link>
          <Link href="/dashboard/reservations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href={kpiHref("confirmed")} className="block">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">{todayArrivals}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Arrivées aujourd&apos;hui</p>
              {todayArrivals === 0 && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Aucune arrivée</p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href={kpiHref("checked_in")} className="block">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">{todayDepartures}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Départs aujourd&apos;hui</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={kpiHref("confirmed")} className="block">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">
                {reservations.filter((r) => r.status === "confirmed").length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">À confirmer</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={kpiHref("checked_in")} className="block">
          <Card className="hover:border-gold/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">
                {reservations.filter((r) => r.status === "checked_in").length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">En séjour</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Filters */}
      <ReservationFilters status={currentStatus} search={currentSearch} />

      {reservations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {currentStatus || currentSearch
              ? "Aucune réservation ne correspond aux filtres sélectionnés."
              : "Aucune réservation."}
          </p>
          {(currentStatus || currentSearch) && (
            <div className="mt-3 flex justify-center gap-2">
              <Link href="/dashboard/reservations">
                <Button variant="secondary" size="sm">Réinitialiser les filtres</Button>
              </Link>
              <Link href="/dashboard/reservations/new">
                <Button size="sm">Nouvelle réservation</Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Liste des réservations</caption>
                <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-[14%] px-4 py-3 font-medium">Réservation</th>
                    <th scope="col" className="w-[16%] px-4 py-3 font-medium">Voyageur</th>
                    <th scope="col" className="w-[16%] px-4 py-3 font-medium">Appartement</th>
                    <th scope="col" className="w-[17%] px-4 py-3 font-medium">Séjour</th>
                    <th scope="col" className="w-[8%] px-4 py-3 font-medium">Personnes</th>
                    <th scope="col" className="w-[10%] px-4 py-3 font-medium tabular-nums">Total</th>
                    <th scope="col" className="w-[12%] px-4 py-3 font-medium">Paiement</th>
                    <th scope="col" className="w-[10%] px-4 py-3 font-medium">Statut</th>
                    <th scope="col" className="w-[120px] px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/reservations/${r.id}`}
                          className="font-semibold text-foreground hover:text-gold transition-colors"
                        >
                          {r.reservationLabel}
                        </Link>
                        <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                          Créée le {formatDate(r.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{r.guest?.name ?? "Voyageur non renseigné"}</div>
                        {r.guest?.phone && (
                          <div className="text-xs text-muted-foreground mt-0.5">{r.guest.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.apartment ? (
                          <>
                            <div className="font-medium text-foreground">{r.apartment.title}</div>
                            {r.apartment.district && (
                              <div className="text-xs text-muted-foreground mt-0.5">{r.apartment.district}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <div className="font-medium text-foreground">
                          {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.nights} nuit{r.nights > 1 ? "s" : ""}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium">{r.peopleCount}</span>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatCurrency(r.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">{formatPayment(r.depositAmount, r.totalAmount)}</div>
                        <div className="mt-0.5">
                          <PaymentBadge paymentStatus={r.paymentStatus} />
                        </div>
                        {r.remainingAmount > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            Solde : {formatCurrency(r.remainingAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="secondary" size="sm" className="min-h-10 px-3">
                            <Link
                              href={`/dashboard/reservations/${r.id}`}
                              aria-label={`Voir la réservation ${r.reservationLabel}`}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Voir
                            </Link>
                          </Button>
                          <ReservationRowActions
                            id={r.id}
                            label={r.reservationLabel}
                            status={r.status}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="tabular-nums">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}
              </span>
              <div className="flex gap-1">
                {page > 1 && (
                  <Link href={pageHref(page - 1)}>
                    <Button variant="ghost" size="sm">Précédent</Button>
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground/40">…</span>
                      )}
                      <Link href={pageHref(p)}>
                        <Button
                          variant={p === page ? "primary" : "ghost"}
                          size="sm"
                          className="min-w-8"
                        >
                          {p}
                        </Button>
                      </Link>
                    </span>
                  ))}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)}>
                    <Button variant="ghost" size="sm">Suivant</Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {reservations.map((r) => (
              <Card key={r.id} className="hover:border-gold/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/reservations/${r.id}`}
                        className="font-semibold text-foreground hover:text-gold transition-colors"
                      >
                        {r.reservationLabel}
                      </Link>
                      <div className="text-[11px] text-muted-foreground/60">
                        Créée le {formatDate(r.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Voyageur</span>
                      <p className="font-medium truncate">{r.guest?.name ?? "Voyageur non renseigné"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Appartement</span>
                      <p className="font-medium truncate">{r.apartment?.title ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground">Séjour</span>
                      <p className="font-medium tabular-nums">
                        {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                        <span className="text-muted-foreground ml-1">· {r.nights} nuit{r.nights > 1 ? "s" : ""}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total</span>
                      <p className="font-semibold tabular-nums">{formatCurrency(r.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Paiement</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PaymentBadge paymentStatus={r.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild variant="primary" size="sm" className="flex-1 min-h-11">
                      <Link
                        href={`/dashboard/reservations/${r.id}`}
                        aria-label={`Voir la réservation ${r.reservationLabel}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir la réservation
                      </Link>
                    </Button>
                    <ReservationRowActions
                      id={r.id}
                      label={r.reservationLabel}
                      status={r.status}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
