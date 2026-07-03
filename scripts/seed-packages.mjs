import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const companyId = process.env.YAKOUT_COMPANY_ID || "00000000-0000-0000-0000-000000000001";

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const image = {
  transfer: "/images/yakout/yakout-transfert-aeroport.webp",
  apartment: "/images/yakout/yakout-appartement-premium.webp",
  terrace: "/images/yakout/yakout-hero-terrace.webp",
  moroccan: "/images/yakout/yakout-brand-moroccan-bg-v2.webp",
  chauffeur: "/images/yakout/yakout-skoda-chauffeur.webp",
  concierge: "/images/yakout/yakout-conciergerie-proprietaire.webp",
};

const packs = [
  {
    title: "Essentiel Arrivee",
    slug: "essentiel-arrivee",
    package_type: "arrival",
    short_description: "Transfert aeroport et assistance WhatsApp pour une arrivee fluide a Marrakech.",
    description: "Ideal si vous avez deja votre logement mais souhaitez une prise en charge claire des votre arrivee.",
    duration_label: "Arrivee",
    capacity_min: 1,
    capacity_max: 6,
    price_from: null,
    image_url: image.transfer,
    image_alt_text: "Transfert aeroport Marrakech avec chauffeur prive",
    items: ["Transfert aeroport", "Assistance WhatsApp sejour"],
  },
  {
    title: "Sejour Confort Marrakech",
    slug: "sejour-confort-marrakech",
    package_type: "stay",
    short_description: "Appartement selectionne, transfert aller-retour et assistance pendant le sejour.",
    description: "Une base confortable pour couple ou petite famille, avec les essentiels organises par Yakout.",
    duration_label: "3 a 5 nuits",
    capacity_min: 2,
    capacity_max: 5,
    price_from: null,
    image_url: image.apartment,
    image_alt_text: "Appartement premium a Marrakech avec terrasse",
    items: ["Appartement selectionne", "Transfert aeroport aller-retour", "Assistance sejour"],
  },
  {
    title: "Decouverte Marrakech",
    slug: "decouverte-marrakech",
    package_type: "discovery",
    short_description: "Appartement, transfert, chauffeur demi-journee et Marrakech City Tour.",
    description: "Le pack clair pour un premier sejour a Marrakech avec decouverte accompagnee.",
    duration_label: "3 jours",
    capacity_min: 2,
    capacity_max: 6,
    price_from: null,
    image_url: image.terrace,
    image_alt_text: "Terrasse premium a Marrakech avec vue sur la ville",
    items: ["Appartement", "Transfert aeroport", "Chauffeur demi-journee", "Marrakech City Tour"],
  },
  {
    title: "Ourika Evasion",
    slug: "ourika-evasion",
    package_type: "nature",
    short_description: "Appartement, chauffeur, circuit Ourika et assistance pour une escapade nature.",
    description: "Un sejour equilibre entre confort a Marrakech et sortie dans la Vallee de l'Ourika.",
    duration_label: "4 jours",
    capacity_min: 2,
    capacity_max: 6,
    price_from: null,
    image_url: image.moroccan,
    image_alt_text: "Atmosphere marocaine premium pour un circuit nature",
    items: ["Appartement", "Transfert aeroport", "Vehicule avec chauffeur", "Circuit Vallee de l'Ourika"],
  },
  {
    title: "Agafay Sunset Premium",
    slug: "agafay-sunset-premium",
    package_type: "premium",
    short_description: "Appartement, SUV avec chauffeur, Agafay sunset et services premium.",
    description: "Une experience signature pour sejour romantique, anniversaire ou moment premium.",
    duration_label: "4 a 6 nuits",
    capacity_min: 2,
    capacity_max: 4,
    price_from: null,
    image_url: image.chauffeur,
    image_alt_text: "SUV avec chauffeur prive a Marrakech",
    items: ["Appartement", "Transfert aeroport", "SUV avec chauffeur", "Experience Agafay Sunset", "Assistance premium"],
  },
  {
    title: "Marrakech Full Experience",
    slug: "marrakech-full-experience",
    package_type: "signature",
    short_description: "Appartement premium, transfert, chauffeur journee, circuit et services a la carte.",
    description: "Le sejour cle en main pour profiter de Marrakech sans gerer la coordination.",
    duration_label: "5 a 7 nuits",
    capacity_min: 2,
    capacity_max: 8,
    price_from: null,
    image_url: image.concierge,
    image_alt_text: "Accueil premium et conciergerie a Marrakech",
    items: ["Appartement premium", "Transfert aeroport aller-retour", "Chauffeur journee", "Circuit Ourika ou Agafay", "Services personnalises"],
  },
];

for (const pack of packs) {
  const { items, ...payload } = pack;
  const { data, error } = await supabase
    .from("packages")
    .upsert(
      {
        ...payload,
        company_id: companyId,
        public_title: pack.title,
        destination: "Marrakech",
        currency: "MAD",
        public_status: "published",
        is_featured: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error(`Pack ${pack.slug}:`, error?.message ?? "id introuvable");
    continue;
  }

  await supabase.from("package_items").delete().eq("package_id", data.id);

  const itemPayload = items.map((title, index) => ({
    package_id: data.id,
    item_type: itemType(title),
    title,
    description: "Inclus dans le modele, personnalisable selon vos dates.",
    quantity: 1,
    unit_label: "service",
    price_amount: null,
    sort_order: index + 1,
    is_optional: false,
  }));

  const { error: itemError } = await supabase.from("package_items").insert(itemPayload);
  if (itemError) console.error(`Items ${pack.slug}:`, itemError.message);
  else console.log(`OK ${pack.slug}`);
}

function itemType(title) {
  const value = title.toLowerCase();
  if (value.includes("appartement")) return "apartment";
  if (value.includes("transfert")) return "transfer";
  if (value.includes("chauffeur") || value.includes("suv") || value.includes("vehicule")) return "vehicle";
  if (value.includes("circuit") || value.includes("ourika") || value.includes("agafay") || value.includes("tour")) return "experience";
  return "service";
}
