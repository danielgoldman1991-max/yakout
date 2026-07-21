export type ReportCategory =
  | "executive"
  | "sales"
  | "accommodation"
  | "owners"
  | "finance"
  | "operations"
  | "transport"
  | "fleet"
  | "packages"
  | "clients"
  | "compliance"
  | "data_quality";

export type ReportFormat = "screen" | "pdf" | "xlsx" | "print";

export type ReportFilterType =
  | "date_range"
  | "owner"
  | "apartment"
  | "client"
  | "reservation_status"
  | "source"
  | "activity"
  | "vehicle"
  | "partner"
  | "package"
  | "currency"
  | "status";

export type ReportFilterDefinition = {
  id: string;
  type: ReportFilterType;
  label: string;
  required?: boolean;
  multiple?: boolean;
};

export type ReportDefinition = {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  supportedFormats: ReportFormat[];
  filters: ReportFilterDefinition[];
  permission: string;
  dataLoader: string;
  healthCheck: string;
};

const baseDateRange: ReportFilterDefinition[] = [
  { id: "period_start", type: "date_range", label: "Début de période", required: true },
  { id: "period_end", type: "date_range", label: "Fin de période", required: true },
];

const REPORT_DEFINITION_INPUTS: Omit<ReportDefinition, "dataLoader" | "healthCheck">[] = [
  // ─── Executive ───
  {
    id: "executive-dashboard",
    category: "executive",
    title: "Tableau de bord exécutif",
    description: "Vue d'ensemble des indicateurs clés : CA, dépenses, marge, occupation, réservations, leads",
    supportedFormats: ["screen", "pdf", "print"],
    filters: baseDateRange,
    permission: "reports.executive.view",
  },
  {
    id: "executive-performance",
    category: "executive",
    title: "Performance par activité",
    description: "Répartition du CA et de la marge par activité (hébergement, transport, packs, services)",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.executive.view",
  },
  // ─── Sales ───
  {
    id: "sales-lead-funnel",
    category: "sales",
    title: "Entonnoir des leads",
    description: "Volume et conversion des leads par étape, source et type de demande",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "source", type: "source", label: "Source" }, { id: "activity", type: "activity", label: "Type de demande" }],
    permission: "reports.sales.view",
  },
  {
    id: "sales-conversion",
    category: "sales",
    title: "Conversion par source",
    description: "Taux de conversion des leads par canal d'acquisition",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.sales.view",
  },
  // ─── Accommodation ───
  {
    id: "accommodation-performance",
    category: "accommodation",
    title: "Performance du portefeuille",
    description: "Occupation, ADR, RevPAR, revenus et nombre de réservations par appartement",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "apartment_id", type: "apartment", label: "Appartement" }],
    permission: "reports.accommodation.view",
  },
  {
    id: "accommodation-reservations",
    category: "accommodation",
    title: "Réservations détaillées",
    description: "Liste complète des réservations avec statut, montant, voyageur, appartement",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "status", type: "reservation_status", label: "Statut" }, { id: "apartment_id", type: "apartment", label: "Appartement" }],
    permission: "reports.accommodation.view",
  },
  {
    id: "accommodation-arrivals-departures",
    category: "accommodation",
    title: "Arrivées et départs",
    description: "Calendrier des arrivées et départs à venir",
    supportedFormats: ["screen", "print"],
    filters: [{ id: "period_start", type: "date_range", label: "Début", required: true }, { id: "period_end", type: "date_range", label: "Fin", required: true }],
    permission: "reports.accommodation.view",
  },
  // ─── Finance ───
  {
    id: "finance-revenue-journal",
    category: "finance",
    title: "Journal des recettes",
    description: "Tous les paiements enregistrés par date, activité et statut",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.finance.view",
  },
  {
    id: "finance-expense-journal",
    category: "finance",
    title: "Journal des dépenses",
    description: "Toutes les dépenses enregistrées par date, catégorie et activité",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.finance.view",
  },
  {
    id: "finance-accounts-receivable",
    category: "finance",
    title: "Créances clients",
    description: "Réservations avec solde restant dû, paiements en attente",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.finance.view",
  },
  {
    id: "finance-result-by-apartment",
    category: "finance",
    title: "Résultat par appartement",
    description: "Recettes, dépenses, commission et net par appartement",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "apartment_id", type: "apartment", label: "Appartement" }],
    permission: "reports.finance.view",
  },
  {
    id: "finance-reconciliation",
    category: "finance",
    title: "Rapprochement financier",
    description: "Écarts entre réservations, paiements et dépenses",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.finance.view",
  },
  // ─── Owners ───
  {
    id: "owners-monthly-statement",
    category: "owners",
    title: "Relevé mensuel propriétaire",
    description: "Revenus, dépenses, commission et net par propriétaire",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "owner_id", type: "owner", label: "Propriétaire", required: true }],
    permission: "reports.owners.view",
  },
  {
    id: "owners-consolidated",
    category: "owners",
    title: "Rapport consolidé",
    description: "Synthèse du portefeuille : tous les propriétaires, biens, revenus, soldes",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.owners.view",
  },
  {
    id: "owners-payouts",
    category: "owners",
    title: "Reversements propriétaires",
    description: "Historique des reversements effectués et en attente",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.owners.view",
  },
  // ─── Operations ───
  {
    id: "operations-maintenance",
    category: "operations",
    title: "Maintenance et incidents",
    description: "Tâches de maintenance par statut, priorité et appartement",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [{ id: "status", type: "status", label: "Statut" }],
    permission: "reports.operations.view",
  },
  // ─── Transport ───
  {
    id: "transport-performance",
    category: "transport",
    title: "Performance transport",
    description: "CA, coûts, marge et nombre de trajets par période",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.transport.view",
  },
  {
    id: "transport-trips",
    category: "transport",
    title: "Trajets détaillés",
    description: "Liste des trajets avec recette, coût, marge, véhicule, chauffeur",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.transport.view",
  },
  // ─── Fleet ───
  {
    id: "fleet-vehicle-usage",
    category: "fleet",
    title: "Utilisation des véhicules",
    description: "Nombre de trajets, recettes, coûts et disponibilité par véhicule",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.fleet.view",
  },
  {
    id: "fleet-partner-performance",
    category: "fleet",
    title: "Performance partenaires",
    description: "CA, coûts, marge par partenaire transport",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.fleet.view",
  },
  // ─── Packages ───
  {
    id: "packages-sales",
    category: "packages",
    title: "Ventes de packs",
    description: "Réservations de packs, revenus, coûts et marge",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [...baseDateRange, { id: "package_id", type: "package", label: "Pack" }],
    permission: "reports.packages.view",
  },
  // ─── Clients ───
  {
    id: "clients-portfolio",
    category: "clients",
    title: "Portefeuille clients",
    description: "Nombre de clients, valeur vie, réservations, pays d'origine",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: baseDateRange,
    permission: "reports.clients.view",
  },
  // ─── Compliance ───
  {
    id: "compliance-contracts",
    category: "compliance",
    title: "Contrats expirant",
    description: "Contrats propriétaires et documents arrivant à expiration",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [{ id: "period_end", type: "date_range", label: "Échéance avant le", required: true }],
    permission: "reports.compliance.view",
  },
  // ─── Data Quality ───
  {
    id: "data-quality-overview",
    category: "data_quality",
    title: "Qualité des données",
    description: "Anomalies : données manquantes, orphelines, incohérences, duplicats",
    supportedFormats: ["screen", "pdf", "xlsx", "print"],
    filters: [],
    permission: "reports.data_quality.view",
  },
];

export const REPORT_DEFINITIONS: ReportDefinition[] = REPORT_DEFINITION_INPUTS.map((definition) => ({
  ...definition,
  supportedFormats: ["screen", "pdf", "xlsx", "print"],
  dataLoader: definition.id,
  healthCheck: "loader",
}));

export const REPORT_CATEGORIES: { id: ReportCategory; label: string; icon: string }[] = [
  { id: "executive", label: "Direction", icon: "BarChart3" },
  { id: "sales", label: "Commercial", icon: "TrendingUp" },
  { id: "accommodation", label: "Hébergement", icon: "Building2" },
  { id: "owners", label: "Propriétaires", icon: "Users" },
  { id: "finance", label: "Finance", icon: "Wallet" },
  { id: "operations", label: "Exploitation", icon: "Wrench" },
  { id: "transport", label: "Transport", icon: "Car" },
  { id: "fleet", label: "Véhicules et partenaires", icon: "Truck" },
  { id: "packages", label: "Packs et séjours", icon: "Package" },
  { id: "clients", label: "Clients", icon: "UserCheck" },
  { id: "compliance", label: "Contrats et documents", icon: "FileText" },
  { id: "data_quality", label: "Qualité des données", icon: "Shield" },
];

export function getReportDefinition(id: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((r) => r.id === id);
}

export function getReportsByCategory(category: ReportCategory): ReportDefinition[] {
  return REPORT_DEFINITIONS.filter((r) => r.category === category);
}
