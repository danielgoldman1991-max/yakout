import { BarChart3, CreditCard, Gauge, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeads, getReservations, getTrips, getPayments, getExpenses } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";

export default async function ReportsPage() {
  const [payments, expenses, leads, reservations, trips] = await Promise.all([
    getPayments(), getExpenses(), getLeads(), getReservations(), getTrips(),
  ]);

  const revenue = payments.filter((p) => p.status === "Paye").reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const confirmedReservations = reservations.filter((item) => item.reservation_status === "Confirmee").length;
  const confirmedTrips = trips.filter((item) => item.status === "Confirme").length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard financier</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="CA total du mois" value={formatCurrency(revenue)} icon={TrendingUp} description="Paiements encaisses" />
        <KpiCard title="Depenses du mois" value={formatCurrency(expenseTotal)} icon={CreditCard} />
        <KpiCard title="Marge estimee" value={formatCurrency(revenue - expenseTotal)} icon={Gauge} />
        <KpiCard title="Leads" value={String(leads.length)} icon={BarChart3} description={`${confirmedReservations} reservations, ${confirmedTrips} trajets`} />
      </div>
      <Card>
        <CardHeader><CardTitle>Graphiques V1</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {["CA par mois", "Leads par source", "Repartition CA par activite", "Depenses par categorie"].map((title) => (
            <div key={title} className="flex h-44 items-center justify-center rounded-sm border bg-accent/10 text-sm text-muted-foreground shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-2">
              {title}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
