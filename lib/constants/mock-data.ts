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
  { id: "service-3", title: "Chauffeur privÃ©", slug: "chauffeur-prive", short_description: "Skoda Kodiaq avec chauffeur pour transferts, excursions et mise Ã  disposition.", description: "Trajets premium, ponctualitÃ©, confort et discrÃ©tion.", price_from: 300, icon: "Car", is_published: true, display_order: 3 },
  { id: "service-4", title: "Transfert aÃ©roport", slug: "transfert-aeroport", short_description: "Accueil et transfert depuis l'aÃ©roport Marrakech Menara.", description: "Prise en charge avec panneau nominatif, confort et ponctualitÃ©.", price_from: 250, icon: "Plane", is_published: true, display_order: 4 },
  { id: "service-5", title: "VÃ©hicules partenaires", slug: "vehicules-partenaires", short_description: "MobilitÃ© flexible avec nos partenaires fiables.", description: "VÃ©hicules avec chauffeurs partenaires sÃ©lectionnÃ©s.", price_from: 400, icon: "Bus", is_published: true, display_order: 5 },
  { id: "service-6", title: "Services touristiques", slug: "services-touristiques", short_description: "Excursions et expÃ©riences premium autour de Marrakech.", description: "Circuits personnalisÃ©s, activitÃ©s et dÃ©couvertes.", price_from: 500, icon: "Star", is_published: true, display_order: 6 },
];

export const apartments: Apartment[] = [
  {
    id: "apt-1", internal_name: "Majorelle Signature", public_name: "Appartement Majorelle Signature", slug: "appartement-majorelle-signature",
    district: "Majorelle", bedrooms: 2, capacity: 4, price_from: 950, is_published: true, is_featured: true,
    image_url: "/images/yakout/apartments/majorelle-signature.png",
  },
  {
    id: "apt-2", internal_name: "Suite Urbaine GuÃ©liz", public_name: "Suite Urbaine GuÃ©liz", slug: "suite-urbaine-gueliz",
    district: "GuÃ©liz", bedrooms: 1, capacity: 2, price_from: 650, is_published: true, is_featured: false,
    image_url: "/images/yakout/apartments/suite-urbaine-gueliz.png",
  },
  {
    id: "apt-3", internal_name: "Hivernage Ã‰lÃ©gance", public_name: "Appartement Hivernage Ã‰lÃ©gance", slug: "appartement-hivernage-elegance",
    district: "Hivernage", bedrooms: 2, capacity: 4, price_from: 1200, is_published: true, is_featured: true,
    image_url: "/images/yakout/apartments/hivernage-elegance.png",
  },
  {
    id: "apt-4", internal_name: "Penthouse Terrasse M Avenue", public_name: "Penthouse Terrasse M Avenue", slug: "penthouse-terrasse-m-avenue",
    district: "M Avenue", bedrooms: 2, capacity: 5, price_from: 1600, is_published: true, is_featured: true,
    image_url: "/images/yakout/apartments/penthouse-m-avenue.png",
  },
  {
    id: "apt-5", internal_name: "Riad MÃ©dina", public_name: "Appartement Riad MÃ©dina", slug: "appartement-riad-medina",
    district: "MÃ©dina", bedrooms: 1, capacity: 3, price_from: 750, is_published: true, is_featured: false,
    image_url: "/images/yakout/apartments/riad-medina.png",
  },
  {
    id: "apt-6", internal_name: "Palmeraie Prestige", public_name: "RÃ©sidence Palmeraie Prestige", slug: "residence-palmeraie-prestige",
    district: "Palmeraie", bedrooms: 3, capacity: 6, price_from: 1800, is_published: true, is_featured: true,
    image_url: "/images/yakout/apartments/palmeraie-prestige.png",
  },
  {
    id: "apt-7", internal_name: "Agdal Moderne", public_name: "Appartement Moderne Agdal", slug: "appartement-moderne-agdal",
    district: "Agdal", bedrooms: 2, capacity: 4, price_from: 900, is_published: true, is_featured: false,
    image_url: "/images/yakout/apartments/moderne-agdal.png",
  },
  {
    id: "apt-8", internal_name: "Victor Hugo Business", public_name: "Business Flat Victor Hugo", slug: "business-flat-victor-hugo",
    district: "Victor Hugo", bedrooms: 1, capacity: 2, price_from: 700, is_published: true, is_featured: false,
    image_url: "/images/yakout/apartments/business-flat-victor-hugo.png",
  },
  {
    id: "apt-9", internal_name: "Ourika View", public_name: "Terrasse Ourika View", slug: "terrasse-ourika-view",
    district: "Route de l'Ourika", bedrooms: 2, capacity: 4, price_from: 1050, is_published: true, is_featured: true,
    image_url: "/images/yakout/apartments/terrasse-ourika-view.png",
  },
  {
    id: "apt-10", internal_name: "Targa Confort", public_name: "Appartement Confort Targa", slug: "appartement-confort-targa",
    district: "Targa", bedrooms: 2, capacity: 5, price_from: 850, is_published: true, is_featured: false,
    image_url: "/images/yakout/apartments/confort-targa.png",
  },
];

export const vehicles: Vehicle[] = [
  { id: "veh-1", internal_name: "Skoda Kodiaq Executive", public_name: "Skoda Kodiaq Executive", slug: "skoda-kodiaq-executive", brand: "Skoda", model: "Kodiaq", capacity: 6, price_from: 350, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/skoda-kodiaq-executive.png" },
  { id: "veh-2", internal_name: "Mercedes Classe V Premium", public_name: "Mercedes Classe V Premium", slug: "mercedes-classe-v-premium", brand: "Mercedes-Benz", model: "Classe V", capacity: 7, price_from: 800, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-classe-v-premium.png" },
  { id: "veh-3", internal_name: "Hyundai H1 Confort", public_name: "Hyundai H1 Confort", slug: "hyundai-h1-confort", brand: "Hyundai", model: "H1", capacity: 8, price_from: 650, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/hyundai-h1-confort.png" },
  { id: "veh-4", internal_name: "Dacia Lodgy Family", public_name: "Dacia Lodgy Family", slug: "dacia-lodgy-family", brand: "Dacia", model: "Lodgy", capacity: 6, price_from: 300, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/dacia-lodgy-family.png" },
  { id: "veh-5", internal_name: "Toyota Prado Prestige", public_name: "Toyota Prado Prestige", slug: "toyota-prado-prestige", brand: "Toyota", model: "Prado", capacity: 6, price_from: 900, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/toyota-prado-prestige.png" },
  { id: "veh-6", internal_name: "Range Rover Vogue Partner", public_name: "Range Rover Vogue Partner", slug: "range-rover-vogue-partner", brand: "Range Rover", model: "Vogue", capacity: 4, price_from: 1500, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/range-rover-vogue-partner.png" },
  { id: "veh-7", internal_name: "Mercedes Classe E Executive", public_name: "Mercedes Classe E Executive", slug: "mercedes-classe-e-executive", brand: "Mercedes-Benz", model: "Classe E", capacity: 3, price_from: 700, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-classe-e-executive.png" },
  { id: "veh-8", internal_name: "Mercedes Sprinter Groupe", public_name: "Mercedes Sprinter Groupe", slug: "mercedes-sprinter-groupe", brand: "Mercedes-Benz", model: "Sprinter", capacity: 15, price_from: 1200, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/mercedes-sprinter-groupe.png" },
  { id: "veh-9", internal_name: "Renault Trafic Private Van", public_name: "Renault Trafic Private Van", slug: "renault-trafic-private-van", brand: "Renault", model: "Trafic", capacity: 8, price_from: 600, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/renault-trafic-private-van.png" },
  { id: "veh-10", internal_name: "Toyota Land Cruiser Excursion", public_name: "Toyota Land Cruiser Excursion", slug: "toyota-land-cruiser-excursion", brand: "Toyota", model: "Land Cruiser", capacity: 6, price_from: 1100, with_driver: true, is_published: true, image_url: "/images/yakout/vehicles/toyota-land-cruiser-excursion.png" },
];

export const blogPosts: BlogPost[] = [
  { id: "post-1", title: "OÃ¹ sÃ©journer Ã  Marrakech pour un court sÃ©jour ?", slug: "ou-sejourner-marrakech-court-sejour", excerpt: "Les meilleurs quartiers pour un sÃ©jour rÃ©ussi Ã  Marrakech : Gueliz, Hivernage, MÃ©dina et Palmeraie.", content: "Marrakech regorge de quartiers charmants. Que vous soyez voyageur d'affaires ou touriste, le choix du quartier est essentiel pour profiter pleinement de votre sÃ©jour. Gueliz, le quartier moderne, regroupe commerces et restaurants. Hivernage est plus calme et rÃ©sidentiel. La MÃ©dina vous plonge dans l'histoire. La Palmeraie offre un cadre luxueux.", category: "Marrakech", status: "published", published_at: "2026-06-01", cover_image_url: yakoutImages.hero },
  { id: "post-2", title: "Pourquoi choisir un chauffeur privÃ© Ã  Marrakech ?", slug: "pourquoi-chauffeur-prive-marrakech", excerpt: "Confort, sÃ©curitÃ© et ponctualitÃ© : les avantages du chauffeur privÃ© pour vos dÃ©placements Ã  Marrakech.", content: "Se dÃ©placer Ã  Marrakech peut Ãªtre complexe pour les visiteurs. Le chauffeur privÃ© offre une solution clÃ© en main : prise en charge Ã  l'aÃ©roport, trajets sÃ©curisÃ©s, flexibilitÃ© et confort. Avec Yakout, chaque trajet est une expÃ©rience sereine.", category: "Transport", status: "published", published_at: "2026-06-10", cover_image_url: yakoutImages.airportTransfer },
  { id: "post-3", title: "Comment rentabiliser son appartement en location courte durÃ©e ?", slug: "rentabiliser-appartement-location-courte-duree", excerpt: "Nos conseils pour optimiser la rentabilitÃ© de votre bien Ã  Marrakech grÃ¢ce Ã  une gestion professionnelle.", content: "La location courte durÃ©e Ã  Marrakech est un marchÃ© porteur. Pour maximiser vos revenus, il est essentiel de soigner la prÃ©sentation de votre bien, d'optimiser vos tarifs selon la saison et de proposer un service irrÃ©prochable aux voyageurs. Yakout vous accompagne dans chaque Ã©tape.", category: "Immobilier", status: "published", published_at: "2026-06-15", cover_image_url: yakoutImages.ownerConcierge },
];

export const clients: Client[] = [
  { id: "00000000-0000-0000-0000-000000000010", full_name: "Sarah Martin", phone: "+33 6 12 34 56 78", email: "sarah@example.com", nationality: "FranÃ§aise", acquisition_source: "Site web", created_at: "2026-06-20T09:00:00Z" },
  { id: "00000000-0000-0000-0000-000000000011", full_name: "Thomas Wagner", phone: "+49 170 1234567", email: "thomas@example.com", nationality: "Allemande", acquisition_source: "Google", created_at: "2026-06-15T11:00:00Z" },
];

export const reservations: Reservation[] = [
  { id: "res-1", client_name: "Sarah Martin", apartment_name: "Appartement Majorelle Signature", check_in: "2026-07-12", check_out: "2026-07-18", people_count: 4, total_amount: 5700, deposit_amount: 2000, reservation_status: "Confirmee" },
  { id: "res-2", client_name: "Fatima Benali", apartment_name: "Appartement Hivernage Ã‰lÃ©gance", check_in: "2026-08-01", check_out: "2026-08-10", people_count: 5, total_amount: 10800, deposit_amount: 0, reservation_status: "Pre-reservation" },
];

export const trips: Trip[] = [
  { id: "00000000-0000-0000-0000-000000000030", client_name: "Youssef Amrani", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-01", departure: "AÃ©roport Marrakech Menara", destination: "Hivernage", sold_price: 350, cost_price: 120, status: "Confirme" },
  { id: "00000000-0000-0000-0000-000000000031", client_name: "Thomas Wagner", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-05", departure: "Hivernage", destination: "Agafay", sold_price: 800, cost_price: 250, status: "Confirme" },
  { id: "00000000-0000-0000-0000-000000000032", client_name: "Sarah Martin", vehicle_name: "Skoda Kodiaq", trip_date: "2026-07-13", departure: "AÃ©roport Marrakech", destination: "Gueliz", sold_price: 300, cost_price: 100, status: "Demande" },
];

export const payments: Payment[] = [
  { id: "pay-1", client_name: "Sarah Martin", amount: 2000, paid_at: "2026-06-26", payment_method: "Virement", activity_type: "Appartement", status: "Paye" },
  { id: "pay-2", client_name: "Thomas Wagner", amount: 800, paid_at: "2026-06-28", payment_method: "EspÃ¨ces", activity_type: "Transport", status: "Paye" },
  { id: "pay-3", client_name: "Youssef Amrani", amount: 350, paid_at: "2026-06-29", payment_method: "Carte", activity_type: "Transport", status: "En attente" },
];

export const expenses: Expense[] = [
  { id: "exp-1", amount: 450, expense_date: "2026-06-27", category: "MÃ©nage", activity_type: "Appartement" },
  { id: "exp-2", amount: 200, expense_date: "2026-06-28", category: "Fournitures", activity_type: "Appartement" },
  { id: "exp-3", amount: 120, expense_date: "2026-06-29", category: "Carburant", activity_type: "Transport" },
  { id: "exp-4", amount: 300, expense_date: "2026-06-30", category: "Commission partenaire", activity_type: "Transport" },
];

