import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocuments, getExpenses, getPayments } from "@/lib/data";
import { getTransportPartnerById, getTransportTrips, getTransportVehicles, getTransfers, getPackages } from "@/lib/data/transport";
import { updatePartnerAction, deletePartnerAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { PartnerForm } from "@/components/dashboard/partner_form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Phone, Mail, MessageCircle, Trash2, Plus, Truck, FileText, DollarSign, MapPin } from "lucide-react";

const LABELS: Record<string, string> = {
  transport_company: "Société transport", vehicle_owner: "Propriétaire véhicule", driver: "Chauffeur",
  guide: "Guide", tour_provider: "Prestataire excursion", restaurant: "Restaurant partenaire",
  activity_provider: "Activité / expérience", cleaning: "Ménage", laundry: "Blanchisserie",
  maintenance: "Maintenance", repair: "Réparation", real_estate_service: "Service immobilier",
  admin_supplier: "Fournisseur administratif", other: "Autre",
};

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [partner, vehicles, trips, expenses, documents, transfers, payments, packages] = await Promise.all([
    getTransportPartnerById(id),
    getTransportVehicles(),
    getTransportTrips(),
    getExpenses(),
    getDocuments({ relatedType: "partner", relatedId: id }),
    getTransfers(),
    getPayments(),
    getPackages(),
  ]);
  if (!partner) notFound();

  const relatedVehicles = vehicles.filter((v) => v.partner_id === id);
  const relatedTrips = trips.filter((t) => t.partner_id === id);
  const relatedTransfers = transfers.filter((t) => t.partner_id === id);
  const relatedExpenses = expenses.filter((e) => e.partner_id === id);
  const relatedDocuments = documents ?? [];
  const relatedPayments = payments.filter((p) => p.partner_id === id);
  const relatedPackages = packages.filter((pack) => pack.package_items?.some((item) => item.partner_id === id));

  const totalExpenses = relatedExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const totalTripsRevenue = relatedTrips.reduce((sum, t) => sum + Number(t.amount ?? t.sold_price ?? 0), 0);
  const totalTripsCost = relatedTrips.reduce((sum, t) => sum + Number(t.cost_amount ?? t.cost_price ?? 0), 0);
  const totalTripsMargin = totalTripsRevenue - totalTripsCost;
  const totalPayments = relatedPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const visiblePhone = partner.phone || partner.whatsapp || "";
  const phoneHref = visiblePhone ? `https://wa.me/${visiblePhone.replace(/[^0-9]/g, "")}` : "#";
  const callHref = visiblePhone ? `tel:${visiblePhone}` : "#";
  const emailHref = partner.email ? `mailto:${partner.email}` : "#";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Partenaires / {partner.name}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{partner.name}</h1>
              <StatusBadge status={partner.status ?? "active"} />
              <Badge tone="muted">{LABELS[partner.partner_type ?? ""] ?? partner.partner_type ?? "-"}</Badge>
              {partner.reliability_score != null && partner.reliability_score > 0 && (
                <Badge tone={partner.reliability_score >= 70 ? "gold" : partner.reliability_score >= 40 ? "muted" : "ruby"}>
                  Score: {partner.reliability_score}/100
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {partner.city && <><MapPin className="mr-1 inline h-3.5 w-3.5" />{partner.city}</>}
              {partner.company_name && <> · {partner.company_name}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visiblePhone && <a href={phoneHref} target="_blank" rel="noopener noreferrer"><Button variant="secondary"><MessageCircle className="h-4 w-4" /> WhatsApp</Button></a>}
            {visiblePhone && <a href={callHref}><Button variant="secondary"><Phone className="h-4 w-4" /> Appeler</Button></a>}
            {partner.email && <a href={emailHref}><Button variant="secondary"><Mail className="h-4 w-4" /> Email</Button></a>}
            <Link href={`/dashboard/vehicles/new?partnerId=${id}`}><Button variant="secondary"><Truck className="h-4 w-4" /> Véhicule</Button></Link>
            <Link href={`/dashboard/documents/new?relatedType=partner&partnerId=${id}`}><Button variant="secondary"><FileText className="h-4 w-4" /> Document</Button></Link>
            <Link href={`/dashboard/expenses/new?partnerId=${id}`}><Button variant="secondary"><DollarSign className="h-4 w-4" /> Dépense</Button></Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {partner.company_name && <div><span className="text-xs text-muted-foreground">Société</span><p>{partner.company_name}</p></div>}
            {partner.contact_person && <div><span className="text-xs text-muted-foreground">Contact principal</span><p>{partner.contact_person}</p></div>}
            {partner.phone && <div><span className="text-xs text-muted-foreground">Téléphone</span><p>{partner.phone}</p></div>}
            {partner.whatsapp && <div><span className="text-xs text-muted-foreground">WhatsApp</span><p>{partner.whatsapp}</p></div>}
            {partner.email && <div><span className="text-xs text-muted-foreground">Email</span><p>{partner.email}</p></div>}
            {partner.city && <div><span className="text-xs text-muted-foreground">Ville</span><p>{partner.city}</p></div>}
            {partner.address && <div className="sm:col-span-2"><span className="text-xs text-muted-foreground">Adresse</span><p>{partner.address}</p></div>}
            {partner.ice && <div><span className="text-xs text-muted-foreground">ICE</span><p>{partner.ice}</p></div>}
            {partner.tax_id && <div><span className="text-xs text-muted-foreground">Identifiant fiscal</span><p>{partner.tax_id}</p></div>}
            {partner.notes && <div className="sm:col-span-2"><span className="text-xs text-muted-foreground">Notes</span><p className="whitespace-pre-wrap">{partner.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Services & zones</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-xs text-muted-foreground">Catégories de service</span><div className="mt-1 flex flex-wrap gap-1">{(partner.service_categories ?? []).length ? (partner.service_categories ?? []).map((s) => <Badge key={s} tone="muted">{s}</Badge>) : <p className="text-muted-foreground">Aucune</p>}</div></div>
            <div><span className="text-xs text-muted-foreground">Zones couvertes</span><div className="mt-1 flex flex-wrap gap-1">{(partner.zones ?? []).length ? (partner.zones ?? []).map((z) => <Badge key={z} tone="muted">{z}</Badge>) : <p className="text-muted-foreground">Aucune</p>}</div></div>
            <div><span className="text-xs text-muted-foreground">Langues</span><p>{(partner.languages ?? []).join(", ") || "-"}</p></div>
            <div><span className="text-xs text-muted-foreground">Canal préféré</span><p>{partner.preferred_contact_channel ?? "whatsapp"}</p></div>
            {partner.commission_rate != null && <div><span className="text-xs text-muted-foreground">Commission Yakout</span><p>{partner.commission_rate}%</p></div>}
            {partner.payment_terms && <div><span className="text-xs text-muted-foreground">Conditions de paiement</span><p>{partner.payment_terms}</p></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Véhicules liés ({relatedVehicles.length})</CardTitle>
          <Link href={`/dashboard/vehicles/new?partnerId=${id}`}><Button><Plus className="h-4 w-4" /> Ajouter un véhicule</Button></Link>
        </CardHeader>
        <CardContent>
          {relatedVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun véhicule lié à ce partenaire.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="px-3 py-2 font-medium">Véhicule</th><th className="px-3 py-2 font-medium">Catégorie</th><th className="px-3 py-2 font-medium">Capacité</th><th className="px-3 py-2 font-medium">Statut</th></tr>
                </thead>
                <tbody>
                  {relatedVehicles.map((v) => (
                    <tr key={v.id} className="border-t border-border/60">
                      <td className="px-3 py-2"><Link href={`/dashboard/vehicles/${v.id}`} className="hover:text-gold hover:underline">{v.public_name}</Link></td>
                      <td className="px-3 py-2">{v.category ?? "-"}</td>
                      <td className="px-3 py-2">{v.capacity} pers.</td>
                      <td className="px-3 py-2"><StatusBadge status={v.public_status ?? "draft"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transferts ({relatedTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun transfert.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Montant</th><th className="px-3 py-2 font-medium">Statut</th></tr>
                  </thead>
                  <tbody>
                    {relatedTransfers.slice(0, 10).map((t) => (
                      <tr key={t.id} className="border-t border-border/60">
                        <td className="px-3 py-2 text-xs">{t.pickup_date ?? "-"}</td>
                        <td className="px-3 py-2">{t.transfer_type}</td>
                        <td className="px-3 py-2">{t.driver_name ?? "-"}</td>
                        <td className="px-3 py-2">{formatCurrency(Number(t.amount ?? 0))}</td>
                        <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trajets ({relatedTrips.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun trajet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Destination</th><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Montant</th><th className="px-3 py-2 font-medium">Marge</th><th className="px-3 py-2 font-medium">Statut</th></tr>
                  </thead>
                  <tbody>
                    {relatedTrips.slice(0, 10).map((t) => {
                      const tripAmount = Number(t.amount ?? t.sold_price ?? 0);
                      const tripCost = Number(t.cost_amount ?? t.cost_price ?? 0);
                      return (
                        <tr key={t.id} className="border-t border-border/60">
                          <td className="px-3 py-2 text-xs">{formatDate(t.trip_date)}</td>
                          <td className="px-3 py-2">{t.destination}</td>
                          <td className="px-3 py-2">{t.client_name ?? "-"}</td>
                          <td className="px-3 py-2">{formatCurrency(tripAmount)}</td>
                          <td className="px-3 py-2">{formatCurrency(tripAmount - tripCost)}</td>
                          <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documents ({relatedDocuments.length})</CardTitle>
            <Link href={`/dashboard/documents/new?relatedType=partner&partnerId=${id}`}><Button><Plus className="h-4 w-4" /> Ajouter</Button></Link>
          </CardHeader>
          <CardContent>
            {relatedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun document.</p>
            ) : (
              <div className="space-y-2">
                {relatedDocuments.slice(0, 10).map((d) => (
                  <Link key={d.id} href={`/dashboard/documents/${d.id}`} className="flex items-center justify-between rounded-sm border border-border/60 px-3 py-2 text-sm hover:bg-accent/10">
                    <span className="font-medium">{d.title}</span>
                    <span className="text-xs text-muted-foreground">{d.type ?? d.document_type}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finance partenaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-sm border border-border/60 p-3"><span className="text-xs text-muted-foreground">Dépenses liées</span><p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p></div>
              <div className="rounded-sm border border-border/60 p-3"><span className="text-xs text-muted-foreground">Chiffre trajets</span><p className="text-lg font-semibold">{formatCurrency(totalTripsRevenue)}</p></div>
              <div className="rounded-sm border border-border/60 p-3"><span className="text-xs text-muted-foreground">Coût trajets</span><p className="text-lg font-semibold">{formatCurrency(totalTripsCost)}</p></div>
              <div className="rounded-sm border border-border/60 p-3"><span className="text-xs text-muted-foreground">Marge estimée</span><p className="text-lg font-semibold">{formatCurrency(totalTripsMargin)}</p></div>
            </div>
            <div><span className="text-xs text-muted-foreground">Paiements reçus / reversements</span><p className="text-lg font-semibold">{formatCurrency(totalPayments)}</p></div>
          </CardContent>
        </Card>
      </div>

      {relatedPackages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Packs ({relatedPackages.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedPackages.map((pack) => (
                <Link key={pack.id} href={`/dashboard/packages/${pack.id}`} className="flex items-center justify-between rounded-sm border border-border/60 px-3 py-2 text-sm hover:bg-accent/10">
                  <span className="font-medium">{pack.title}</span>
                  <span className="text-xs text-muted-foreground">{pack.public_status}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {partner.internal_notes && (
        <Card>
          <CardHeader><CardTitle>Notes internes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{partner.internal_notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Modifier le partenaire</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <PartnerForm action={updatePartnerAction.bind(null, id)} partner={partner} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Zone dangereuse</CardTitle></CardHeader>
        <CardContent>
          <form action={deletePartnerAction.bind(null, id)}>
            <Button type="submit" variant="danger" className="w-full sm:w-auto"><Trash2 className="h-4 w-4" /> Supprimer ce partenaire</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
