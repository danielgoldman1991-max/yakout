import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Mail, MessageCircle, Package, Phone, Users } from "lucide-react";
import { getLeadById } from "@/lib/data";
import { getLeadReservations } from "@/lib/data/reservations";
import { updateLeadAction, deleteLeadAction, convertLeadToClientAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { getLeadTypeLabel, leadRequestTypes, leadTypeLabels } from "@/lib/leads";
import { MetadataDisplay } from "@/components/dashboard/lead-metadata-display";
import { ConvertLeadToOwnerForm } from "@/components/dashboard/convert-lead-to-owner-form";

const LEAD_STATUSES = ["new", "Nouveau", "A qualifier", "Contacte", "Devis envoye", "Confirme", "Perdu", "A relancer"];

function statusLabel(status: string) {
  return status === "new" ? "Nouveau" : status;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);
}

function PackageSummaryCard({ metadata }: { metadata: Record<string, unknown> }) {
  const stay = metadata.stay as Record<string, unknown> | undefined;
  const intent = metadata.package_intent;
  const intentLabel = intent === "order" ? "Pack demande" : intent === "customize" ? "Pack personnalise depuis modele" : "Pack sur mesure";
  const packageTitle = metadata.selected_package_title ?? metadata.base_package_title ?? metadata.package_title;
  const selectedItems = ((metadata.selected_items ?? metadata.package_items) as Record<string, unknown>[] | undefined) ?? [];
  const removedItems = (metadata.removed_items as Record<string, unknown>[] | undefined) ?? [];
  const addedItems = (metadata.added_items as Record<string, unknown>[] | undefined) ?? [];
  const apartment = metadata.apartment as Record<string, unknown> | null | undefined;
  const transfers = (metadata.transfers as Record<string, unknown>[]) ?? [];
  const vehicle = metadata.vehicle as Record<string, unknown> | null | undefined;
  const experiences = (metadata.experiences as Record<string, unknown>[]) ?? [];
  const services = (metadata.services as Record<string, unknown>[]) ?? [];
  const pricing = metadata.pricing_breakdown as Record<string, unknown> | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gold" />
          Package séjour
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-sm border border-gold/20 bg-gold/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{intentLabel}</p>
          {packageTitle ? <p className="mt-1 text-sm font-semibold text-foreground">{String(packageTitle)}</p> : null}
        </div>

        {selectedItems.length > 0 && (
          <PackageItemsBlock title={intent === "customize" ? "Elements conserves" : "Elements inclus"} items={selectedItems} />
        )}

        {removedItems.length > 0 && (
          <PackageItemsBlock title="Elements retires" items={removedItems} muted />
        )}

        {addedItems.length > 0 && (
          <PackageItemsBlock title="Elements ajoutes" items={addedItems} />
        )}

        {stay && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Séjour</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {Boolean(stay.nights) && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold/70" />{String(stay.nights)} nuits</span>}
              {Boolean(stay.adults) && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-gold/70" />{String(stay.adults)} adult{Number(stay.adults) > 1 ? "es" : "e"}{Boolean(stay.children) ? `, ${String(stay.children)} enf.` : ""}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {Boolean(stay.arrival_date) && <div>Arrivée: <span className="text-foreground">{formatDate(String(stay.arrival_date))}</span></div>}
              {Boolean(stay.departure_date) && <div>Départ: <span className="text-foreground">{formatDate(String(stay.departure_date))}</span></div>}
              {Boolean(stay.trip_style) && <div>Style: <span className="text-foreground">{String(stay.trip_style)}</span></div>}
              {Boolean(stay.budget) && <div>Budget: <span className="text-foreground">{formatPrice(Number(stay.budget))}</span></div>}
            </div>
          </div>
        )}

        {apartment && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Hébergement</p>
            {"requested" in apartment && apartment.requested === true ? (
              <p className="text-sm text-muted-foreground">Sur recommandation</p>
            ) : (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="font-medium text-foreground">{String(apartment.title ?? "")}</span>
                {Boolean(apartment.district) && <span className="text-muted-foreground">· {String(apartment.district)}</span>}
                {Boolean(apartment.price_per_night) && <Badge tone="gold">{formatPrice(Number(apartment.price_per_night))}/nuit</Badge>}
              </div>
            )}
          </div>
        )}

        {transfers.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Transferts ({transfers.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {transfers.map((t, i) => (
                <Badge key={i} tone="muted">{String(t.type ?? "").replace("_", " ")}</Badge>
              ))}
            </div>
          </div>
        )}

        {vehicle && "requested" in vehicle && vehicle.requested === true ? (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Véhicule</p>
            <p className="text-sm text-muted-foreground">Sur recommandation · {String(vehicle.service_type ?? "")} · {String(vehicle.days ?? 1)} jour(s)</p>
          </div>
        ) : vehicle && "title" in vehicle ? (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Véhicule</p>
            <p className="text-sm"><span className="font-medium text-foreground">{String(vehicle.title)}</span> <span className="text-muted-foreground">· {String(vehicle.service_type ?? "")} · {String(vehicle.days ?? 1)} jour(s)</span></p>
          </div>
        ) : null}

        {experiences.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Expériences ({experiences.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {experiences.map((e, i) => (
                <Badge key={i} tone="gold">{String(e.title ?? "")}</Badge>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Services ({services.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s, i) => (
                <Badge key={i} tone="muted">{String(s.label ?? "")}</Badge>
              ))}
            </div>
          </div>
        )}

        {(Boolean(pricing) || Boolean(metadata.estimated_total)) && (
          <div className="border-t border-border/30 pt-3">
            {Boolean(pricing?.entries) && Array.isArray(pricing?.entries) && (
              <div className="space-y-1 text-xs">
                {(pricing.entries as Array<{ label: string; amount: number; type: string }>).map((entry, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{entry.label}</span>
                    <span className="font-medium text-foreground">{formatPrice(entry.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {Boolean(pricing?.subtotals) && (
              <div className="mt-2 space-y-0.5 border-t border-border/20 pt-2 text-xs text-muted-foreground">
                {Object.entries(pricing?.subtotals as Record<string, number>).filter(([, v]) => v > 0).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}</span>
                    <span>{formatPrice(val)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
              <span className="text-sm font-medium text-foreground">Total estimatif</span>
              <span className="text-lg font-bold text-gold">{formatPrice(Number(metadata.estimated_total ?? pricing?.estimated_total ?? 0))}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PackageItemsBlock({ title, items, muted = false }: { title: string; items: Record<string, unknown>[]; muted?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <Badge key={`${String(item.id ?? item.title ?? item.label)}-${index}`} tone={muted ? "muted" : "gold"}>
            {String(item.title ?? item.label ?? "")}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidRegex.test(id)) { notFound(); }
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const reservations = await getLeadReservations(id);
  const isPackage = lead.request_type === "package";
  const isTransport = lead.request_type === "transport" || lead.request_type === "chauffeur";
  const meta = lead.metadata as Record<string, unknown> | null;
  const pkgPricing = meta?.pricing_breakdown as Record<string, unknown> | undefined;
  const pkgTotal = Number(meta?.estimated_total ?? pkgPricing?.estimated_total ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Leads / {lead.name}</p>
        <div className="flex items-center gap-3">
          <h1 className="mt-2 text-3xl font-semibold">{lead.name}</h1>
          {isPackage && pkgTotal > 0 && (
            <span className="mt-2 rounded-sm border border-gold/20 bg-gold/5 px-3 py-1 text-sm font-semibold text-gold">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(pkgTotal)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Cree le {formatDate(lead.created_at)} - {getLeadTypeLabel(lead.request_type)}</p>
      </div>

      <FormErrorBanner />

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Modifier le lead</CardTitle></CardHeader>
            <CardContent>
              <form action={updateLeadAction.bind(null, id)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                    <Input name="name" defaultValue={lead.name} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Telephone *</label>
                    <Input name="phone" defaultValue={lead.phone} required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input name="email" type="email" defaultValue={lead.email ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Type *</label>
                    <select name="request_type" defaultValue={lead.request_type} required className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                      {leadRequestTypes.map((t) => (<option key={t} value={t}>{leadTypeLabels[t]}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Source</label>
                    <Input name="source" defaultValue={lead.source} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Statut</label>
                    <select name="status" defaultValue={lead.status} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                      {LEAD_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Type lie</label>
                    <Input name="related_type" defaultValue={lead.related_type ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Slug lie</label>
                    <Input name="related_slug" defaultValue={lead.related_slug ?? ""} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <Textarea name="message" defaultValue={lead.message ?? ""} rows={3} />
                </div>
                <Button type="submit">Enregistrer</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {lead.owner_id ? (
                <Link href={`/dashboard/owners/${lead.owner_id}`} className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-gold px-5 text-sm font-semibold text-primary-foreground hover:-translate-y-0.5 transition-all duration-300 shadow-elevation-1 shadow-gold/10 hover:bg-gold-light hover:shadow-glow-gold">
                  Voir le proprietaire
                </Link>
              ) : lead.request_type === "proprietaire" ? (
                <ConvertLeadToOwnerForm leadId={id} />
              ) : lead.client_id ? (
                <Link href={`/dashboard/clients/${lead.client_id}`} className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-gold px-5 text-sm font-semibold text-primary-foreground hover:-translate-y-0.5 transition-all duration-300 shadow-elevation-1 shadow-gold/10 hover:bg-gold-light hover:shadow-glow-gold">
                  Voir le client
                </Link>
              ) : (
                <form action={convertLeadToClientAction.bind(null, id)}>
                  <Button type="submit" className="w-full">Convertir en client</Button>
                </form>
              )}
              {lead.phone ? (
                <div className="flex gap-2">
                  <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${lead.name}, je vous contacte au sujet de votre demande Yakout.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <a href={`tel:${lead.phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    <Phone className="h-4 w-4" /> Appeler
                  </a>
                </div>
              ) : null}
              {isTransport ? (
                <div className="grid gap-2 border-t border-border/40 pt-4 sm:grid-cols-2">
                  <Link href="/dashboard/transfers/new" className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    Creer transfert
                  </Link>
                  <Link href="/dashboard/trips/new" className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    Creer trajet
                  </Link>
                  <Link href="/dashboard/vehicles" className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    Assigner vehicule
                  </Link>
                  <Link href="/dashboard/partners" className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                    Assigner partenaire
                  </Link>
                  <Link href="/dashboard/payments/new" className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10 sm:col-span-2">
                    Creer paiement
                  </Link>
                </div>
              ) : null}
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                  <Mail className="h-4 w-4" /> Email
                </a>
              ) : null}
              <form action={deleteLeadAction.bind(null, id)}>
                <Button type="submit" variant="danger" className="w-full">Supprimer ce lead</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {isPackage && meta && <PackageSummaryCard metadata={meta} />}

          {reservations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Reservations ({reservations.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {reservations.map((r) => (
                  <Link key={r.id} href={`/dashboard/reservations/${r.id}`} className="block rounded-sm border border-border p-3 transition hover:border-gold/30 hover:bg-gold/5">
                    <p className="text-sm font-medium text-gold">{r.reservation_number}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.guest_name} · {formatDate(r.check_in)} - {formatDate(r.check_out)}</p>
                    <p className="text-xs text-muted-foreground">{r.status} · {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(Number(r.total_amount ?? 0))}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {lead.metadata && typeof lead.metadata === "object" && !isPackage && Object.keys(lead.metadata).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Détails de la demande</CardTitle></CardHeader>
              <CardContent>
                <MetadataDisplay metadata={lead.metadata as Record<string, string>} requestType={lead.request_type} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
