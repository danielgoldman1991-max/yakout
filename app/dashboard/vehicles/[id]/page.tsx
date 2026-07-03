import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, FileText, Fuel, Route, Wrench } from "lucide-react";
import { getDocuments, getExpenses, getPayments } from "@/lib/data";
import { getTransportPartners, getTransportTrips, getTransportVehicleById } from "@/lib/data/transport";
import { updateVehicleAction, deleteVehicleAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { VehicleForm } from "@/components/dashboard/vehicle-form";

export default async function VehicleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [vehicle, partners, trips, payments, expenses, documents] = await Promise.all([
    getTransportVehicleById(id),
    getTransportPartners(),
    getTransportTrips(),
    getPayments(),
    getExpenses(),
    getDocuments({ relatedType: "vehicle", relatedId: id }),
  ]);
  if (!vehicle) notFound();

  const relatedTrips = trips.filter((trip) => trip.vehicle_id === id);
  const relatedPayments = payments.filter((payment) => payment.vehicle_id === id || relatedTrips.some((trip) => trip.id === payment.trip_id));
  const relatedExpenses = expenses.filter((expense) => expense.vehicle_id === id || relatedTrips.some((trip) => trip.id === expense.trip_id));
  const revenue = relatedPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const cost = relatedExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const partner = partners.find((item) => item.id === vehicle.partner_id);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border bg-card">
          {vehicle.image_url ? <Image src={vehicle.image_url} alt={vehicle.image_alt_text || vehicle.public_name} fill sizes="320px" className="object-cover" unoptimized /> : null}
        </div>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard / Vehicules / {vehicle.internal_name}</p>
            <h1 className="mt-2 text-3xl font-semibold">{vehicle.public_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={vehicle.availability_status ?? "available"} />
              <StatusBadge status={vehicle.public_status ?? "draft"} />
              <StatusBadge status={vehicle.ownership_type ?? "partner"} />
            </div>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{vehicle.short_description ?? vehicle.public_description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {vehicle.public_status === "published" || vehicle.is_published ? <Link href={`/vehicles/${vehicle.slug}`}><Button variant="secondary">Voir sur site</Button></Link> : null}
            <Link href={`/dashboard/documents/new?type=vehicle&vehicle_id=${id}`}><Button variant="secondary">Ajouter document</Button></Link>
            <Link href={`/dashboard/expenses/new?vehicle_id=${id}`}><Button variant="secondary">Ajouter depense</Button></Link>
            <Link href={`/dashboard/trips/new?vehicle_id=${id}`}><Button variant="secondary">Creer trajet</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Recettes" value={formatCurrency(revenue)} icon={CreditCard} />
        <KpiCard title="Depenses" value={formatCurrency(cost)} icon={Fuel} />
        <KpiCard title="Net vehicule" value={formatCurrency(revenue - cost)} icon={Wrench} />
        <KpiCard title="Trajets lies" value={String(relatedTrips.length)} icon={Route} />
        <KpiCard title="Documents" value={String(documents.length)} icon={FileText} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Modifier le vehicule</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateVehicleAction.bind(null, id)} className="space-y-4">
              <VehicleForm partners={partners} vehicle={vehicle} />
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Partenaire</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {partner ? (
                <>
                  <Link href={`/dashboard/partners/${partner.id}`} className="font-medium hover:text-gold hover:underline">{partner.name}</Link>
                  <p className="text-muted-foreground">{partner.phone ?? "Telephone non renseigne"}</p>
                  <p className="text-muted-foreground">{partner.email ?? "Email non renseigne"}</p>
                  <p className="text-muted-foreground">Commission: {partner.commission_rate ?? partner.commission ?? 0}%</p>
                </>
              ) : <p className="text-muted-foreground">Aucun partenaire lie.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {documents.length === 0 ? <p className="text-muted-foreground">Aucun document.</p> : documents.slice(0, 6).map((doc) => (
                <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="block rounded-sm border border-border p-3 hover:border-gold/40">
                  <span className="font-medium">{doc.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{doc.expiry_date ? formatDate(doc.expiry_date) : doc.type}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Trajets lies</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {relatedTrips.length === 0 ? <p className="text-muted-foreground">Aucun trajet lie.</p> : relatedTrips.slice(0, 5).map((trip) => (
                <Link key={trip.id} href={`/dashboard/trips/${trip.id}`} className="block rounded-sm border border-border p-3 hover:border-gold/40">
                  <span className="font-medium">{trip.title ?? trip.destination}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{trip.trip_date ? formatDate(trip.trip_date) : ""} · {formatCurrency(trip.sold_price - trip.cost_price)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
            <CardContent>
              <form action={deleteVehicleAction.bind(null, id)}>
                <Button type="submit" variant="danger" className="w-full">Supprimer ce vehicule</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
