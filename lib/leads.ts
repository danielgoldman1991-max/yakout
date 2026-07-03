export const leadRequestTypes = ["reservation", "transport", "chauffeur", "proprietaire", "vehicule", "services", "package", "general"] as const;

export type LeadRequestType = (typeof leadRequestTypes)[number];

export const leadTypeLabels: Record<LeadRequestType, string> = {
  reservation: "Reservation appartement",
  transport: "Transport prive",
  chauffeur: "Transport prive",
  proprietaire: "Confier mon bien",
  vehicule: "Vehicule avec chauffeur",
  services: "Services sur mesure",
  package: "Pack / sejour compose",
  general: "Demande generale",
};

export const leadTypeDescriptions: Record<LeadRequestType, string> = {
  reservation: "Reservez l'appartement ideal pour votre sejour a Marrakech.",
  transport: "Indiquez votre besoin de transport. Yakout propose ensuite le vehicule avec chauffeur adapte.",
  chauffeur: "Indiquez votre besoin de transport. Yakout propose ensuite le vehicule avec chauffeur adapte.",
  proprietaire: "Confiez votre appartement a Yakout et maximisez vos revenus.",
  vehicule: "Demandez une solution de transport avec chauffeur adaptee a votre trajet.",
  services: "Organisez vos services sur mesure a Marrakech.",
  package: "Composez votre sejour avec appartement, transport, circuits et services.",
  general: "Parlons de votre projet a Marrakech.",
};

export const leadTypeTitles: Record<LeadRequestType, string> = {
  reservation: "Reserver un appartement",
  transport: "Demande de transport prive",
  chauffeur: "Demande de transport prive",
  proprietaire: "Confier mon bien a Yakout",
  vehicule: "Demander une solution transport",
  services: "Demander un service sur mesure",
  package: "Demander un pack sejour",
  general: "Contacter Yakout",
};

export const leadFormHelps: Record<LeadRequestType, string> = {
  reservation: "Indiquez vos dates et preferences. Nous vous proposerons les meilleures options disponibles.",
  transport: "Precisez votre trajet, date, passagers et bagages. Yakout vous proposera la solution adaptee.",
  chauffeur: "Precisez votre trajet, date, passagers et bagages. Yakout vous proposera la solution adaptee.",
  proprietaire: "Parlez-nous de votre bien. Nous vous recontacterons pour discuter de la meilleure formule.",
  vehicule: "Precisez votre besoin de deplacement. Yakout selectionne le vehicule adapte.",
  services: "Decrivez votre besoin. Nous organiserons votre experience sur mesure.",
  package: "Indiquez dates, voyageurs et options. Yakout vous proposera un pack ajuste.",
  general: "Une question, un projet ? Nous vous repondons sous 24h.",
};

export const leadTypeSubmitLabels: Record<LeadRequestType, string> = {
  reservation: "Envoyer ma demande de reservation",
  transport: "Demander mon transport prive",
  chauffeur: "Demander mon transport prive",
  proprietaire: "Envoyer ma demande proprietaire",
  vehicule: "Demander un transport prive",
  services: "Envoyer ma demande de service",
  package: "Demander ce pack",
  general: "Envoyer ma demande",
};

const legacyLeadTypeMap: Record<string, LeadRequestType> = {
  appartement: "reservation",
  "reservation appartement": "reservation",
  "chauffeur prive": "chauffeur",
  "transport prive": "transport",
  transport: "transport",
  "transfert aeroport": "transport",
  "vehicule partenaire": "transport",
  "vehicule avec chauffeur": "transport",
  proprietaire: "proprietaire",
  "confier mon bien": "proprietaire",
  "service touristique": "services",
  "services touristiques": "services",
  "services sur mesure": "services",
  tourisme: "services",
  package: "package",
  pack: "package",
  sejour: "package",
  "pack sejour": "package",
  general: "general",
  "demande generale": "general",
};

export function normalizeLeadRequestType(value: unknown): LeadRequestType {
  if (typeof value !== "string") return "general";
  const normalized = value.trim().toLowerCase();
  if ((leadRequestTypes as readonly string[]).includes(normalized)) return normalized as LeadRequestType;
  return legacyLeadTypeMap[normalized] ?? "general";
}

export function getLeadTypeLabel(value: unknown): string {
  return leadTypeLabels[normalizeLeadRequestType(value)];
}
