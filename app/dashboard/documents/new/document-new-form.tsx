"use client";

import { useState, useCallback } from "react";
import { createDocumentAction } from "@/lib/data/actions";
import { RelationSearchSelect, type SelectOption } from "@/components/dashboard/relation-search-select";
import { DocumentUploadField } from "@/components/dashboard/document-upload-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { Loader2 } from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "client_doc", label: "Document client" },
  { value: "owner_contract", label: "Contrat propriétaire" },
  { value: "property_doc", label: "Document bien" },
  { value: "vehicle_doc", label: "Document véhicule" },
  { value: "payment_receipt", label: "Reçu paiement" },
  { value: "expense_receipt", label: "Justificatif dépense" },
  { value: "invoice", label: "Facture" },
  { value: "partner_contract", label: "Contrat partenaire" },
  { value: "partner_rib", label: "RIB partenaire" },
  { value: "partner_identity", label: "Identité / CIN" },
  { value: "vehicle_insurance", label: "Assurance véhicule" },
  { value: "vehicle_registration", label: "Carte grise" },
  { value: "transport_authorization", label: "Autorisation transport" },
  { value: "supplier_invoice", label: "Facture fournisseur" },
  { value: "internal", label: "Interne" },
  { value: "media", label: "Média" },
  { value: "other", label: "Autre" },
] as const;

const STATUSES = [
  { value: "active", label: "Actif" },
  { value: "archived", label: "Archivé" },
  { value: "expired", label: "Expiré" },
  { value: "to_review", label: "À vérifier" },
] as const;

const RELATED_TYPE_OPTIONS = [
  { value: "none", label: "Aucun" },
  { value: "owner", label: "Propriétaire" },
  { value: "apartment", label: "Appartement" },
  { value: "client", label: "Client" },
  { value: "vehicle", label: "Véhicule" },
  { value: "trip", label: "Trajet" },
  { value: "transfer", label: "Transfert" },
  { value: "package", label: "Pack" },
  { value: "reservation", label: "Réservation" },
  { value: "payment", label: "Paiement" },
  { value: "expense", label: "Dépense" },
  { value: "partner", label: "Partenaire" },
  { value: "internal", label: "Interne" },
] as const;

type Props = {
  owners: SelectOption[];
  apartments: SelectOption[];
  clients: SelectOption[];
  vehicles: SelectOption[];
  trips: SelectOption[];
  transfers: SelectOption[];
  packages: SelectOption[];
  reservations: SelectOption[];
  payments: SelectOption[];
  expenses: SelectOption[];
  partners: SelectOption[];
  defaultOwnerId?: string;
  defaultApartmentId?: string;
  defaultClientId?: string;
  defaultPaymentId?: string;
  defaultPartnerId?: string;
  defaultTripId?: string;
  defaultTransferId?: string;
  defaultPackageId?: string;
  defaultRelatedType?: string;
  defaultType?: string;
};

export function DocumentNewForm(props: Props) {
  const { owners, apartments, clients, vehicles, trips, transfers, packages: pckgs, reservations, payments, expenses, partners, defaultOwnerId, defaultApartmentId, defaultClientId, defaultPaymentId, defaultPartnerId, defaultTripId, defaultTransferId, defaultPackageId, defaultRelatedType, defaultType } = props;

  const [title, setTitle] = useState(defaultType === "payment_receipt" ? "Recu paiement" : "");
  const [docType, setDocType] = useState(defaultType ?? "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [docStatus, setDocStatus] = useState("active");
  const [isPrivate, setIsPrivate] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const defaultRelType = defaultRelatedType ?? (defaultPaymentId ? "payment" : defaultApartmentId ? "apartment" : defaultOwnerId ? "owner" : defaultPartnerId ? "partner" : "none");
  const defaultRelId = defaultPaymentId ?? defaultApartmentId ?? defaultOwnerId ?? defaultPartnerId ?? "";

  const [relatedType, setRelatedType] = useState(defaultRelType);
  const [relatedId, setRelatedId] = useState(defaultRelId);
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? "");
  const [apartmentId, setApartmentId] = useState(defaultApartmentId ?? "");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [vehicleId, setVehicleId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [paymentId, setPaymentId] = useState(defaultPaymentId ?? "");
  const [expenseId, setExpenseId] = useState("");
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? "");
  const [tripId, setTripId] = useState(defaultTripId ?? "");
  const [transferId, setTransferId] = useState(defaultTransferId ?? "");
  const [packageId, setPackageId] = useState(defaultPackageId ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRelatedTypeChange = useCallback((value: string) => {
    setRelatedType(value);
    setRelatedId("");
    setOwnerId("");
    setApartmentId("");
    setClientId("");
    setVehicleId("");
    setTripId("");
    setTransferId("");
    setPackageId("");
    setReservationId("");
    setPaymentId("");
    setExpenseId("");
    setPartnerId("");
  }, []);

  const handleRelationSelect = useCallback(
    (id: string) => {
      setRelatedId(id);
      switch (relatedType) {
        case "owner": setOwnerId(id); break;
        case "apartment": setApartmentId(id); break;
        case "client": setClientId(id); break;
        case "vehicle": setVehicleId(id); break;
        case "trip": setTripId(id); break;
        case "transfer": setTransferId(id); break;
        case "package": setPackageId(id); break;
        case "reservation": setReservationId(id); break;
        case "payment": setPaymentId(id); break;
        case "expense": setExpenseId(id); break;
        case "partner": setPartnerId(id); break;
      }
    },
    [relatedType],
  );

  const relationOptions = (() => {
    switch (relatedType) {
      case "owner": return owners;
      case "apartment": return apartments;
      case "client": return clients;
      case "vehicle": return vehicles;
      case "trip": return trips;
      case "transfer": return transfers;
      case "package": return pckgs;
      case "reservation": return reservations;
      case "payment": return payments;
      case "expense": return expenses;
      case "partner": return partners;
      default: return [];
    }
  })();

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedFile(file);
    setFileError(null);
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) { setFormError("Le titre est obligatoire."); return; }
    if (!docType) { setFormError("Le type de document est obligatoire."); return; }
    if (!selectedFile) { setFileError("Veuillez sélectionner un fichier."); return; }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    formData.append("type", docType);
    if (category) formData.append("category", category);
    if (description) formData.append("description", description);
    if (notes) formData.append("notes", notes);
    if (expiryDate) formData.append("expiry_date", expiryDate);
    if (reminderDate) formData.append("reminder_date", reminderDate);
    formData.append("doc_status", docStatus);
    formData.append("is_private", String(isPrivate));

    const related = relatedType === "none" ? "" : relatedType;
    formData.append("related_type", related);
    formData.append("related_id", relatedId || "");
    formData.append("owner_id", ownerId || "");
    formData.append("client_id", clientId || "");
    formData.append("apartment_id", apartmentId || "");
    formData.append("vehicle_id", vehicleId || "");
    formData.append("reservation_id", reservationId || "");
    formData.append("payment_id", paymentId || "");
    formData.append("expense_id", expenseId || "");
    formData.append("partner_id", partnerId || "");
    formData.append("trip_id", tripId || "");
    formData.append("transfer_id", transferId || "");
    formData.append("package_id", packageId || "");

    await createDocumentAction(formData);
    setSubmitting(false);
  }, [
    title, docType, category, description, notes,
    expiryDate, reminderDate, docStatus, isPrivate,
    selectedFile, relatedType, relatedId,
    ownerId, clientId, apartmentId, vehicleId,
    reservationId, paymentId, expenseId, partnerId,
    tripId, transferId, packageId,
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Documents / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Ajouter un document</h1>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Informations du document</CardTitle>
        </CardHeader>
        <CardContent>
          <FormErrorBanner />
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Titre *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type de document *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  required
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <DocumentUploadField
              value={selectedFile}
              onChange={handleFileChange}
              error={fileError ?? undefined}
              label="Fichier *"
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="rounded-sm border border-border/50 bg-accent/10 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Liaison métier</p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Lié à</label>
                <select
                  value={relatedType}
                  onChange={(e) => handleRelatedTypeChange(e.target.value)}
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                >
                  {RELATED_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {relatedType !== "none" && relatedType !== "internal" && (
                <div className="mt-3">
                  <RelationSearchSelect
                    options={relationOptions}
                    value={relatedId}
                    onChange={handleRelationSelect}
                    placeholder={
                      relatedType === "owner" ? "Sélectionner un propriétaire..." :
                      relatedType === "apartment" ? "Sélectionner un appartement..." :
                      relatedType === "client" ? "Sélectionner un client..." :
                      relatedType === "vehicle" ? "Sélectionner un véhicule..." :
                      relatedType === "trip" ? "Sélectionner un trajet..." :
                      relatedType === "transfer" ? "Sélectionner un transfert..." :
                      relatedType === "package" ? "Sélectionner un pack..." :
                      relatedType === "reservation" ? "Sélectionner une réservation..." :
                      relatedType === "payment" ? "Sélectionner un paiement..." :
                      relatedType === "expense" ? "Sélectionner une dépense..." :
                      relatedType === "partner" ? "Sélectionner un partenaire..." :
                      "Rechercher..."
                    }
                    label={
                      relatedType === "owner" ? "Propriétaire lié" :
                      relatedType === "apartment" ? "Appartement lié" :
                      relatedType === "client" ? "Client lié" :
                      relatedType === "vehicle" ? "Véhicule lié" :
                      relatedType === "trip" ? "Trajet lié" :
                      relatedType === "transfer" ? "Transfert lié" :
                      relatedType === "package" ? "Pack lié" :
                      relatedType === "reservation" ? "Réservation liée" :
                      relatedType === "payment" ? "Paiement lié" :
                      relatedType === "expense" ? "Dépense liée" :
                      relatedType === "partner" ? "Partenaire lié" :
                      "Élément lié"
                    }
                    emptyMessage={
                      relatedType === "owner" ? `Aucun propriétaire disponible. Créez d'abord un propriétaire.` :
                      relatedType === "apartment" ? "Aucun appartement disponible." :
                      relatedType === "client" ? "Aucun client disponible." :
                      relatedType === "vehicle" ? "Aucun véhicule disponible." :
                      relatedType === "partner" ? "Aucun partenaire disponible. Créez d'abord un partenaire." :
                      "Aucun élément disponible."
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date d&apos;expiration</label>
                <Input value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} type="date" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date de rappel</label>
                <Input value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} type="date" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Statut</label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value)}
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-border bg-transparent"
                />
                Document privé
              </label>
              <p className="text-xs text-muted-foreground/60">Les documents privés ne sont accessibles que depuis le dashboard.</p>
            </div>

            {formError && (
              <p className="text-sm text-destructive" role="alert">{formError}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Enregistrement..." : "Enregistrer le document"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
