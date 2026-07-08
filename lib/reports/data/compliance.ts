import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInteger, formatReportDate } from "../formatters";
import { assertSupabaseResults } from "../supabase-results";
import type { ReportFilters, ReportData, ReportTable } from "./types";

async function getClient() {
  return createSupabaseServerClient();
}

export async function getComplianceContracts(filters: ReportFilters): Promise<ReportData> {
  const supabase = await getClient();
  const expiryBefore = filters.period_end ?? new Date(new Date(Date.now() + 90 * 86400000)).toISOString().slice(0, 10);

  const [documentsRes, ownersRes, vehiclesRes, partnersRes] = await Promise.all([
    supabase.from("documents").select("id, title, type, expiry_date, related_entity_type, notes").not("expiry_date", "is", null).order("expiry_date", { ascending: true }),
    supabase.from("owners").select("id, full_name, status"),
    supabase.from("vehicles").select("id, internal_name, insurance_expiry_date, technical_visit_expiry_date, authorization_expiry_date"),
    supabase.from("partners").select("id, name, status"),
  ]);
  assertSupabaseResults("Contrats et conformité", [documentsRes, ownersRes, vehiclesRes, partnersRes]);

  const documents = documentsRes.data ?? [];
  const owners = ownersRes.data ?? [];
  const vehicles = vehiclesRes.data ?? [];
  const partners = partnersRes.data ?? [];

  const expiringDocs = documents.filter((d) => d.expiry_date && d.expiry_date <= expiryBefore);
  const expiringInsurance = vehicles.filter((v) => v.insurance_expiry_date && v.insurance_expiry_date <= expiryBefore);
  const expiringTechVisit = vehicles.filter((v) => v.technical_visit_expiry_date && v.technical_visit_expiry_date <= expiryBefore);
  const pausedOwners = owners.filter((o) => o.status === "contract_pending" || o.status === "ready_to_publish");
  const inactivePartners = partners.filter((p) => p.status !== "active");

  const tables: ReportTable[] = [];

  if (expiringDocs.length > 0) {
    tables.push({
      title: "Documents expirant",
      columns: [
        { key: "title", label: "Document" },
        { key: "type", label: "Type" },
        { key: "expiry", label: "Expire le" },
      ],
      rows: expiringDocs.map((d) => ({
        title: d.title,
        type: d.type,
        expiry: formatReportDate(d.expiry_date!),
      })),
    });
  }

  if (expiringInsurance.length > 0) {
    tables.push({
      title: "Assurances véhicules expirant",
      columns: [
        { key: "vehicle", label: "Véhicule" },
        { key: "expiry", label: "Expire le" },
      ],
      rows: expiringInsurance.map((v) => ({
        vehicle: v.internal_name,
        expiry: formatReportDate(v.insurance_expiry_date!),
      })),
    });
  }

  if (expiringTechVisit.length > 0) {
    tables.push({
      title: "Visites techniques expirant",
      columns: [
        { key: "vehicle", label: "Véhicule" },
        { key: "expiry", label: "Expire le" },
      ],
      rows: expiringTechVisit.map((v) => ({
        vehicle: v.internal_name,
        expiry: formatReportDate(v.technical_visit_expiry_date!),
      })),
    });
  }

  if (pausedOwners.length > 0) {
    tables.push({
      title: "Propriétaires en attente de contrat",
      columns: [
        { key: "name", label: "Propriétaire" },
        { key: "status", label: "Statut" },
      ],
      rows: pausedOwners.map((o) => ({
        name: o.full_name,
        status: o.status,
      })),
    });
  }

  if (tables.length === 0) {
    return {
      metadata: {
        reportId: "compliance-contracts", title: "Contrats et conformité",
        generatedAt: new Date().toISOString(), status: "ready",
      },
      kpis: [
        { label: "Documents valides", value: formatInteger(documents.length) },
        { label: "Propriétaires à jour", value: formatInteger(owners.length) },
      ],
      tables: [{
        title: "Conformité",
        columns: [{ key: "check", label: "Point de contrôle" }, { key: "status", label: "Statut" }],
        rows: [{ check: "Aucun document ou contrat n'expire dans les 90 jours", status: "✓ OK" }],
      }],
      totals: {},
      warnings: [],
      sourceCounts: { documents: documents.length, owners: owners.length, vehicles: vehicles.length, partners: partners.length },
    };
  }

  const totalIssues = expiringDocs.length + expiringInsurance.length + expiringTechVisit.length + pausedOwners.length + inactivePartners.length;

  return {
    metadata: {
      reportId: "compliance-contracts", title: "Contrats et conformité",
      generatedAt: new Date().toISOString(), status: "ready",
    },
    kpis: [
      { label: "Documents expirant", value: formatInteger(expiringDocs.length), trend: expiringDocs.length > 0 ? { value: "À renouveler", positive: false } : undefined },
      { label: "Assurances expirant", value: formatInteger(expiringInsurance.length) },
      { label: "Visites techniques", value: formatInteger(expiringTechVisit.length) },
      { label: "Contrats en attente", value: formatInteger(pausedOwners.length) },
    ],
    tables,
    totals: { issues: totalIssues },
    warnings: totalIssues > 0 ? [`${formatInteger(totalIssues)} point(s) de conformité nécessitant attention.`] : [],
    sourceCounts: { documents: documents.length, owners: owners.length, vehicles: vehicles.length, partners: partners.length },
  };
}
