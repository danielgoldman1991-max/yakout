import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ReservationCalendarCockpit } from "@/components/dashboard/reservation-calendar-cockpit";
import { getReservationCalendarData, parseDateOnly } from "@/lib/calendar/reservation-calendar";

export const dynamic = "force-dynamic";

type CalendarView = "planning" | "month" | "agenda" | "occupancy";
type Params = { view?: string; from?: string; to?: string; apartmentId?: string; status?: string; payment?: string; search?: string };
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function shift(value:string,days:number){const d=new Date(parseDateOnly(value)+days*86_400_000);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const today = dateKey(new Date());
  const view: CalendarView = ["planning","month","agenda","occupancy"].includes(params.view ?? "") ? params.view as CalendarView : "planning";
  const from = params.from && isoPattern.test(params.from) ? params.from : today;
  const requestedTo = params.to && isoPattern.test(params.to) ? params.to : shift(from, view === "agenda" ? 7 : view === "month" ? 35 : 14);
  const to = requestedTo > from && (parseDateOnly(requestedTo)-parseDateOnly(from))/86_400_000 <= 366 ? requestedTo : shift(from,14);
  const result = await getReservationCalendarData({ from, to, apartmentId: params.apartmentId, status: params.status, paymentStatus: params.payment, search: params.search });

  if (!result.ok) return <div className="space-y-5"><div><p className="text-sm text-muted-foreground">Réservations / Pilotage opérationnel</p><h1 className="mt-1 font-display text-3xl font-semibold">Calendrier des séjours</h1></div><div role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-8 text-center"><AlertTriangle className="mx-auto size-10 text-destructive"/><h2 className="mt-4 text-xl font-semibold">{result.error.message}</h2><p className="mt-2 text-sm text-muted-foreground">La disponibilité est inconnue tant que les données ne sont pas chargées. Aucun appartement n’est déclaré disponible par défaut.</p><Link href={`/dashboard/reservations/calendar?view=${view}&from=${from}&to=${to}`} className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-gold px-5 font-semibold text-primary-foreground">Réessayer</Link></div></div>;

  return <ReservationCalendarCockpit view={view} from={from} to={to} today={today} reservations={result.reservations} apartments={result.apartments} blocks={result.blocks} warnings={result.warnings} loadedAt={result.loadedAt} search={params.search}/>;
}
