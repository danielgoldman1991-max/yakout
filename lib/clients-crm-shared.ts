export const clientStatuses = [
  "new",
  "active",
  "vip",
  "to_follow_up",
  "waiting_reply",
  "booked",
  "completed",
  "review_requested",
  "review_received",
  "inactive",
  "attention",
] as const;

export type ClientStatus = (typeof clientStatuses)[number];

export const clientStatusLabels: Record<string, string> = {
  new: "Nouveau",
  active: "Actif",
  vip: "VIP",
  to_follow_up: "A relancer",
  waiting_reply: "En attente reponse",
  booked: "Reservation en cours",
  completed: "Sejour termine",
  review_requested: "Avis demande",
  review_received: "Avis recu",
  inactive: "Inactif",
  attention: "Attention",
};

export const clientTypeLabels: Record<string, string> = {
  voyageur: "Voyageur",
  famille: "Famille",
  vip: "Client VIP",
  business: "Business",
  recurring: "Client recurrent",
  owner: "Proprietaire",
  partner: "Partenaire",
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: "whatsapp" | "email";
  category: string;
  subject?: string;
  body: string;
};

export const yakoutMessageTemplates: MessageTemplate[] = [
  {
    id: "general-first-response",
    name: "Premiere reponse",
    channel: "whatsapp",
    category: "demande",
    body: "Bonjour {{client_name}}, merci pour votre message. Yakout a bien recu votre demande et revient vers vous rapidement avec une proposition adaptee.",
  },
  {
    id: "owner-property",
    name: "Confier mon bien",
    channel: "whatsapp",
    category: "proprietaire",
    body: "Bonjour {{client_name}}, merci pour votre interet. Nous pouvons vous accompagner pour la gestion et la location courte duree de votre bien a Marrakech. Pouvez-vous nous partager l'adresse approximative, le type de bien et quelques photos ?",
  },
  {
    id: "apartment-booking",
    name: "Reservation appartement",
    channel: "whatsapp",
    category: "reservation",
    body: "Bonjour {{client_name}}, merci pour votre demande. Pouvez-vous nous confirmer vos dates de sejour, le nombre de personnes et le quartier souhaite a Marrakech ?",
  },
  {
    id: "driver-transfer",
    name: "Chauffeur / transfert",
    channel: "whatsapp",
    category: "transport",
    body: "Bonjour {{client_name}}, merci pour votre demande. Pouvez-vous nous confirmer la date, l'heure, le lieu de prise en charge, la destination et le nombre de passagers ?",
  },
  {
    id: "vehicle-driver",
    name: "Vehicule avec chauffeur",
    channel: "whatsapp",
    category: "transport",
    body: "Bonjour {{client_name}}, merci pour votre demande. Nous pouvons vous proposer un vehicule adapte. Pouvez-vous nous confirmer le trajet, la date, l'horaire et le nombre de passagers ?",
  },
  {
    id: "tailor-made-services",
    name: "Services sur mesure",
    channel: "whatsapp",
    category: "services",
    body: "Bonjour {{client_name}}, merci pour votre message. Pouvez-vous nous preciser le type de service souhaite, la date et vos besoins exacts ?",
  },
  {
    id: "follow-up",
    name: "Relance apres demande",
    channel: "whatsapp",
    category: "relance",
    body: "Bonjour {{client_name}}, je me permets de revenir vers vous concernant votre demande Yakout. Souhaitez-vous que nous preparions une proposition ?",
  },
  {
    id: "review-request",
    name: "Demande d'avis",
    channel: "whatsapp",
    category: "avis",
    body: "Bonjour {{client_name}}, nous esperons que votre experience avec Yakout s'est bien passee. Votre avis nous aiderait beaucoup. Merci pour votre confiance.",
  },
  {
    id: "email-confirmation",
    name: "Email confirmation reservation",
    channel: "email",
    category: "reservation",
    subject: "Votre demande Yakout",
    body: "Bonjour {{client_name}},\n\nNous avons bien recu votre demande {{service_type}}. L'equipe Yakout revient vers vous avec les informations utiles.\n\nBien cordialement,\n{{company_name}}",
  },
];

export function normalizePhoneForLink(phone?: string | null) {
  return (phone ?? "").replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function buildWhatsAppUrl(phone: string | undefined, message: string) {
  const normalized = normalizePhoneForLink(phone);
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(email: string | undefined, subject: string, body: string) {
  if (!email) return "";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function renderTemplate(
  template: string,
  values: Record<string, string | undefined>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}
