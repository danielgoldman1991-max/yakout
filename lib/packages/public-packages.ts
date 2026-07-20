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
  "sejour-marrakech": {
    styleTags: ["Séjour"],
    servicesCount: 3,
    levelLabel: "Séjour à Marrakech",
    idealFor: "Un séjour avec hébergement et accompagnement local.",
    image: yakoutImages.apartmentPremium,
    imageAlt: yakoutImageAlts.apartmentPremium,
    flow: ["Hébergement sélectionné", "Assistance WhatsApp", "Services sur demande"],
  },
  "sejour-chauffeur-prive": {
    styleTags: ["Séjour", "Mobilité"],
    servicesCount: 4,
    levelLabel: "Avec chauffeur privé",
    idealFor: "Des déplacements planifiés avec un interlocuteur unique.",
    image: yakoutImages.skodaChauffeur,
    imageAlt: yakoutImageAlts.skodaChauffeur,
    flow: ["Hébergement sélectionné", "Transfert aéroport", "Chauffeur selon le programme", "Assistance WhatsApp"],
  },
  "escapade-marrakech": {
    styleTags: ["Escapade"],
    servicesCount: 4,
    levelLabel: "Escapade Marrakech",
    idealFor: "Un séjour court organisé selon vos dates et vos priorités.",
    image: yakoutImages.hero,
    imageAlt: yakoutImageAlts.hero,
    flow: ["Hébergement sélectionné", "Transport planifié", "Activités sur demande", "Assistance locale"],
  },
  "pack-personnalise": {
    styleTags: ["Sur mesure"],
    servicesCount: 4,
    levelLabel: "Pack personnalisé",
    idealFor: "Une proposition construite selon vos dates, voyageurs et besoins.",
    image: yakoutImages.ownerConcierge,
    imageAlt: yakoutImageAlts.ownerConcierge,
    flow: ["Étude de la demande", "Sélection des services", "Proposition adaptée", "Confirmation des disponibilités"],
  },
};

export const fallbackPublicPackages: Package[] = [
  createFallbackPackage({
    slug: "sejour-marrakech",
    title: "Séjour à Marrakech",
    type: "stay",
    shortDescription: "Hébergement sélectionné à Marrakech et assistance pendant votre séjour.",
    price: null,
    items: ["Hébergement sélectionné", "Assistance WhatsApp", "Services complémentaires sur demande"],
  }),
  createFallbackPackage({
    slug: "sejour-chauffeur-prive",
    title: "Séjour avec chauffeur privé",
    type: "stay",
    shortDescription: "Hébergement, transfert aéroport et déplacements planifiés selon votre programme.",
    price: null,
    items: ["Hébergement sélectionné", "Transfert privé depuis l’aéroport", "Chauffeur selon le programme", "Assistance WhatsApp"],
  }),
  createFallbackPackage({
    slug: "escapade-marrakech",
    title: "Escapade Marrakech",
    type: "short_stay",
    shortDescription: "Un séjour court avec transport et organisation d’activités sur demande.",
    price: null,
    items: ["Hébergement sélectionné", "Transport planifié", "Organisation d’activités sur demande", "Assistance locale"],
  }),
  createFallbackPackage({
    slug: "pack-personnalise",
    title: "Pack personnalisé",
    type: "custom",
    shortDescription: "Une offre construite selon vos dates, le nombre de voyageurs et les services demandés.",
    price: null,
    items: ["Étude de votre demande", "Sélection des services", "Proposition adaptée", "Confirmation des disponibilités"],
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
      duration_label: pack.duration_label,
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
  duration?: string;
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
