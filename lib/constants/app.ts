import {
  Building2,
  CalendarCheck,
  Car,
  CreditCard,
  DollarSign,
  FileText,
  Globe2,
  Handshake,
  Home,
  LayoutDashboard,
  Luggage,
  MessageCircle,
  Plane,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export const company = {
  name: "Yakout Conciergerie et Services",
  city: "Marrakech",
  currency: "MAD",
  timezone: "Africa/Casablanca",
  logo: "/logo/yakout_logo_transparent_cropped.png",
};

export const dashboardNav = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { label: "Écosystème", href: "/dashboard/ecosystem", icon: Sparkles },
  { label: "Demandes", href: "/dashboard/leads", icon: MessageCircle },
  { label: "Appartements", href: "/dashboard/apartments", icon: Building2 },
  { label: "Véhicules", href: "/dashboard/vehicles", icon: Car },
  { label: "Services", href: "/dashboard/site/services", icon: Sparkles },
  { label: "Réservations", href: "/dashboard/reservations", icon: CalendarCheck },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Propriétaires", href: "/dashboard/owners", icon: Home },
  { label: "Transferts & Chauffeur", href: "/dashboard/transfers", icon: Plane },
  { label: "Trajets", href: "/dashboard/trips", icon: Luggage },
  { label: "Blog", href: "/dashboard/site/blog", icon: FileText },
  { label: "Pages du site", href: "/dashboard/site/pages", icon: Globe2 },
  { label: "SEO", href: "/dashboard/site/seo", icon: Search },
  { label: "Médias", href: "/dashboard/site/media", icon: FileText },
  { label: "Paiements", href: "/dashboard/payments", icon: CreditCard },
  { label: "Dépenses", href: "/dashboard/expenses", icon: DollarSign },
  { label: "Partenaires", href: "/dashboard/partners", icon: Handshake },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Rapports", href: "/dashboard/reports", icon: TrendingUp },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { label: "Site Settings", href: "/dashboard/site/settings", icon: Settings },
];

export const futureModules = [
  {
    title: "Portail Syndic",
    description:
      "Module futur pour la gestion des résidences, copropriétaires, charges, paiements, réclamations et documents.",
  },
  {
    title: "Module Événementiel",
    description:
      "Module futur pour les anniversaires, EVJF, EVG, séjours de groupe, excursions premium, prestataires et packs touristiques.",
  },
];
