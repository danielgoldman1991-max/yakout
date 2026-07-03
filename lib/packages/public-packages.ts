import type { Package, PackageItem } from "@/types/business";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export type PublicPackageModel = Package & {
  styleTags: string[];
  servicesCount: number;
  levelLabel: string;
  idealFor: string;
  displayImage: string;
  displayImageAlt: string;
  flow: string[];
};

type PackageMeta = {
  styleTags: string[];
  servicesCount: number;
  levelLabel: string;
  idealFor: string;
  image: string;
  imageAlt: string;
  flow: string[];
};

const metaBySlug: Record<string, PackageMeta> = {
  "essentiel-arrivee": {
    styleTags: ["Court sejour", "Essentiel"],
    servicesCount: 2,
    levelLabel: "Arrivee simple",
    idealFor: "Vous avez deja le logement et voulez une arrivee fluide.",
    image: yakoutImages.airportTransfer,
    imageAlt: yakoutImageAlts.airportTransfer,
    flow: ["Accueil aeroport", "Trajet prive", "Assistance WhatsApp"],
  },
  "sejour-confort-marrakech": {
    styleTags: ["Couple", "Famille", "Sejour complet"],
    servicesCount: 3,
    levelLabel: "Sejour confort",
    idealFor: "Couple ou petite famille qui veut un sejour simple a coordonner.",
    image: yakoutImages.apartmentPremium,
    imageAlt: yakoutImageAlts.apartmentPremium,
    flow: ["Appartement choisi", "Transfert aller", "Assistance sejour", "Transfert retour"],
  },
  "decouverte-marrakech": {
    styleTags: ["Decouverte", "Couple", "Famille"],
    servicesCount: 4,
    levelLabel: "Decouverte accompagnee",
    idealFor: "Premier sejour a Marrakech avec une decouverte accompagnee.",
    image: yakoutImages.hero,
    imageAlt: yakoutImageAlts.hero,
    flow: ["Installation", "Transfert", "Chauffeur demi-journee", "City tour"],
  },
  "ourika-evasion": {
    styleTags: ["Nature", "Famille", "Decouverte"],
    servicesCount: 4,
    levelLabel: "Decouverte accompagnee",
    idealFor: "Famille, couple ou sejour nature autour de Marrakech.",
    image: yakoutImages.brandMoroccanBg,
    imageAlt: "Atmosphere marocaine premium pour un circuit nature",
    flow: ["Appartement", "Transfert", "Chauffeur prive", "Vallee de l'Ourika"],
  },
  "agafay-sunset-premium": {
    styleTags: ["Premium", "Couple", "Sejour complet"],
    servicesCount: 5,
    levelLabel: "Experience premium",
    idealFor: "Sejour romantique, anniversaire ou moment premium.",
    image: yakoutImages.skodaChauffeur,
    imageAlt: yakoutImageAlts.skodaChauffeur,
    flow: ["Appartement", "SUV chauffeur", "Agafay sunset", "Services premium"],
  },
  "marrakech-full-experience": {
    styleTags: ["Premium", "Famille", "Sejour complet"],
    servicesCount: 5,
    levelLabel: "Sejour complet",
    idealFor: "Client qui veut un sejour cle en main, flexible et complet.",
    image: yakoutImages.ownerConcierge,
    imageAlt: yakoutImageAlts.ownerConcierge,
    flow: ["Appartement premium", "Transferts", "Chauffeur journee", "Circuit", "Services a la carte"],
  },
  "sur-mesure": {
    styleTags: ["Sur mesure", "Premium", "Sejour complet"],
    servicesCount: 5,
    levelLabel: "Sur mesure",
    idealFor: "Vous partez d'une idee et Yakout compose la combinaison exacte.",
    image: yakoutImages.hero,
    imageAlt: yakoutImageAlts.hero,
    flow: ["Brief", "Selection", "Ajustements", "Confirmation"],
  },
};

export const fallbackPublicPackages: Package[] = [
  createFallbackPackage({
    slug: "essentiel-arrivee",
    title: "Essentiel Arrivee",
    type: "arrival",
    shortDescription: "Transfert aeroport et assistance WhatsApp pour demarrer le sejour sans friction.",
    duration: "Arrivee",
    price: null,
    items: ["Transfert aeroport", "Assistance WhatsApp sejour"],
  }),
  createFallbackPackage({
    slug: "sejour-confort-marrakech",
    title: "Sejour Confort Marrakech",
    type: "stay",
    shortDescription: "Appartement selectionne, transfert aller-retour et assistance pendant le sejour.",
    duration: "3 a 5 nuits",
    price: null,
    items: ["Appartement selectionne", "Transfert aeroport aller-retour", "Assistance sejour"],
  }),
  createFallbackPackage({
    slug: "decouverte-marrakech",
    title: "Decouverte Marrakech",
    type: "discovery",
    shortDescription: "Appartement, transfert, chauffeur demi-journee et city tour pour une premiere experience claire.",
    duration: "3 jours",
    price: null,
    items: ["Appartement", "Transfert aeroport", "Chauffeur demi-journee", "Marrakech City Tour"],
  }),
  createFallbackPackage({
    slug: "ourika-evasion",
    title: "Ourika Evasion",
    type: "nature",
    shortDescription: "Appartement, chauffeur prive, circuit Ourika et assistance pour respirer hors de la ville.",
    duration: "4 jours",
    price: null,
    items: ["Appartement", "Transfert aeroport", "Vehicule avec chauffeur", "Circuit Vallee de l'Ourika"],
  }),
  createFallbackPackage({
    slug: "agafay-sunset-premium",
    title: "Agafay Sunset Premium",
    type: "premium",
    shortDescription: "Appartement, SUV avec chauffeur, sunset Agafay et services premium pour un sejour signature.",
    duration: "4 a 6 nuits",
    price: null,
    items: ["Appartement", "Transfert aeroport", "SUV avec chauffeur", "Experience Agafay Sunset", "Assistance premium"],
  }),
  createFallbackPackage({
    slug: "marrakech-full-experience",
    title: "Marrakech Full Experience",
    type: "signature",
    shortDescription: "Appartement premium, transfert, chauffeur journee, circuit et services a la carte.",
    duration: "5 a 7 nuits",
    price: null,
    items: ["Appartement premium", "Transfert aeroport aller-retour", "Chauffeur journee", "Circuit Ourika ou Agafay", "Services personnalises"],
  }),
];

export function enrichPublicPackages(packages: Package[]): PublicPackageModel[] {
  return packages.map((pack) => {
    const meta = metaBySlug[pack.slug] ?? inferPackageMeta(pack);
    const items = pack.package_items ?? [];
    return {
      ...pack,
      styleTags: meta.styleTags,
      servicesCount: meta.servicesCount || Math.max(items.filter((item) => !item.is_optional).length, 1),
      levelLabel: meta.levelLabel,
      idealFor: meta.idealFor,
      displayImage: pack.image_url || meta.image,
      displayImageAlt: pack.image_alt_text || meta.imageAlt,
      duration_label: pack.duration_label || "Duree sur mesure",
      flow: meta.flow,
    };
  });
}

function inferPackageMeta(pack: Package): PackageMeta {
  const itemsCount = Math.max(pack.package_items?.filter((item) => !item.is_optional).length ?? 0, 1);
  const tags = itemsCount >= 5 ? ["Premium", "Sejour complet"] : itemsCount >= 4 ? ["Decouverte", "Famille"] : ["Court sejour"];
  return {
    styleTags: tags,
    servicesCount: itemsCount,
    levelLabel: itemsCount >= 6 ? "Sejour complet" : itemsCount >= 5 ? "Experience premium" : itemsCount >= 4 ? "Decouverte accompagnee" : itemsCount >= 3 ? "Sejour confort" : "Arrivee simple",
    idealFor: "Client qui souhaite une combinaison claire et ajustable.",
    image: yakoutImages.hero,
    imageAlt: yakoutImageAlts.hero,
    flow: (pack.package_items ?? []).slice(0, 5).map((item) => item.title),
  };
}

function createFallbackPackage(input: {
  slug: string;
  title: string;
  type: string;
  shortDescription: string;
  duration: string;
  price: number | null;
  items: string[];
}): Package {
  return {
    id: `fallback-${input.slug}`,
    title: input.title,
    public_title: input.title,
    slug: input.slug,
    package_type: input.type,
    short_description: input.shortDescription,
    description: `${input.shortDescription}\n\nChaque element peut etre ajuste selon vos dates, votre rythme et votre niveau de confort.`,
    destination: "Marrakech",
    duration_label: input.duration,
    capacity_min: 1,
    capacity_max: 6,
    price_from: input.price ?? undefined,
    currency: "MAD",
    public_status: "published",
    is_featured: true,
    package_items: input.items.map((title, index) => createFallbackItem(input.slug, title, index)),
  };
}

function createFallbackItem(slug: string, title: string, index: number): PackageItem {
  return {
    id: `fallback-${slug}-${index}`,
    package_id: `fallback-${slug}`,
    item_type: title.toLowerCase().includes("appartement") ? "apartment" : title.toLowerCase().includes("chauffeur") || title.toLowerCase().includes("suv") ? "vehicle" : title.toLowerCase().includes("circuit") || title.toLowerCase().includes("ourika") || title.toLowerCase().includes("agafay") ? "experience" : "service",
    title,
    description: "Inclus dans le modele, personnalisable selon votre sejour.",
    quantity: 1,
    unit_label: "service",
    sort_order: index + 1,
    is_optional: false,
  };
}
