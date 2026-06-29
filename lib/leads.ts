export const leadRequestTypes = ["reservation", "chauffeur", "proprietaire", "vehicule", "services", "general"] as const;

export type LeadRequestType = (typeof leadRequestTypes)[number];

export const leadTypeLabels: Record<LeadRequestType, string> = {
  reservation: "Réservation appartement",
  chauffeur: "Chauffeur / transfert",
  proprietaire: "Confier mon bien",
  vehicule: "Véhicule avec chauffeur",
  services: "Services sur mesure",
  general: "Demande générale",
};

export const leadTypeDescriptions: Record<LeadRequestType, string> = {
  reservation: "Réservez l'appartement idéal pour votre séjour à Marrakech.",
  chauffeur: "Réservez votre chauffeur privé pour vos déplacements à Marrakech.",
  proprietaire: "Confiez votre appartement à Yakout et maximisez vos revenus.",
  vehicule: "Demandez un véhicule avec chauffeur adapté à votre trajet.",
  services: "Organisez vos services sur mesure à Marrakech.",
  general: "Parlons de votre projet à Marrakech.",
};

export const leadTypePlaceholders: Record<LeadRequestType, string> = {
  reservation: "Bonjour Yakout, je souhaite réserver un appartement à Marrakech. Pouvez-vous me contacter ?",
  chauffeur: "Bonjour Yakout, je souhaite réserver un chauffeur à Marrakech. Pouvez-vous me contacter ?",
  proprietaire: "Bonjour Yakout, je souhaite confier mon appartement à Marrakech. Pouvez-vous me contacter ?",
  vehicule: "Bonjour Yakout, je souhaite réserver un véhicule avec chauffeur à Marrakech. Pouvez-vous me contacter ?",
  services: "Bonjour Yakout, je souhaite organiser des services sur mesure à Marrakech. Pouvez-vous me contacter ?",
  general: "Bonjour Yakout, je souhaite vous envoyer une demande. Pouvez-vous me contacter ?",
};

const legacyLeadTypeMap: Record<string, LeadRequestType> = {
  appartement: "reservation",
  "réservation appartement": "reservation",
  "reservation appartement": "reservation",
  "chauffeur privé": "chauffeur",
  "chauffeur prive": "chauffeur",
  "transfert aeroport": "chauffeur",
  "transfert aéroport": "chauffeur",
  "véhicule partenaire": "vehicule",
  "vehicule partenaire": "vehicule",
  "véhicule avec chauffeur": "vehicule",
  "vehicule avec chauffeur": "vehicule",
  proprietaire: "proprietaire",
  propriétaire: "proprietaire",
  "confier mon bien": "proprietaire",
  "service touristique": "services",
  "services touristiques": "services",
  "services sur mesure": "services",
  tourisme: "services",
  general: "general",
  "demande générale": "general",
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
