import Link from "next/link";
import { getDocuments } from "@/lib/data";
import { getDocumentSignedUrl } from "@/lib/storage";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const filterTabs = [
  { key: "all", label: "Tous" },
  { key: "client", label: "Clients" },
  { key: "owner", label: "Propriétaires" },
  { key: "property", label: "Appartements" },
  { key: "vehicle", label: "Véhicules" },
  { key: "payment", label: "Paiements" },
  { key: "expense", label: "Dépenses" },
  { key: "internal", label: "Internes" },
  { key: "archived", label: "Archivés" },
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
  const cls = `${className ?? "h-4 w-4"} ${color}`;
  if (mimeType?.startsWith("image/") || ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") return <FileImage className={cls} />;
  if (mimeType?.includes("spreadsheet") || mimeType === "text/csv" || ext === "xls" || ext === "xlsx" || ext === "csv") return <FileSpreadsheet className={cls} />;
  return <FileText className={cls} />;
}

const relatedTypeLabels: Record<string, string> = {
  client: "Client",
  owner: "Propriétaire",
  apartment: "Appartement",
  vehicle: "Véhicule",
  reservation: "Réservation",
  payment: "Paiement",
  expense: "Dépense",
};

function getRelationHref(d: { related_type?: string; owner_id?: string; client_id?: string; apartment_id?: string; vehicle_id?: string; reservation_id?: string; payment_id?: string; expense_id?: string }): { href: string; label: string } | null {
  if (d.owner_id) return { href: `/dashboard/owners/${d.owner_id}`, label: `Propriétaire` };
  if (d.apartment_id) return { href: `/dashboard/apartments/${d.apartment_id}`, label: `Appartement` };
  if (d.client_id) return { href: `/dashboard/clients/${d.client_id}`, label: `Client` };
  if (d.vehicle_id) return { href: `/dashboard/vehicles/${d.vehicle_id}`, label: `Véhicule` };
  if (d.reservation_id) return { href: `/dashboard/reservations/${d.reservation_id}`, label: `Réservation` };
  if (d.payment_id) return { href: `/dashboard/payments/${d.payment_id}`, label: `Paiement` };
  if (d.expense_id) return { href: `/dashboard/expenses/${d.expense_id}`, label: `Dépense` };
  if (d.related_type && d.related_type !== "none" && d.related_type !== "internal") {
    return { href: "#", label: relatedTypeLabels[d.related_type] ?? d.related_type };
  }
  if (d.related_type === "internal") return { href: "#", label: "Interne" };
  return null;
}

async function getSignedUrl(doc: { storage_bucket?: string; file_path?: string; file_url?: string; mime_type?: string; file_extension?: string }): Promise<string | null> {
  if (doc.storage_bucket === "yakout-private" && doc.file_path) {
    return getDocumentSignedUrl(doc.file_path);
  }
  if (doc.file_url && (doc.storage_bucket !== "yakout-private" || !doc.file_path)) {
    return doc.file_url;
  }
  return null;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const documents = await getDocuments();

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const activeCount = documents.filter((d) => d.doc_status === "active").length;
  const expiringCount = documents.filter(
    (d) => d.expiry_date && d.expiry_date <= thirtyDaysFromNow,
  ).length;
  const toReviewCount = documents.filter((d) => d.doc_status === "to_review").length;
  const archivedCount = documents.filter((d) => d.doc_status === "archived").length;

  const typeToTab: Record<string, string> = {
    client_doc: "client",
    owner_contract: "owner",
    property_doc: "property",
    vehicle_doc: "vehicle",
    payment_receipt: "payment",
    expense_receipt: "expense",
    internal: "internal",
  };

  const filtered =
    !tab || tab === "all"
      ? documents
      : tab === "archived"
        ? documents.filter((d) => d.doc_status === "archived")
        : (() => {
            const candidateTypes = Object.entries(typeToTab)
              .filter(([, v]) => v === tab)
              .map(([k]) => k);
            return documents.filter((d) => candidateTypes.includes(d.type));
          })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Documents</p>
          <h1 className="mt-2 text-3xl font-semibold">Documents</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Centralisez les contrats, reçus, justificatifs, documents propriétaires,
            documents véhicules et fichiers internes Yakout.
          </p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button>Ajouter un document</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Documents actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-300">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Expirent bientôt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-300">{expiringCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              À vérifier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-300">{toReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Archivés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">{archivedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1">
        {filterTabs.map((t) => {
          const active = (!tab || tab === "all") ? t.key === "all" : tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/dashboard/documents" : `/dashboard/documents?tab=${t.key}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">Aucun document</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajoutez un document pour commencer.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Fichier</th>
                  <th className="px-4 py-3 font-medium">Lié à</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Expiration</th>
                  <th className="px-4 py-3 font-medium">Ajouté le</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(await Promise.all(filtered.map(async (d) => {
                  const signedUrl = await getSignedUrl({ storage_bucket: d.storage_bucket, file_path: d.file_path, file_url: d.file_url, mime_type: d.mime_type, file_extension: d.file_extension });

                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/documents/${d.id}`}
                          className="flex items-center gap-2 hover:text-gold hover:underline"
                        >
                          {fileIcon(d.mime_type, d.file_name, "h-4 w-4 shrink-0")}
                          {d.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="default">
                          {documentTypeLabels[d.type] ?? d.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {d.file_name ? (
                          <span className="block max-w-[160px] truncate" title={d.file_name}>
                            {d.file_name}
                          </span>
                        ) : (
                          "—"
                        )}
                        {d.file_size && (
                          <span className="block text-[11px] text-muted-foreground/60">
                            {(d.file_size / 1024).toFixed(0)} Ko
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(() => {
                          const rel = getRelationHref(d);
                          return rel && rel.href !== "#" ? (
                            <Link href={rel.href} className="flex items-center gap-1 text-xs hover:text-gold hover:underline">
                              {rel.label}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : rel ? (
                            <span className="text-xs">{rel.label}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone[d.doc_status ?? "active"] ?? "default"}>
                          {statusLabels[d.doc_status ?? "active"] ?? d.doc_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.expiry_date ? formatDate(d.expiry_date) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/documents/${d.id}`}>
                            <Button variant="secondary">Voir</Button>
                          </Link>
                          {signedUrl && (
                            <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary">Télécharger</Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
