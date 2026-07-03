import { notFound } from "next/navigation";
import Link from "next/link";
import { getDocumentById } from "@/lib/data";
import { updateDocumentAction, deleteDocumentAction, archiveDocumentAction } from "@/lib/data/actions";
import { getDocumentSignedUrl } from "@/lib/storage";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { DocumentUploadField } from "@/components/dashboard/document-upload-field";
import { FileText, FileSpreadsheet, FileImage, ExternalLink } from "lucide-react";

const documentTypeLabels: Record<string, string> = {
  client_doc: "Client",
  owner_contract: "Contrat",
  property_doc: "Bien",
  vehicle_doc: "Véhicule",
  payment_receipt: "Reçu",
  expense_receipt: "Justificatif",
  invoice: "Facture",
  internal: "Interne",
  media: "Média",
  other: "Autre",
};

const documentTypes = [
  { value: "client_doc", label: "Document client" },
  { value: "owner_contract", label: "Contrat propriétaire" },
  { value: "property_doc", label: "Document bien" },
  { value: "vehicle_doc", label: "Document véhicule" },
  { value: "payment_receipt", label: "Reçu paiement" },
  { value: "expense_receipt", label: "Justificatif dépense" },
  { value: "invoice", label: "Facture" },
  { value: "internal", label: "Interne" },
  { value: "media", label: "Média" },
  { value: "other", label: "Autre" },
] as const;

const statusTone: Record<string, "success" | "muted" | "ruby" | "warning"> = {
  active: "success",
  archived: "muted",
  expired: "ruby",
  to_review: "warning",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  archived: "Archivé",
  expired: "Expiré",
  to_review: "À vérifier",
};

const statuses = [
  { value: "active", label: "Actif" },
  { value: "archived", label: "Archivé" },
  { value: "expired", label: "Expiré" },
  { value: "to_review", label: "À vérifier" },
] as const;

const relatedTypeOptions = [
  { value: "", label: "Aucun" },
  { value: "client", label: "Client" },
  { value: "owner", label: "Propriétaire" },
  { value: "apartment", label: "Appartement" },
  { value: "vehicle", label: "Véhicule" },
  { value: "reservation", label: "Réservation" },
  { value: "payment", label: "Paiement" },
  { value: "expense", label: "Dépense" },
] as const;

const fileIconColors: Record<string, string> = {
  pdf: "text-red-400",
  doc: "text-blue-400",
  docx: "text-blue-400",
  xls: "text-emerald-400",
  xlsx: "text-emerald-400",
  csv: "text-emerald-400",
  jpg: "text-purple-400",
  jpeg: "text-purple-400",
  png: "text-purple-400",
  webp: "text-purple-400",
};

function fileIcon(mimeType?: string, fileName?: string, className?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const color = fileIconColors[ext ?? ""] ?? "text-muted-foreground";
  const cls = `${className ?? "h-5 w-5"} ${color}`;
  if (mimeType?.startsWith("image/") || ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") return <FileImage className={cls} />;
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || mimeType === "text/csv" || ext === "xls" || ext === "xlsx" || ext === "csv") return <FileSpreadsheet className={cls} />;
  if (ext === "pdf" || ext === "doc" || ext === "docx") return <FileText className={cls} />;
  return <FileText className={cls} />;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) notFound();

  const signedUrl = doc.storage_bucket === "yakout-private" && doc.file_path
    ? await getDocumentSignedUrl(doc.file_path)
    : doc.file_url ?? null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Dashboard / Documents / {doc.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{doc.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="default">
          {documentTypeLabels[doc.type] ?? doc.type}
        </Badge>
        <Badge tone={statusTone[doc.doc_status ?? "active"] ?? "default"}>
          {statusLabels[doc.doc_status ?? "active"] ?? doc.doc_status}
        </Badge>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Fichier</span>
              <div className="mt-1 flex items-center gap-2">
                {fileIcon(doc.mime_type, doc.file_name, "h-5 w-5")}
                <div>
                  <p className="font-medium">{doc.file_name ?? "Document"}</p>
                  {doc.file_size && (
                    <p className="text-xs text-muted-foreground/60">
                      {(doc.file_size / 1024).toFixed(0)} Ko
                      {doc.mime_type && ` · ${doc.mime_type}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {doc.category && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Catégorie</span>
                <p>{doc.category}</p>
              </div>
            )}
            {doc.description && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <p className="text-muted-foreground">{doc.description}</p>
              </div>
            )}
            {(doc.client_id || doc.apartment_id || doc.vehicle_id || doc.owner_id || doc.related_type) && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Lié à</span>
                <div className="mt-1">
                  {doc.owner_id ? (
                    <Link href={`/dashboard/owners/${doc.owner_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Propriétaire <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.apartment_id ? (
                    <Link href={`/dashboard/apartments/${doc.apartment_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Appartement <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.client_id ? (
                    <Link href={`/dashboard/clients/${doc.client_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Client <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.vehicle_id ? (
                    <Link href={`/dashboard/vehicles/${doc.vehicle_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Véhicule <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.reservation_id ? (
                    <Link href={`/dashboard/reservations/${doc.reservation_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Réservation <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.payment_id ? (
                    <Link href={`/dashboard/payments/${doc.payment_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Paiement <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.expense_id ? (
                    <Link href={`/dashboard/expenses/${doc.expense_id}`} className="flex items-center gap-1 text-sm text-gold hover:underline">
                      Dépense <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : doc.related_type ? (
                    <span className="text-sm text-muted-foreground">{doc.related_type}</span>
                  ) : null}
                </div>
              </div>
            )}
            {doc.expiry_date && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Date d&apos;expiration</span>
                <p>{formatDate(doc.expiry_date)}</p>
              </div>
            )}
            {doc.reminder_date && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Date de rappel</span>
                <p>{formatDate(doc.reminder_date)}</p>
              </div>
            )}
            {doc.notes && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Notes internes</span>
                <p className="whitespace-pre-wrap text-muted-foreground">{doc.notes}</p>
              </div>
            )}
            {doc.is_private && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Document privé</span>
                <p className="text-muted-foreground">Oui</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-muted-foreground">Ajouté le</span>
              <p className="text-muted-foreground">{formatDate(doc.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Modifier le document</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateDocumentAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                  <Input name="title" defaultValue={doc.title} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type de document *</label>
                  <select name="type" required defaultValue={doc.type} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    {documentTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {doc.file_name && (
                <div className="rounded-sm border border-border/60 bg-surface/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground/70">Fichier actuel</p>
                  <div className="mt-1 flex items-center gap-2">
                    {fileIcon(doc.mime_type, doc.file_name, "h-4 w-4")}
                    <span className="text-sm font-medium">{doc.file_name}</span>
                    {doc.file_size && (
                      <span className="text-xs text-muted-foreground/60">
                        ({(doc.file_size / 1024).toFixed(0)} Ko)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <DocumentUploadField label="Remplacer le fichier (optionnel)" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                  <Input name="category" defaultValue={doc.category ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Input name="description" defaultValue={doc.description ?? ""} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lié à</label>
                  <select name="related_type" defaultValue={doc.related_type ?? ""} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    {relatedTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client lié</label>
                <input name="client_id" type="hidden" value={doc.client_id ?? ""} />
                <p className="text-sm text-muted-foreground">{doc.client_id ?? "Aucun"}</p>
              </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Propriétaire lié</label>
                <input name="owner_id" type="hidden" value={doc.owner_id ?? ""} />
                <p className="text-sm text-muted-foreground">{doc.owner_id ?? "Aucun"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Appartement lié</label>
                <input name="apartment_id" type="hidden" value={doc.apartment_id ?? ""} />
                <p className="text-sm text-muted-foreground">{doc.apartment_id ?? "Aucun"}</p>
              </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Véhicule lié</label>
                <input name="vehicle_id" type="hidden" value={doc.vehicle_id ?? ""} />
                <p className="text-sm text-muted-foreground">{doc.vehicle_id ?? "Aucun"}</p>
              </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date d&apos;expiration</label>
                  <Input name="expiry_date" type="date" defaultValue={doc.expiry_date ?? ""} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date de rappel</label>
                  <Input name="reminder_date" type="date" defaultValue={doc.reminder_date ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="doc_status" defaultValue={doc.doc_status} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    name="is_private"
                    value="true"
                    defaultChecked={doc.is_private ?? false}
                    className="rounded border-border bg-transparent"
                  />
                  Document privé
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
                <Textarea name="notes" rows={3} defaultValue={doc.notes ?? ""} />
              </div>

              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">
                {doc.mime_type?.startsWith("image/") ? "Voir l'image" : doc.mime_type === "application/pdf" ? "Ouvrir le PDF" : "Télécharger le fichier"}
              </Button>
            </a>
          )}
          {doc.doc_status !== "archived" && (
            <form action={archiveDocumentAction.bind(null, id)}>
              <Button type="submit" variant="secondary">Archiver</Button>
            </form>
          )}
          <form action={deleteDocumentAction.bind(null, id)}>
            <Button type="submit" variant="danger">Supprimer ce document</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
