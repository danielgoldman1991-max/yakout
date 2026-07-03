import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Banknote, CheckCircle2, FileText, ImagePlus, PenLine, Plus, Receipt, Wrench } from "lucide-react";
import { updateApartmentAction, deleteApartmentAction } from "@/lib/data/actions";
import { getDashboardApartmentById, getOwnersForSelect } from "@/lib/data";
import { getOwnerById } from "@/lib/data/owners";
import {
  apartmentCover,
  canPublishApartment,
  getApartmentDocuments,
  getApartmentExpenses,
  getApartmentImages,
  getApartmentMaintenanceTasks,
  getApartmentPayments,
  getApartmentReservations,
} from "@/lib/data/apartments";
import { ApartmentForm } from "@/components/dashboard/apartment-form";
import { ApartmentPublicationChecklist } from "@/components/dashboard/apartment-publication-checklist";
import { ApartmentStatusBadges } from "@/components/dashboard/apartment-status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fallbackImages } from "@/lib/images";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default async function ApartmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const apartment = await getDashboardApartmentById(id);
  if (!apartment) notFound();

  const [owners, owner, images, documents, reservations, payments, expenses, maintenanceTasks] = await Promise.all([
    getOwnersForSelect(),
    apartment.owner_id ? getOwnerById(apartment.owner_id) : Promise.resolve(null),
    getApartmentImages(id),
    getApartmentDocuments(id),
    getApartmentReservations(id),
    getApartmentPayments(id),
    getApartmentExpenses(id),
    getApartmentMaintenanceTasks(id),
  ]);

  const cover = apartmentCover(apartment, images);
  const accommodationPayments = payments.filter((payment) => (payment.payment_type ?? (payment.activity_type === "apartment" ? "accommodation" : "other")) === "accommodation");
  const revenue = accommodationPayments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const deposits = accommodationPayments.filter((payment) => payment.payment_part === "deposit" && payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingRevenue = accommodationPayments.filter((payment) => ["pending", "partial"].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = accommodationPayments.filter((payment) => payment.status === "paid" && payment.paid_at?.startsWith(currentMonth)).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const expensesTotal = expenses.filter((expense) => (expense.expense_status ?? "paid") === "paid").reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const commission = revenue * Number(apartment.commission_rate ?? 0) / 100;
  const operationalNet = revenue - expensesTotal;
  const ownerNet = revenue - commission - expensesTotal;
  const publish = canPublishApartment(apartment, images);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-sm border border-border bg-card">
        <div className="relative min-h-64">
          <Image src={cover.url || fallbackImages.apartment.url} alt={cover.alt || apartment.public_name} fill sizes="100vw" className="object-cover opacity-65" unoptimized={Boolean(cover.url)} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-sm text-muted-foreground">Dashboard / Appartements / {apartment.internal_name}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{apartment.public_name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{apartment.district} · {apartment.capacity} voyageurs · {formatCurrency(apartment.price_per_night ?? apartment.price_from)} / nuit</p>
              </div>
              <ApartmentStatusBadges managementStatus={apartment.management_status} publicStatus={apartment.public_status} contractStatus={apartment.contract_status} />
            </div>
          </div>
        </div>
      </div>

      {query?.saved === "1" && (
        <div className="flex items-center gap-3 rounded-sm border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Appartement enregistre avec succes.</span>
        </div>
      )}
      {query?.error && <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{query.error}</div>}

      <div className="flex flex-wrap gap-2">
        <Link href="#modifier"><Button variant="secondary"><PenLine className="h-4 w-4" /> Modifier</Button></Link>
        {apartment.public_status === "published" && <Link href={`/apartments/${apartment.slug}`} target="_blank"><Button variant="secondary">Voir sur le site</Button></Link>}
        <Link href="#modifier"><Button variant="secondary"><ImagePlus className="h-4 w-4" /> Ajouter photo</Button></Link>
        <Link href={`/dashboard/documents/new?apartmentId=${id}`}><Button variant="secondary"><FileText className="h-4 w-4" /> Ajouter document</Button></Link>
        <Link href={`/dashboard/payments/new?type=accommodation&apartmentId=${id}`}><Button><Banknote className="h-4 w-4" /> Ajouter recette hebergement</Button></Link>
        <Link href={`/dashboard/expenses/new?apartmentId=${id}`}><Button variant="secondary"><Receipt className="h-4 w-4" /> Ajouter depense</Button></Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard title="Resume du bien" items={[
            ["Type", apartment.property_type ?? "Appartement"],
            ["Capacite", `${apartment.capacity} voyageurs`],
            ["Chambres", String(apartment.bedrooms ?? 0)],
            ["Salles de bain", String(apartment.bathrooms ?? 0)],
            ["Prix/nuit", formatCurrency(apartment.price_per_night ?? apartment.price_from)],
            ["Minimum nuits", String(apartment.minimum_nights ?? 1)],
            ["Caution", formatCurrency(apartment.deposit_amount)],
            ["Menage", formatCurrency(apartment.cleaning_fee)],
          ]} />
          <Card>
            <CardHeader><CardTitle>Proprietaire</CardTitle></CardHeader>
            <CardContent>
              {owner ? (
                <div className="space-y-2 text-sm">
                  <Link href={`/dashboard/owners/${owner.id}`} className="font-medium text-gold hover:underline">{owner.full_name}</Link>
                  <p className="text-muted-foreground">{owner.phone || "Telephone non renseigne"}</p>
                  <p className="text-muted-foreground">{owner.email || "Email non renseigne"}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Aucun proprietaire rattache.</p>}
            </CardContent>
          </Card>
        </div>
        <ApartmentPublicationChecklist apartment={apartment} images={images} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <RelationCard title={`Documents (${documents.length})`} empty="Aucun document lie." href={`/dashboard/documents/new?apartmentId=${id}`} action="Ajouter document">
          {documents.slice(0, 5).map((doc) => <RelationLine key={doc.id} title={doc.title} meta={doc.type} href={`/dashboard/documents/${doc.id}`} />)}
        </RelationCard>
        <RelationCard title={`Reservations (${reservations.length})`} empty="Aucune reservation liee.">
          {reservations.slice(0, 5).map((reservation) => <RelationLine key={reservation.id} title={reservation.client_name ?? "Reservation"} meta={`${formatDate(reservation.check_in)} - ${formatDate(reservation.check_out)}`} href={`/dashboard/reservations/${reservation.id}`} />)}
        </RelationCard>
        <RelationCard title={`Maintenance (${maintenanceTasks.length})`} empty="Aucune tache maintenance.">
          {maintenanceTasks.slice(0, 5).map((task) => <RelationLine key={task.id} title={task.title} meta={`${task.status} · ${task.priority}`} />)}
        </RelationCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Finances</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FinanceRow label="Recettes encaissees" value={formatCurrency(revenue)} />
            <FinanceRow label="Recettes en attente" value={formatCurrency(pendingRevenue)} />
            <FinanceRow label="Depenses payees" value={formatCurrency(expensesTotal)} />
            <FinanceRow label="Commission Yakout" value={formatCurrency(commission)} />
            <FinanceRow label="Net operationnel" value={formatCurrency(operationalNet)} />
            <FinanceRow label="Net proprietaire estime" value={formatCurrency(ownerNet)} bold />
            <p className="pt-2 text-xs text-muted-foreground">Calcul provisoire selon depenses enregistrees.</p>
          </CardContent>
        </Card>
        <RelationCard title={`Depenses (${expenses.length})`} empty="Aucune depense liee." href={`/dashboard/expenses/new?apartmentId=${id}`} action="Ajouter depense">
          {expenses.slice(0, 5).map((expense) => <RelationLine key={expense.id} title={expense.title ?? expense.category} meta={`${expense.category} · ${formatCurrency(expense.amount)}`} href={`/dashboard/expenses/${expense.id}`} />)}
        </RelationCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            Recettes d&apos;hebergement
            <Link href={`/dashboard/payments/new?type=accommodation&apartmentId=${id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Ajouter recette hebergement</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniKpi label="Recettes encaissees" value={formatCurrency(revenue)} />
            <MiniKpi label="Acomptes recus" value={formatCurrency(deposits)} />
            <MiniKpi label="En attente" value={formatCurrency(pendingRevenue)} />
            <MiniKpi label="Recettes du mois" value={formatCurrency(monthRevenue)} />
            <MiniKpi label="Net apres depenses" value={formatCurrency(operationalNet)} />
          </div>
          {accommodationPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune recette d&apos;hebergement liee a cet appartement.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Periode</th>
                    <th className="px-3 py-2 font-medium">Paiement</th>
                    <th className="px-3 py-2 font-medium">Montant</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accommodationPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(payment.paid_at)}</td>
                      <td className="px-3 py-2 font-medium">{payment.client_name ?? "Client non renseigne"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{sourceLabel(payment.source)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{payment.stay_check_in || payment.stay_check_out ? `${formatDate(payment.stay_check_in)} - ${formatDate(payment.stay_check_out)}` : "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{paymentPartLabel(payment.payment_part)}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-3 py-2"><Badge tone={payment.status === "paid" ? "success" : payment.status === "partial" ? "info" : "warning"}>{paymentStatusLabel(payment.status)}</Badge></td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/payments/${payment.id}`} className="text-xs text-gold hover:underline">Voir paiement</Link>
                          {payment.reservation_id && <Link href={`/dashboard/reservations/${payment.reservation_id}`} className="text-xs text-gold hover:underline">Reservation</Link>}
                          <Link href={`/dashboard/documents/new?type=payment_receipt&paymentId=${payment.id}&apartmentId=${id}${payment.client_id ? `&clientId=${payment.client_id}` : ""}`} className="text-xs text-gold hover:underline">Ajouter recu</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InfoCard title="Informations internes" items={[
        ["Adresse privee", apartment.address_private ?? "Non renseignee"],
        ["Acces", apartment.access_instructions ?? "Non renseigne"],
        ["Menage", apartment.cleaning_instructions ?? "Non renseigne"],
        ["Wi-Fi", apartment.wifi_name ? `${apartment.wifi_name} / ${apartment.wifi_password ?? ""}` : "Non renseigne"],
        ["Notes", apartment.internal_notes ?? "Non renseigne"],
      ]} />

      <div id="modifier" className="scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-gold" />
          <h2 className="text-xl font-semibold">Modifier la fiche CMS</h2>
          {!publish.ok && <Badge tone="warning">Publication incomplete</Badge>}
        </div>
        <ApartmentForm apartment={apartment} images={images} owners={owners} action={updateApartmentAction.bind(null, id)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Zone sensible</CardTitle></CardHeader>
        <CardContent>
          <form action={deleteApartmentAction.bind(null, id)}>
            <Button type="submit" variant="danger">Supprimer cet appartement</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-border/50 pb-2 text-sm last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RelationCard({ title, empty, href, action, children }: { title: string; empty: string; href?: string; action?: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          {title}
          {href && <Link href={href} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> {action}</Link>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{hasChildren ? children : <p className="text-sm text-muted-foreground">{empty}</p>}</CardContent>
    </Card>
  );
}

function RelationLine({ title, meta, href }: { title: string; meta?: string; href?: string }) {
  const content = (
    <div className="rounded-sm border border-border/60 p-3 text-sm transition hover:border-border hover:bg-surface/40">
      <p className="font-medium">{title}</p>
      {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function FinanceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold text-gold" : "font-medium"}>{value}</span>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-surface/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function sourceLabel(source?: string | null) {
  const labels: Record<string, string> = { website: "Site Yakout", whatsapp: "WhatsApp", airbnb: "Airbnb", booking: "Booking", direct: "Direct", partner: "Partenaire", other: "Autre" };
  return source ? labels[source] ?? source : "-";
}

function paymentPartLabel(part?: string | null) {
  const labels: Record<string, string> = { deposit: "Acompte", balance: "Solde", full: "Paiement complet", adjustment: "Ajustement" };
  return part ? labels[part] ?? part : "Non precise";
}

function paymentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = { pending: "En attente", partial: "Partiel", paid: "Paye", failed: "Echec", refunded: "Rembourse", cancelled: "Annule" };
  return status ? labels[status] ?? status : "Non precise";
}
