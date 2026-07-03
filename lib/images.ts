export const yakoutImages = {
  hero: "/images/yakout/yakout-hero-terrace.webp",
  ownerConcierge: "/images/yakout/yakout-conciergerie-proprietaire.webp",
  airportTransfer: "/images/yakout/yakout-transfert-aeroport.webp",
  apartmentPremium: "/images/yakout/yakout-appartement-premium.webp",
  skodaChauffeur: "/images/yakout/yakout-skoda-chauffeur.webp",
  brandMoroccanBg: "/images/yakout/yakout-brand-moroccan-bg-v2.webp",
} as const;

export const yakoutImagesFallback = {
  hero: "/images/yakout/yakout-hero-terrace.png",
  ownerConcierge: "/images/yakout/yakout-conciergerie-proprietaire.png",
  airportTransfer: "/images/yakout/yakout-transfert-aeroport.png",
  apartmentPremium: "/images/yakout/yakout-appartement-premium.png",
  skodaChauffeur: "/images/yakout/yakout-skoda-chauffeur.png",
  brandMoroccanBg: "/images/yakout/yakout-brand-moroccan-bg-v2.png",
} as const;

export const yakoutImageAlts = {
  hero: "Terrasse premium à Marrakech avec vue sur la ville",
  ownerConcierge: "Accueil premium et conciergerie immobilière à Marrakech",
  airportTransfer: "Transfert aéroport Marrakech avec chauffeur privé",
  apartmentPremium: "Appartement premium à Marrakech avec terrasse",
  skodaChauffeur: "Véhicule premium avec chauffeur privé à Marrakech",
} as const;

export const fallbackImages = {
  hero: { url: yakoutImages.hero, alt: yakoutImageAlts.hero },
  apartment: { url: yakoutImages.apartmentPremium, alt: yakoutImageAlts.apartmentPremium },
  vehicle: { url: yakoutImages.skodaChauffeur, alt: yakoutImageAlts.skodaChauffeur },
  chauffeur: { url: yakoutImages.airportTransfer, alt: yakoutImageAlts.airportTransfer },
  concierge: { url: yakoutImages.ownerConcierge, alt: yakoutImageAlts.ownerConcierge },
  contact: { url: yakoutImages.ownerConcierge, alt: yakoutImageAlts.ownerConcierge },
  blog: { url: yakoutImages.hero, alt: yakoutImageAlts.hero },
} as const;
