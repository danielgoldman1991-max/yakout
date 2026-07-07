import type { Apartment, Client, Expense, Payment, Reservation, Trip, Vehicle } from "@/types/business";
import type { BlogPost, PublicService, SitePage, SiteSettings } from "@/types/cms";
import { yakoutImages } from "@/lib/images";

export const siteSettings: SiteSettings = {
  company_name: "Yakout Conciergerie et Services",
  slogan: "Conciergerie premium Ã  Marrakech",
  phone: "+212 6 66 56 71 33",
  whatsapp: "+212666567133",
  email: "contact@yakout.ma",
  address: "Marrakech, Maroc",
  instagram: "https://instagram.com/yakoutconciergerie",
  facebook: "https://facebook.com/yakoutconciergerie",
};

export const sitePages: SitePage[] = [
  {
    id: "home",
    slug: "accueil",
    title: "Yakout Conciergerie et Services",
    subtitle: "Appartements, chauffeur privÃ© et services touristiques premium Ã  Marrakech.",
    content: "Yakout accompagne propriÃ©taires, voyageurs et clients premium avec une gestion exigeante, humaine et centralisÃ©e.",
    primary_button_text: "Demander un service",
    primary_button_url: "/contact",
    secondary_button_text: "Voir les appartements",
    secondary_button_url: "/apartments",
    status: "published",
    meta_title: "Yakout Conciergerie Marrakech",
    meta_description: "Conciergerie, appartements, chauffeur privÃ© et expÃ©riences touristiques Ã  Marrakech.",
  },
];

export const services: PublicService[] = [
  { id: "service-1", title: "Location d'appartements Ã  Marrakech", slug: "location-appartements-marrakech", short_description: "SÃ©lection et gestion d'appartements Ã©quipÃ©s pour courts sÃ©jours.", description: "Publication, accueil voyageurs, coordination mÃ©nage et suivi opÃ©rationnel.", price_from: 700, icon: "Building2", is_published: true, display_order: 1 },
  { id: "service-2", title: "Conciergerie propriÃ©taire", slug: "conciergerie-proprietaire", short_description: "Confiez votre bien Ã  une Ã©quipe locale structurÃ©e.", description: "Suivi des rÃ©servations, maintenance, mÃ©nage, reporting et optimisation.", price_from: 0, icon: "KeyRound", is_published: true, display_order: 2 },
  { id: "service-3", title: "Chauffeur privÃ©", slug: "chauffeur-prive", short_description: "Vehicule avec chauffeur adapte pour transferts, excursions et mise a disposition.", description: "Trajets premium, ponctualite, confort et discretion.", price_from: 300, icon: "Car", is_published: true, display_order: 3 },
  { id: "service-4", title: "Transfert aÃ©roport", slug: "transfert-aeroport", short_description: "Accueil et transfert depuis l'aÃ©roport Marrakech Menara.", description: "Prise en charge avec panneau nominatif, confort et ponctualitÃ©.", price_from: 250, icon: "Plane", is_published: true, display_order: 4 },
  { id: "service-5", title: "VÃ©hicules partenaires", slug: "vehicules-partenaires", short_description: "MobilitÃ© flexible avec nos partenaires fiables.", description: "VÃ©hicules avec chauffeurs partenaires sÃ©lectionnÃ©s.", price_from: 400, icon: "Bus", is_published: true, display_order: 5 },
  { id: "service-6", title: "Services touristiques", slug: "services-touristiques", short_description: "Excursions et expÃ©riences premium autour de Marrakech.", description: "Circuits personnalisÃ©s, activitÃ©s et dÃ©couvertes.", price_from: 500, icon: "Star", is_published: true, display_order: 6 },
];

export const apartments: Apartment[] = [
  {
    id: "00000000-0000-0000-0000-000000000101", internal_name: "Majorelle Signature", public_name: "Appartement Majorelle Signature", slug: "appartement-majorelle-signature",
    district: "Majorelle", city: "Marrakech", property_type: "apartment", bedrooms: 2, bathrooms: 2, beds: 2, capacity: 4, price_from: 950, price_per_night: 950, currency: "MAD",
    cleaning_fee: 250, deposit_amount: 500, minimum_nights: 2, commission_rate: 20,
    short_description: "Appartement lumineux à deux pas du Jardin Majorelle. Calme, design et entièrement équipé.",
    detailed_description: "Séjournez dans cet appartement raffiné situé dans le quartier Majorelle, l'un des plus prisés de Marrakech. À quelques minutes à pied du célèbre jardin, vous profiterez d'un espace lumineux et calme, idéal pour un couple ou une famille. L'appartement dispose de deux chambres climatisées, d'un salon spacieux, d'une cuisine équipée et d'une salle de bain moderne.",
    highlights: ["Quartier Majorelle prisé", "Idéal couple ou famille", "Lumineux et calme", "Proche commodités"],
    amenities: ["Wi-Fi", "Climatisation", "Cuisine équipée", "Machine à laver", "Télévision", "Sèche-cheveux"],
    house_rules: ["Non-fumeur", "Pas de fête", "Respect du voisinage", "Check-in après 15h"],
    image_url: "/images/yakout/apartments/majorelle-signature.png",
    image_alt_text: "Salon de l'Appartement Majorelle Signature",
    is_published: true, is_featured: true, public_status: "published", management_status: "active_management",
    check_in_time: "15:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000102", internal_name: "Suite Urbaine Guéliz", public_name: "Suite Urbaine Guéliz", slug: "suite-urbaine-gueliz",
    district: "Guéliz", city: "Marrakech", property_type: "apartment", bedrooms: 1, bathrooms: 1, beds: 1, capacity: 2, price_from: 650, price_per_night: 650, currency: "MAD",
    cleaning_fee: 200, deposit_amount: 300, minimum_nights: 1, commission_rate: 20,
    short_description: "Studio moderne en plein coeur de Guéliz. Parfait pour un court séjour professionnel ou touristique.",
    detailed_description: "Une suite moderne et fonctionnelle au coeur du quartier Guéliz, le centre névralgique de Marrakech. Commerces, restaurants et attractions à portée de main. Ce studio tout équipé est idéal pour les voyageurs d'affaires ou les couples souhaitant explorer la ville.",
    highlights: ["Centre-ville Guéliz", "Proche restaurants et commerces", "Idéal court séjour", "Fonctionnel et moderne"],
    amenities: ["Wi-Fi", "Climatisation", "Kitchenette", "Télévision"],
    house_rules: ["Non-fumeur", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/suite-urbaine-gueliz.png",
    image_alt_text: "Suite Urbaine Guéliz",
    is_published: true, is_featured: false, public_status: "published", management_status: "active_management",
    check_in_time: "14:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000103", internal_name: "Hivernage Élégance", public_name: "Appartement Hivernage Élégance", slug: "appartement-hivernage-elegance",
    district: "Hivernage", city: "Marrakech", property_type: "apartment", bedrooms: 2, bathrooms: 2, beds: 2, capacity: 4, price_from: 1200, price_per_night: 1200, currency: "MAD",
    cleaning_fee: 300, deposit_amount: 800, minimum_nights: 2, commission_rate: 20,
    short_description: "Bel appartement dans le quartier résidentiel Hivernage. Piscine et jardin privés.",
    detailed_description: "Découvrez le charme du quartier Hivernage dans cet appartement élégant avec accès à une piscine et un jardin paysager. Quartier résidentiel calme et sécurisé, à proximité du centre-ville et des principales attractions de Marrakech.",
    highlights: ["Quartier Hivernage résidentiel", "Piscine et jardin", "Calme et sécurisé", "Proche centre-ville"],
    amenities: ["Wi-Fi", "Climatisation", "Piscine", "Jardin", "Cuisine équipée", "Parking"],
    house_rules: ["Non-fumeur", "Pas de fête", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/hivernage-elegance.png",
    image_alt_text: "Appartement Hivernage Élégance",
    is_published: true, is_featured: true, public_status: "published", management_status: "active_management",
    check_in_time: "15:00", check_out_time: "12:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000104", internal_name: "Penthouse Terrasse M Avenue", public_name: "Penthouse Terrasse M Avenue", slug: "penthouse-terrasse-m-avenue",
    district: "M Avenue", city: "Marrakech", property_type: "penthouse", bedrooms: 2, bathrooms: 2, beds: 3, capacity: 5, price_from: 1600, price_per_night: 1600, currency: "MAD",
    cleaning_fee: 400, deposit_amount: 1000, minimum_nights: 3, commission_rate: 20,
    short_description: "Penthouse exceptionnel avec terrasse panoramique sur l'avenue Mohammed VI.",
    detailed_description: "Un penthouse d'exception sur l'avenue la plus prestigieuse de Marrakech. Terrasse panoramique avec vue imprenable, décoration soignée et prestations haut de gamme. Le choix idéal pour un séjour luxueux en plein coeur de la ville.",
    highlights: ["Terrasse panoramique", "Avenue Mohammed VI", "Prestations haut de gamme", "Vue imprenable"],
    amenities: ["Wi-Fi", "Climatisation", "Terrasse", "Cuisine équipée", "Machine à laver", "Télévision", "Ascenseur"],
    house_rules: ["Non-fumeur", "Pas de fête", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/penthouse-m-avenue.png",
    image_alt_text: "Penthouse Terrasse M Avenue",
    is_published: true, is_featured: true, public_status: "published", management_status: "active_management",
    check_in_time: "15:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000105", internal_name: "Riad Médina", public_name: "Appartement Riad Médina", slug: "appartement-riad-medina",
    district: "Médina", city: "Marrakech", property_type: "riad", bedrooms: 1, bathrooms: 1, beds: 2, capacity: 3, price_from: 750, price_per_night: 750, currency: "MAD",
    cleaning_fee: 200, deposit_amount: 400, minimum_nights: 2, commission_rate: 20,
    short_description: "Appartement de charme dans un riad traditionnel au coeur de la Médina de Marrakech.",
    detailed_description: "Plongez dans l'authenticité marrakchie avec cet appartement situé dans un riad traditionnel de la Médina. À quelques pas des souks animés et de la place Jemaa el-Fna, vous apprécierez le calme de ce havre de paix au coeur de l'agitation.",
    highlights: ["Coeur de la Médina", "Proche souks et Jemaa el-Fna", "Authentique et calme", "Décoration traditionnelle"],
    amenities: ["Wi-Fi", "Climatisation", "Terrasse", "Cuisine équipée"],
    house_rules: ["Non-fumeur", "Respect du voisinage", "Pas de bruit après 22h"],
    image_url: "/images/yakout/apartments/riad-medina.png",
    image_alt_text: "Appartement Riad Médina",
    is_published: true, is_featured: false, public_status: "published", management_status: "active_management",
    check_in_time: "14:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000106", internal_name: "Palmeraie Prestige", public_name: "Résidence Palmeraie Prestige", slug: "residence-palmeraie-prestige",
    district: "Palmeraie", city: "Marrakech", property_type: "villa", bedrooms: 3, bathrooms: 3, beds: 4, capacity: 6, price_from: 1800, price_per_night: 1800, currency: "MAD",
    cleaning_fee: 500, deposit_amount: 1500, minimum_nights: 3, commission_rate: 20,
    short_description: "Villa de prestige en pleine Palmeraie avec piscine privée et grand jardin.",
    detailed_description: "Une résidence d'exception située au coeur de la Palmeraie de Marrakech. Cette villa offre un cadre verdoyant avec piscine privée, jardin luxuriant et espaces de vie généreux. Idéale pour des séjours en famille ou entre amis, alliant confort moderne et sérénité.",
    highlights: ["Palmeraie de Marrakech", "Piscine privée", "Grand jardin", "Idéal famille ou groupe"],
    amenities: ["Wi-Fi", "Climatisation", "Piscine privée", "Jardin", "Cuisine équipée", "Parking", "Machine à laver"],
    house_rules: ["Non-fumeur", "Pas de fête sans accord", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/palmeraie-prestige.png",
    image_alt_text: "Résidence Palmeraie Prestige",
    is_published: true, is_featured: true, public_status: "published", management_status: "active_management",
    check_in_time: "15:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000107", internal_name: "Agdal Moderne", public_name: "Appartement Moderne Agdal", slug: "appartement-moderne-agdal",
    district: "Agdal", city: "Marrakech", property_type: "apartment", bedrooms: 2, bathrooms: 2, beds: 2, capacity: 4, price_from: 900, price_per_night: 900, currency: "MAD",
    cleaning_fee: 250, deposit_amount: 500, minimum_nights: 2, commission_rate: 20,
    short_description: "Appartement moderne et spacieux dans le quartier universitaire Agdal.",
    detailed_description: "Un appartement contemporain situé dans le quartier dynamique d'Agdal, prisé pour ses universités, commerces et espaces verts. Lumineux et bien agencé, il offre tout le confort pour un séjour agréable à Marrakech.",
    highlights: ["Quartier Agdal", "Moderne et spacieux", "Proche commerces", "Lumineux"],
    amenities: ["Wi-Fi", "Climatisation", "Cuisine équipée", "Machine à laver", "Télévision"],
    house_rules: ["Non-fumeur", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/moderne-agdal.png",
    image_alt_text: "Appartement Moderne Agdal",
    is_published: true, is_featured: false, public_status: "published", management_status: "active_management",
    check_in_time: "14:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000108", internal_name: "Victor Hugo Business", public_name: "Business Flat Victor Hugo", slug: "business-flat-victor-hugo",
    district: "Victor Hugo", city: "Marrakech", property_type: "apartment", bedrooms: 1, bathrooms: 1, beds: 1, capacity: 2, price_from: 700, price_per_night: 700, currency: "MAD",
    cleaning_fee: 200, deposit_amount: 350, minimum_nights: 1, commission_rate: 20,
    short_description: "Appartement fonctionnel pour professionnels dans le quartier d'affaires Victor Hugo.",
    detailed_description: "Un appartement pensé pour les voyageurs d'affaires, situé dans le quartier Victor Hugo à proximité des banques, entreprises et restaurants d'affaires. Confortable, calme et connecté, c'est le pied-à-terre idéal pour vos déplacements professionnels.",
    highlights: ["Quartier d'affaires", "Idéal professionnels", "Calme et fonctionnel", "Proche commodités"],
    amenities: ["Wi-Fi", "Climatisation", "Kitchenette", "Télévision", "Espace bureau"],
    house_rules: ["Non-fumeur", "Respect du voisinage"],
    image_url: "/images/yakout/apartments/business-flat-victor-hugo.png",
    image_alt_text: "Business Flat Victor Hugo",
    is_published: true, is_featured: false, public_status: "published", management_status: "active_management",
    check_in_time: "14:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000109", internal_name: "Ourika View", public_name: "Terrasse Ourika View", slug: "terrasse-ourika-view",
    district: "Route de l'Ourika", city: "Marrakech", property_type: "apartment", bedrooms: 2, bathrooms: 2, beds: 2, capacity: 4, price_from: 1050, price_per_night: 1050, currency: "MAD",
    cleaning_fee: 300, deposit_amount: 600, minimum_nights: 2, commission_rate: 20,
    short_description: "Appartement avec vue imprenable sur la vallée de l'Ourika. Calme et dépaysant.",
    detailed_description: "Échappez à l'agitation de la ville dans cet appartement situé sur la route de l'Ourika, offrant une vue panoramique sur la vallée. Au calme, entouré de nature, c'est le lieu idéal pour se ressourcer tout en restant proche de Marrakech.",
    highlights: ["Vue sur la vallée de l'Ourika", "Calme et nature", "Dépaysant", "Proche Marrakech"],
    amenities: ["Wi-Fi", "Climatisation", "Terrasse", "Cuisine équipée", "Parking"],
    house_rules: ["Non-fumeur", "Respect du voisinage", "Calme après 22h"],
    image_url: "/images/yakout/apartments/terrasse-ourika-view.png",
    image_alt_text: "Terrasse Ourika View",
    is_published: true, is_featured: true, public_status: "published", management_status: "active_management",
    check_in_time: "15:00", check_out_time: "11:00",
  },
  {
    id: "00000000-0000-0000-0000-000000000110", internal_name: "Targa Confort", public_name: "Appartement Confort Targa", slug: "appartement-confort-targa",
    district: "Targa", city: "Marrakech", property_type: "apartment", bedrooms: 2, bathrooms: 2, beds: 2, capacity: 5, price_from: 850, price_per_night: 850, currency: "MAD",
    cleaning_fee: 250, deposit_amount: 400, minimum_nights: 2, commission_rate: 20,
    short_description: "Appartement confortable dans le quartier résidentiel Targa. Idéal pour familles.",
    detailed_description: "Un appartement spacieux et confortable dans le quartier résidentiel de Targa, prisé pour ses écoles, commerces et espaces verts. Idéal pour les familles, il offre tout le nécessaire pour un séjour agréable et pratique à Marrakech.",
    highlights: ["Quartier résidentiel Targa", "Idéal familles", "Spacieux et confortable", "Proche commodités"],
    amenities: ["Wi-Fi", "Climatisation", "Cuisine équipée", "Machine à laver", "Télévision", "Parking"],
    house_rules: ["Non-fumeur", "Respect du voisinage", "Calme après 22h"],
    image_url: "/images/yakout/apartments/confort-targa.png",
    image_alt_text: "Appartement Confort Targa",
    is_published: true, is_featured: false, public_status: "published", management_status: "active_management",
    check_in_time: "14:00", check_out_time: "11:00",
  },
];

export const vehicles: Vehicle[] = [
  { id: "00000000-0000-0000-0000-000000000201", internal_name: "Skoda Kodiaq Executive", public_name: "Skoda Kodiaq Executive", slug: "skoda-kodiaq-executive", brand: "Skoda", model: "Kodiaq", capacity: 6, price_from: 350, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/skoda-kodiaq-executive.png" },
  { id: "00000000-0000-0000-0000-000000000202", internal_name: "Mercedes Classe V Premium", public_name: "Mercedes Classe V Premium", slug: "mercedes-classe-v-premium", brand: "Mercedes-Benz", model: "Classe V", capacity: 7, price_from: 800, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-classe-v-premium.png" },
  { id: "00000000-0000-0000-0000-000000000203", internal_name: "Hyundai H1 Confort", public_name: "Hyundai H1 Confort", slug: "hyundai-h1-confort", brand: "Hyundai", model: "H1", capacity: 8, price_from: 650, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/hyundai-h1-confort.png" },
  { id: "00000000-0000-0000-0000-000000000204", internal_name: "Dacia Lodgy Family", public_name: "Dacia Lodgy Family", slug: "dacia-lodgy-family", brand: "Dacia", model: "Lodgy", capacity: 6, price_from: 300, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/dacia-lodgy-family.png" },
  { id: "00000000-0000-0000-0000-000000000205", internal_name: "Toyota Prado Prestige", public_name: "Toyota Prado Prestige", slug: "toyota-prado-prestige", brand: "Toyota", model: "Prado", capacity: 6, price_from: 900, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/toyota-prado-prestige.png" },
  { id: "00000000-0000-0000-0000-000000000206", internal_name: "Range Rover Vogue Partner", public_name: "Range Rover Vogue Partner", slug: "range-rover-vogue-partner", brand: "Range Rover", model: "Vogue", capacity: 4, price_from: 1500, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/range-rover-vogue-partner.png" },
  { id: "00000000-0000-0000-0000-000000000207", internal_name: "Mercedes Classe E Executive", public_name: "Mercedes Classe E Executive", slug: "mercedes-classe-e-executive", brand: "Mercedes-Benz", model: "Classe E", capacity: 3, price_from: 700, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-classe-e-executive.png" },
  { id: "00000000-0000-0000-0000-000000000208", internal_name: "Mercedes Sprinter Groupe", public_name: "Mercedes Sprinter Groupe", slug: "mercedes-sprinter-groupe", brand: "Mercedes-Benz", model: "Sprinter", capacity: 15, price_from: 1200, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-sprinter-groupe.png" },
  { id: "00000000-0000-0000-0000-000000000209", internal_name: "Renault Trafic Private Van", public_name: "Renault Trafic Private Van", slug: "renault-trafic-private-van", brand: "Renault", model: "Trafic", capacity: 8, price_from: 600, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/renault-trafic-private-van.png" },
  { id: "00000000-0000-0000-0000-000000000210", internal_name: "Toyota Land Cruiser Excursion", public_name: "Toyota Land Cruiser Excursion", slug: "toyota-land-cruiser-excursion", brand: "Toyota", model: "Land Cruiser", capacity: 6, price_from: 1100, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/toyota-land-cruiser-excursion.png" },
];

export const blogPosts: BlogPost[] = [
  { id: "post-1", title: "OÃ¹ sÃ©journer Ã  Marrakech pour un court sÃ©jour ?", slug: "ou-sejourner-marrakech-court-sejour", excerpt: "Les meilleurs quartiers pour un sÃ©jour rÃ©ussi Ã  Marrakech : Gueliz, Hivernage, MÃ©dina et Palmeraie.", content: "Marrakech regorge de quartiers charmants. Que vous soyez voyageur d'affaires ou touriste, le choix du quartier est essentiel pour profiter pleinement de votre sÃ©jour. Gueliz, le quartier moderne, regroupe commerces et restaurants. Hivernage est plus calme et rÃ©sidentiel. La MÃ©dina vous plonge dans l'histoire. La Palmeraie offre un cadre luxueux.", category: "Marrakech", status: "published", published_at: "2026-06-01", cover_image_url: yakoutImages.hero, created_at: "2026-06-01T08:00:00Z", updated_at: "2026-06-01T08:00:00Z" },
  { id: "post-2", title: "Pourquoi choisir un chauffeur privÃ© Ã  Marrakech ?", slug: "pourquoi-chauffeur-prive-marrakech", excerpt: "Confort, sÃ©curitÃ© et ponctualitÃ© : les avantages du chauffeur privÃ© pour vos dÃ©placements Ã  Marrakech.", content: "Se dÃ©placer Ã  Marrakech peut Ãªtre complexe pour les visiteurs. Le chauffeur privÃ© offre une solution clÃ© en main : prise en charge Ã  l'aÃ©roport, trajets sÃ©curisÃ©s, flexibilitÃ© et confort. Avec Yakout, chaque trajet est une expÃ©rience sereine.", category: "Transport", status: "published", published_at: "2026-06-10", cover_image_url: yakoutImages.airportTransfer, created_at: "2026-06-10T08:00:00Z", updated_at: "2026-06-10T08:00:00Z" },
  { id: "post-3", title: "Comment rentabiliser son appartement en location courte durÃ©e ?", slug: "rentabiliser-appartement-location-courte-duree", excerpt: "Nos conseils pour optimiser la rentabilitÃ© de votre bien Ã  Marrakech grÃ¢ce Ã  une gestion professionnelle.", content: "La location courte durÃ©e Ã  Marrakech est un marchÃ© porteur. Pour maximiser vos revenus, il est essentiel de soigner la prÃ©sentation de votre bien, d'optimiser vos tarifs selon la saison et de proposer un service irrÃ©prochable aux voyageurs. Yakout vous accompagne dans chaque Ã©tape.", category: "Immobilier", status: "published", published_at: "2026-06-15", cover_image_url: yakoutImages.ownerConcierge, created_at: "2026-06-15T08:00:00Z", updated_at: "2026-06-15T08:00:00Z" },
];

export const clients: Client[] = [
  { id: "00000000-0000-0000-0000-000000000010", full_name: "Sarah Martin", phone: "+33 6 12 34 56 78", email: "sarah@example.com", nationality: "FranÃ§aise", acquisition_source: "Site web", created_at: "2026-06-20T09:00:00Z" },
  { id: "00000000-0000-0000-0000-000000000011", full_name: "Thomas Wagner", phone: "+49 170 1234567", email: "thomas@example.com", nationality: "Allemande", acquisition_source: "Google", created_at: "2026-06-15T11:00:00Z" },
];

export const reservations: Reservation[] = [
  { id: "res-1", reservation_number: "RES-2026-000001", client_name: "Sarah Martin", apartment_name: "Appartement Majorelle Signature", check_in: "2026-07-12", check_out: "2026-07-18", nights: 6, source: "direct", status: "confirmed", people_count: 4, adults: 4, children: 0, infants: 0, total_guests: 4, total_amount: 5700, deposit_amount: 2000, deposit_required: 2000, remaining_amount: 3700, payment_status: "partial", currency: "MAD", nightly_rate: 950, accommodation_subtotal: 5700, cleaning_fee: 0, tourist_tax: 0, services_total: 0, discount_amount: 0, created_at: "2026-06-20T09:00:00Z", updated_at: "2026-06-20T09:00:00Z" },
  { id: "res-2", reservation_number: "RES-2026-000002", client_name: "Fatima Benali", apartment_name: "Appartement Hivernage Élégance", check_in: "2026-08-01", check_out: "2026-08-10", nights: 9, source: "direct", status: "draft", people_count: 5, adults: 5, children: 0, infants: 0, total_guests: 5, total_amount: 10800, deposit_amount: 0, deposit_required: 0, remaining_amount: 10800, payment_status: "unpaid", currency: "MAD", nightly_rate: 1200, accommodation_subtotal: 10800, cleaning_fee: 0, tourist_tax: 0, services_total: 0, discount_amount: 0, created_at: "2026-07-01T10:00:00Z", updated_at: "2026-07-01T10:00:00Z" },
];

export const trips: Trip[] = [
  { id: "00000000-0000-0000-0000-000000000030", client_name: "Youssef Amrani", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-01", departure: "AÃ©roport Marrakech Menara", destination: "Hivernage", sold_price: 350, cost_price: 120, status: "Confirme" },
  { id: "00000000-0000-0000-0000-000000000031", client_name: "Thomas Wagner", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-05", departure: "Hivernage", destination: "Agafay", sold_price: 800, cost_price: 250, status: "Confirme" },
  { id: "00000000-0000-0000-0000-000000000032", client_name: "Sarah Martin", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-13", departure: "AÃ©roport Marrakech", destination: "Gueliz", sold_price: 300, cost_price: 100, status: "Demande" },
];

export const payments: Payment[] = [
  { id: "pay-1", client_name: "Sarah Martin", amount: 2000, paid_at: "2026-06-26", payment_method: "Virement", activity_type: "Appartement", status: "Paye", created_at: "2026-06-26T10:00:00Z" },
  { id: "pay-2", client_name: "Thomas Wagner", amount: 800, paid_at: "2026-06-28", payment_method: "Espèces", activity_type: "Transport", status: "Paye", created_at: "2026-06-28T14:00:00Z" },
  { id: "pay-3", client_name: "Youssef Amrani", amount: 350, paid_at: "2026-06-29", payment_method: "Carte", activity_type: "Transport", status: "En attente", created_at: "2026-06-29T09:00:00Z" },
];

export const expenses: Expense[] = [
  { id: "exp-1", amount: 450, expense_date: "2026-06-27", category: "Ménage", activity_type: "Appartement", created_at: "2026-06-27T08:00:00Z" },
  { id: "exp-2", amount: 200, expense_date: "2026-06-28", category: "Fournitures", activity_type: "Appartement", created_at: "2026-06-28T09:00:00Z" },
  { id: "exp-3", amount: 120, expense_date: "2026-06-29", category: "Carburant", activity_type: "Transport", created_at: "2026-06-29T10:00:00Z" },
  { id: "exp-4", amount: 300, expense_date: "2026-06-30", category: "Commission partenaire", activity_type: "Transport", created_at: "2026-06-30T11:00:00Z" },
];

