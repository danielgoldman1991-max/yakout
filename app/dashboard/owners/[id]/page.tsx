import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getOwnerById,
  getOwnerProperties,
  getOwnerDocuments,
  getOwnerFinancialSummary,
  getOwnerReservations,
  getUnassignedApartments,
} from "@/lib/data/owners";
import { updateOwnerStatusAction, deleteOwnerAction, attachApartmentToOwnerAction } from "@/lib/data/owner-actions";
import { getDocumentSignedUrl } from "@/lib/storage";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Building2, FileText, DollarSign, Calendar, MessageCircle, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import type { Apartment } from "@/types/business";

type ApartmentWithMeta = Apartment & {
  management_status?: string;
  owner_id?: string;
};

const pipelineStatuses = [
  { value: "lead_received", label: "Lead reçu" },
  { value: "contacted", label: "Contacté" },
  { value: "property_info_pending", label: "Infos bien en attente" },
  { value: "visit_scheduled", label: "Visite programmée" },
  { value: "visited", label: "Visité" },
  { value: "offer_sent", label: "Offre envoyée" },
  { value: "contract_pending", label: "Contrat en attente" },
  { value: "contract_signed", label: "Contrat signé" },
  { value: "onboarding", label: "Onboarding" },
  { value: "published", label: "Publié" },
  { value: "active_management", label: "Gestion active" },
  { value: "paused", label: "En pause" },
  { value: "lost", label: "Perdu" },
] as const;

const pipelineTone: Record<string, "gold" | "success" | "warning" | "muted" | "info" | "ruby"> = {
  lead_received: "info",
  contacted: "info",
  property_info_pending: "warning",
  visit_scheduled: "warning",
  visited: "warning",
  offer_sent: "gold",
  contract_pending: "gold",
  contract_signed: "success",
  onboarding: "success",
  published: "success",
  active_management: "success",
  paused: "muted",
  lost: "ruby",
};

const documentTypeLabels: Record<string, string> = {
  client_doc: "Document client",
  owner_contract: "Contrat propriétaire",
  property_doc: "Document bien",
  vehicle_doc: "Document véhicule",
  payment_receipt: "Reçu paiement",
  expense_receipt: "Justificatif dépense",
  invoice: "Facture",
  internal: "Interne",
  media: "Média",
  other: "Autre",
};

function whatsappUrl(phone: string): string {
  const cleaned = phone.replace(/[\s\-_().]/g, "");
  return `https://wa.me/${cleaned.startsWith("+") ? cleaned.slice(1) : cleaned}`;
}

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  if (!owner) notFound();

  const [properties, documents, financialSummary, reservations, unassigned] = await Promise.all([
    getOwnerProperties(id),
    getOwnerDocuments(id),
    getOwnerFinancialSummary(id),
    getOwnerReservations(id),
    getUnassignedApartments(),
  ]);

  const typedProperties = properties as ApartmentWithMeta[];

  const docsWithSignedUrls = await Promise.all(
    documents.map(async (doc) => {
      if (doc.storage_bucket === "yakout-private" && doc.file_path) {
        const signedUrl = await getDocumentSignedUrl(doc.file_path);
        return { ...doc, signedUrl };
      }
      return { ...doc, signedUrl: doc.file_url ?? null };
    }),
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Dashboard / Propriétaires / {owner.full_name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{owner.full_name}</h1>
      </div>

      <div className="rounded-sm border border-border bg-card p-5 shadow-elevation-2">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={pipelineTone[owner.status] ?? "default"}>
              {pipelineStatuses.find((s) => s.value === owner.status)?.label ?? owner.status}
            </Badge>
            <Badge tone="default">
              <Building2 className="mr-1 h-3 w-3" />
              {typedProperties.length} bien{typedProperties.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {owner.phone && (
              <a href={whatsappUrl(owner.phone)} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
            )}
            <Link href={`/dashboard/documents/new?owner_id=${id}`}>
              <Button variant="secondary">
                <FileText className="h-4 w-4" />
                Ajouter document
              </Button>
            </Link>
            <Link href={`/dashboard/apartments/new?owner_id=${id}`}>
              <Button variant="secondary">
                <Plus className="h-4 w-4" />
                Ajouter bien
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {owner.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {owner.phone}
            </span>
          )}
          {owner.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {owner.email}
            </span>
          )}
          {owner.created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Créé le {formatDate(owner.created_at)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Nom complet" value={owner.full_name} />
            <InfoRow label="Téléphone" value={owner.phone} />
            <InfoRow label="Email" value={owner.email ?? "Non renseigné"} />
            <InfoRow label="Ville" value={owner.city ?? "Non renseignée"} />
            <InfoRow label="Pays" value={owner.country ?? "Non renseigné"} />
            <InfoRow label="Canal préféré" value={owner.preferred_contact_channel ?? "Non renseigné"} />
            <InfoRow label="Source" value={owner.source ?? "Non renseignée"} />
            <div>
              <span className="text-xs font-medium text-muted-foreground">Tags</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {owner.tags && owner.tags.length > 0
                  ? owner.tags.map((tag) => (
                      <Badge key={tag} tone="default">{tag}</Badge>
                    ))
                  : <span className="text-muted-foreground">Aucun tag</span>}
              </div>
            </div>
            {owner.notes && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Notes</span>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{owner.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Statut pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateOwnerStatusAction.bind(null, id)} className="space-y-3">
              <select
                name="status"
                defaultValue={owner.status}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {pipelineStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Button type="submit" className="w-full">Mettre à jour le statut</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Finances (résumé)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <FinanceRow label="Revenu brut" value={formatCurrency(financialSummary.grossRevenue)} />
            <FinanceRow label="Dépenses" value={formatCurrency(financialSummary.expensesTotal)} />
            <FinanceRow label="Commission estimée" value={formatCurrency(financialSummary.estimatedCommission)} />
            <div className="border-t border-border pt-3">
              <FinanceRow label="Net" value={formatCurrency(financialSummary.netAmount)} bold />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Biens confiés ({typedProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typedProperties.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Aucun bien rattaché à ce propriétaire pour le moment.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/apartments/new?ownerId=${id}`}>
                    <Button variant="secondary">
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter un bien
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {typedProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/dashboard/apartments/${property.id}`}
                    className="block rounded-sm border border-border/60 p-3 transition hover:border-border hover:bg-surface/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{property.internal_name}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={property.is_published ? "success" : "muted"}>
                          {property.is_published ? "Publié" : "Brouillon"}
                        </Badge>
                        {property.management_status && (
                          <Badge tone={
                            property.management_status === "published" || property.management_status === "active_management"
                              ? "success"
                              : property.management_status === "contract_pending"
                                ? "warning"
                                : "default"
                          }>
                            {property.management_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{property.district}</span>
                      <span>{property.bedrooms} chambre{property.bedrooms !== 1 ? "s" : ""}</span>
                      {property.price_from ? <span>{formatCurrency(property.price_from)} / nuit</span> : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {unassigned.length > 0 && (
              <details className="mt-4 rounded-sm border border-border/50 bg-accent/10">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground">
                  Rattacher un bien existant ({unassigned.length} disponible{unassigned.length !== 1 ? "s" : ""})
                </summary>
                <div className="border-t border-border/50 p-4">
                  <form action={attachApartmentToOwnerAction.bind(null, id)} className="flex flex-wrap gap-3">
                    <select
                      name="apartment_id"
                      required
                      className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Sélectionner un bien...</option>
                      {unassigned.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.internal_name} — {apt.district ?? "Sans quartier"}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary">
                      <LinkIcon className="mr-1 h-4 w-4" />
                      Rattacher
                    </Button>
                  </form>
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({docsWithSignedUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docsWithSignedUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun document lié à ce propriétaire.</p>
            ) : (
              <div className="space-y-2">
                {docsWithSignedUrls.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-sm border border-border/60 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.title}</p>
                      <Badge tone="default">{documentTypeLabels[doc.type] ?? doc.type}</Badge>
                    </div>
                    {doc.signedUrl && (
                      <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Réservations récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune réservation liée aux biens de ce propriétaire.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Dates</th>
                    <th className="pb-2 pr-4">Montant</th>
                    <th className="pb-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(0, 10).map((reservation) => (
                    <tr key={reservation.id} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium">{reservation.client_name ?? "Client"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                      </td>
                      <td className="py-2 pr-4">{formatCurrency(reservation.total_amount)}</td>
                      <td className="py-2">
                        <Badge tone={
                          reservation.reservation_status?.toLowerCase().includes("confirme") ||
                          reservation.reservation_status?.toLowerCase().includes("paye")
                            ? "success"
                            : reservation.reservation_status?.toLowerCase().includes("annule")
                              ? "ruby"
                              : "warning"
                        }>
                          {reservation.reservation_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Notes internes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {owner.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{owner.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune note interne.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deleteOwnerAction.bind(null, id)}>
            <Button type="submit" variant="danger" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer ce propriétaire
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p>{value}</p>
    </div>
  );
}

function FinanceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
