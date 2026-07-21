import Link from "next/link";
import type React from "react";
import { redirect } from "next/navigation";
import { CalendarClock, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { ClientMessageTemplates } from "@/components/dashboard/client-message-templates";
import { ClientRequestBookingPanel } from "@/components/dashboard/client-request-booking-panel";
import {
  createClientFollowupAction,
  createClientNoteAction,
  deleteClientAction,
  markClientFollowupDoneAction,
  postponeClientFollowupAction,
  saveClientReviewAction,
  updateClientAction,
} from "@/lib/data/actions";
import { getClient360Data, isValidUUID } from "@/lib/clients-crm";
import {
  buildMailtoUrl,
  buildWhatsAppUrl,
  clientStatusLabels,
  clientStatuses,
  clientTypeLabels,
  renderTemplate,
  yakoutMessageTemplates,
} from "@/lib/clients-crm-shared";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getApartmentsForSelect } from "@/lib/data";
import { getPackages } from "@/lib/data/transport";

type TimelineItem = {
  date?: string | null;
  title: string;
  detail?: string | null;
  tone?: "gold" | "ruby" | "muted" | "success" | "warning" | "info";
};

function statusTone(status?: string) {
  if (status === "vip") return "gold";
  if (status === "attention") return "ruby";
  if (status === "active" || status === "booked" || status === "review_received") return "success";
  if (status === "to_follow_up" || status === "waiting_reply" || status === "review_requested") return "warning";
  return "muted";
}

function serviceLabel(value?: string) {
  const labels: Record<string, string> = {
    reservation: "Reservation appartement",
    chauffeur: "Chauffeur / transfert",
    proprietaire: "Confier mon bien",
    vehicule: "Vehicule avec chauffeur",
    services: "Services sur mesure",
    general: "Demande generale",
  };
  return value ? labels[value] ?? value : "Demande";
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) redirect("/dashboard/clients?invalidClient=demo");

  const [crmResult, apartmentOptions, packageRows] = await Promise.all([getClient360Data(id), getApartmentsForSelect(), getPackages()]);
  if (!crmResult.ok) redirect(`/dashboard/clients?error=${encodeURIComponent(crmResult.error.code)}`);
  const crm = crmResult.data;

  const { client, leads, reservations, trips, payments, notes, interactions, reviews, followups } = crm;
  const status = client.status ?? "new";
  const firstTemplate = yakoutMessageTemplates[0];
  const firstMessage = renderTemplate(firstTemplate.body, {
    client_name: client.full_name,
    service_type: crm.lastService,
    company_name: "Yakout",
  });
  const whatsappHref = buildWhatsAppUrl(client.phone, firstMessage);
  const mailHref = buildMailtoUrl(client.email, "Votre demande Yakout", firstMessage);
  const openFollowups = followups.filter((item) => item.status !== "done");
  const latestReview = reviews[0];
  const timeline: TimelineItem[] = [
    ...leads.map((lead) => ({ date: lead.created_at, title: `Demande recue - ${serviceLabel(lead.request_type)}`, detail: lead.message, tone: "info" as const })),
    ...reservations.map((reservation) => ({ date: reservation.check_in, title: "Reservation appartement", detail: `${formatDate(reservation.check_in)} - ${formatDate(reservation.check_out)} | ${formatCurrency(reservation.total_amount)}`, tone: "gold" as const })),
    ...trips.map((trip) => ({ date: trip.trip_date, title: "Trajet / chauffeur", detail: `${trip.departure} -> ${trip.destination} | ${formatCurrency(trip.sold_price)}`, tone: "gold" as const })),
    ...payments.map((payment) => ({ date: payment.paid_at, title: "Paiement recu", detail: `${formatCurrency(payment.amount)} - ${payment.payment_method}`, tone: "success" as const })),
    ...notes.map((note) => ({ date: note.created_at, title: "Note interne", detail: note.note, tone: "muted" as const })),
    ...interactions.map((interaction) => ({ date: interaction.created_at, title: interaction.subject ?? interaction.type, detail: interaction.content, tone: "muted" as const })),
    ...followups.map((followup) => ({ date: followup.due_date ?? followup.created_at, title: `Relance - ${followup.title}`, detail: followup.description, tone: followup.status === "done" ? "success" as const : "warning" as const })),
    ...reviews.map((review) => ({ date: review.received_at ?? review.requested_at ?? review.created_at, title: review.status === "received" ? "Avis recu" : "Avis demande", detail: review.comment ?? (review.rating ? `${review.rating}/5` : review.review_source), tone: "ruby" as const })),
  ].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-gold/10 bg-card p-5 shadow-elevation-2">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard / Clients / {client.full_name}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold">{client.full_name}</h1>
              <Badge tone={statusTone(status)}>{clientStatusLabels[status] ?? status}</Badge>
              {status === "vip" && <Badge tone="gold">VIP</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>{client.phone || "Telephone non renseigne"}</span>
              <span>{client.email || "Email non renseigne"}</span>
              <span>{[client.city, client.country ?? client.nationality].filter(Boolean).join(", ") || "Ville/pays non renseigne"}</span>
              <span>Cree le {formatDate(client.created_at)}</span>
              <span>Source : {client.source ?? client.acquisition_source ?? "Non renseignee"}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <a
              href={whatsappHref || undefined}
              aria-disabled={!whatsappHref}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium transition ${whatsappHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-45"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={client.phone ? `tel:${client.phone}` : undefined}
              aria-disabled={!client.phone}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium transition ${client.phone ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-45"}`}
            >
              <Phone className="h-4 w-4" />
              Appeler
            </a>
            <a
              href={mailHref || undefined}
              aria-disabled={!mailHref}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium transition ${mailHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-45"}`}
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          </div>
        </div>
      </div>

      <FormErrorBanner />

      <ClientRequestBookingPanel
        clientId={id}
        requests={leads}
        apartments={apartmentOptions}
        packages={packageRows.map((item) => ({ id: item.id, label: item.public_title ?? item.title }))}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric title="Demandes" value={String(leads.length)} />
        <Metric title="Reservations" value={String(reservations.length)} />
        <Metric title="Valeur client" value={formatCurrency(crm.totalValue)} />
        <Metric title="Derniere interaction" value={formatDate(crm.lastContactAt)} />
        <Metric title="Prochaine relance" value={formatDate(crm.nextFollowup?.due_date)} />
        <Metric title="Satisfaction" value={latestReview?.rating ? `${latestReview.rating}/5` : latestReview?.status ?? "Non suivie"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateClientAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom complet *"><Input name="full_name" defaultValue={client.full_name} required /></Field>
                <Field label="Telephone *"><Input name="phone" defaultValue={client.phone} required /></Field>
                <Field label="Email"><Input name="email" type="email" defaultValue={client.email ?? ""} /></Field>
                <Field label="Ville"><Input name="city" defaultValue={client.city ?? ""} /></Field>
                <Field label="Pays"><Input name="country" defaultValue={client.country ?? client.nationality ?? ""} /></Field>
                <Field label="Langue preferee"><Input name="preferred_language" defaultValue={client.preferred_language ?? "fr"} /></Field>
                <Field label="Type client">
                  <select name="client_type" defaultValue={client.client_type ?? "voyageur"} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
                    {Object.entries(clientTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Statut relation">
                  <select name="status" defaultValue={status} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground">
                    {clientStatuses.map((value) => <option key={value} value={value}>{clientStatusLabels[value]}</option>)}
                  </select>
                </Field>
                <Field label="Source"><Input name="source" defaultValue={client.source ?? client.acquisition_source ?? ""} /></Field>
                <Field label="Tags"><Input name="tags" defaultValue={(client.tags ?? []).join(", ")} placeholder="VIP, famille, business" /></Field>
              </div>
              <Field label="Preferences">
                <Textarea name="preferences" defaultValue={typeof client.preferences === "string" ? client.preferences : JSON.stringify(client.preferences ?? {}, null, 2)} rows={3} />
              </Field>
              <Field label="Notes internes principales">
                <Textarea name="notes" defaultValue={client.notes ?? ""} rows={3} />
              </Field>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <ClientMessageTemplates client={client} serviceType={crm.lastService} />
          <Card>
            <CardHeader><CardTitle>Actions sensibles</CardTitle></CardHeader>
            <CardContent>
              <form action={deleteClientAction.bind(null, id)}>
                <Button type="submit" variant="danger" className="w-full">Supprimer ce client</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Historique des demandes">
          {leads.length === 0 ? <EmptyLine text="Aucune demande liee par client_id, email ou telephone." /> : leads.map((lead) => (
            <div key={lead.id} className="border-t border-border/40 py-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{serviceLabel(lead.request_type)}</p>
                <Badge tone="info">{lead.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(lead.created_at)} - {lead.source}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{lead.message || "-"}</p>
              <Link href={`/dashboard/leads/${lead.id}`} className="mt-2 inline-flex text-xs font-medium text-gold hover:text-gold-light">Voir la demande</Link>
            </div>
          ))}
        </Section>

        <Section title="Reservations / sejours / paiements">
          {[...reservations, ...trips, ...payments].length === 0 ? <EmptyLine text="Aucune reservation, trajet ou paiement rattache." /> : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="border-t border-border/40 pt-3 first:border-t-0 first:pt-0">
                  <p className="font-medium">Appartement - {reservation.status}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(reservation.check_in)} - {formatDate(reservation.check_out)} | {formatCurrency(reservation.total_amount)}</p>
                </div>
              ))}
              {trips.map((trip) => (
                <div key={trip.id} className="border-t border-border/40 pt-3">
                  <p className="font-medium">Chauffeur / transfert - {trip.trip_status ?? trip.status ?? "Demande"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(trip.trip_date)} | {trip.departure} vers {trip.destination} | {formatCurrency(trip.sold_price)}</p>
                </div>
              ))}
              {payments.map((payment) => (
                <div key={payment.id} className="border-t border-border/40 pt-3">
                  <p className="font-medium">Paiement - {payment.status}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(payment.paid_at)} | {payment.activity_type} | {formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Section title="Relances">
          <form action={createClientFollowupAction.bind(null, id)} className="mb-5 grid gap-3 md:grid-cols-2">
            <Input name="title" placeholder="Motif de relance" required />
            <DateField id="due_date" name="due_date" label="Echeance" />
            <select name="priority" defaultValue="normal" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
            <Input name="description" placeholder="Contexte" />
            <Button type="submit" className="md:col-span-2">Creer relance</Button>
          </form>
          {openFollowups.length === 0 ? <EmptyLine text="Aucune relance ouverte." /> : openFollowups.map((followup) => (
            <div key={followup.id} className="border-t border-border/40 py-3 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{followup.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(followup.due_date)} - Priorite {followup.priority}</p>
                  {followup.description && <p className="mt-2 text-sm text-muted-foreground">{followup.description}</p>}
                </div>
                <CalendarClock className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={markClientFollowupDoneAction.bind(null, id, followup.id)}><Button type="submit" variant="secondary">Marquer fait</Button></form>
                <form action={postponeClientFollowupAction.bind(null, id, followup.id)}><Button type="submit" variant="ghost">Reporter</Button></form>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Timeline relation client">
          {timeline.length === 0 ? <EmptyLine text="Aucun evenement relationnel pour le moment." /> : timeline.map((item, index) => (
            <div key={`${item.title}-${index}`} className="relative border-l border-border/60 pb-5 pl-5 last:pb-0">
              <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border border-gold/30 bg-gold" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge tone={item.tone ?? "muted"}>{formatDate(item.date)}</Badge>
              </div>
              {item.detail && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.detail}</p>}
            </div>
          ))}
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Avis et satisfaction">
          <form action={saveClientReviewAction.bind(null, id)} className="mb-5 grid gap-3 md:grid-cols-2">
            <select name="status" defaultValue="requested" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="requested">Avis demande</option>
              <option value="received">Avis recu</option>
            </select>
            <Input name="rating" type="number" min="0" max="5" placeholder="Note /5" />
            <Input name="review_source" defaultValue="Google Reviews" />
            <Input name="comment" placeholder="Commentaire client" />
            <Button type="submit" className="md:col-span-2">
              <Star className="h-4 w-4" />
              Enregistrer suivi avis
            </Button>
          </form>
          {reviews.length === 0 ? <EmptyLine text="Aucun avis suivi." /> : reviews.map((review) => (
            <div key={review.id} className="border-t border-border/40 py-3 first:border-t-0 first:pt-0">
              <p className="font-medium">{review.status === "received" ? "Avis recu" : "Avis demande"} {review.rating ? `- ${review.rating}/5` : ""}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatDate(review.received_at ?? review.requested_at ?? review.created_at)} - {review.review_source ?? "Google Reviews"}</p>
              {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </Section>

        <Section title="Notes internes">
          <form action={createClientNoteAction.bind(null, id)} className="mb-5 space-y-3">
            <Textarea name="note" placeholder="Ajouter une note interne pour Maria..." required />
            <Button type="submit">Ajouter note</Button>
          </form>
          {notes.length === 0 ? <EmptyLine text="Aucune note interne." /> : notes.map((note) => (
            <div key={note.id} className="border-t border-border/40 py-3 first:border-t-0 first:pt-0">
              <p className="whitespace-pre-wrap text-sm leading-6">{note.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">Interne - {formatDate(note.created_at)}</p>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4 shadow-elevation-1">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-sm border border-border/50 bg-background/35 px-4 py-3 text-sm text-muted-foreground">{text}</p>;
}
