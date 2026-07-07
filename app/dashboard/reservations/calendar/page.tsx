import Link from "next/link";
import { getReservations } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string; apartmentId?: string }>;
}) {
  const query = await searchParams;
  const now = new Date();
  const currentMonth = query?.month ? parseInt(query.month) : now.getMonth() + 1;
  const currentYear = query?.year ? parseInt(query.year) : now.getFullYear();

  const reservations = await getReservations();

  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const monthReservations = reservations.filter((r) => {
    if (!r.check_in || !r.check_out) return false;
    return r.check_in < monthEnd && r.check_out >= monthStart;
  }).slice(0, 100);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;

  const dayNames = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Reservations / Calendrier</p>
          <h1 className="mt-2 text-3xl font-semibold">Calendrier</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/reservations/calendar?month=${prevMonth}&year=${prevYear}`}>
            <Button variant="secondary" className="h-8 text-xs">← Mois prec.</Button>
          </Link>
          <Link href="/dashboard/reservations/calendar">
            <Button variant="secondary" className="h-8 text-xs">Aujourd&apos;hui</Button>
          </Link>
          <Link href={`/dashboard/reservations/calendar?month=${nextM}&year=${nextY}`}>
            <Button variant="secondary" className="h-8 text-xs">Mois suiv. →</Button>
          </Link>
          <Link href="/dashboard/reservations/new"><Button className="h-8 text-xs">Nouvelle</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{new Date(currentYear, currentMonth - 1).toLocaleString("fr-FR", { month: "long", year: "numeric" })}</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-px bg-border/30 text-center text-xs">
            {dayNames.map((d) => (
              <div key={d} className="bg-background p-2 font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-muted/20" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayReservations = monthReservations.filter((r) => r.check_in <= dateStr && r.check_out > dateStr);
              const today = now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth && now.getDate() === day;
              return (
                <div key={day} className={`min-h-[80px] bg-background p-1 ${today ? "ring-1 ring-gold/40" : ""}`}>
                  <p className={`mb-1 text-[11px] font-medium ${today ? "text-gold" : "text-muted-foreground"}`}>{day}</p>
                  <div className="space-y-0.5">
                    {dayReservations.map((r) => (
                      <Link key={r.id} href={`/dashboard/reservations/${r.id}`}
                        className={`block truncate rounded-[2px] px-1 py-[1px] text-[10px] leading-tight ${
                          r.status === "confirmed" ? "bg-emerald-400/15 text-emerald-100" :
                          r.status === "option" ? "bg-amber-400/15 text-amber-100" :
                          r.status === "checked_in" ? "bg-sky-400/15 text-sky-100" :
                          r.status === "cancelled" ? "bg-ruby/15 text-ruby-light line-through" :
                          "bg-muted/50 text-muted-foreground"
                        }`}>
                        {r.reservation_number}
                      </Link>
                    ))}
                  </div>
                  <Link href={`/dashboard/reservations/new?checkIn=${dateStr}`} className="mt-1 block text-center text-[10px] text-muted-foreground/40 hover:text-gold/60">+</Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
