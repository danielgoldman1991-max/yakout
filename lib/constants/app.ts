import {
  Building2,
  CalendarCheck,
  Car,
  CreditCard,
  DollarSign,
  FileText,
  Folder,
  Globe2,
  Handshake,
  Home,
  Image,
  LayoutDashboard,
  Luggage,
  MessageCircle,
  Plane,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

export const company = {
  name: "Yakout Conciergerie et Services",
  city: "Marrakech",
  currency: "MAD",
  timezone: "Africa/Casablanca",
  logo: "/branding/yakout-logo-light.png",
};

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

const pilotage: DashboardNavGroup = {
  label: "Pilotage",
  items: [
    { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { label: "Écosystème", href: "/dashboard/ecosystem", icon: Sparkles },
    { label: "Rapports", href: "/dashboard/reports", icon: TrendingUp },
  ],
};

const demandesCRM: DashboardNavGroup = {
  label: "Demandes & CRM",
  items: [
    { label: "Demandes", href: "/dashboard/leads", icon: MessageCircle },
    { label: "Clients", href: "/dashboard/clients", icon: Users },
    { label: "Propriétaires", href: "/dashboard/owners", icon: Home },
  ],
};

const offresReservations: DashboardNavGroup = {
  label: "Offres & Réservations",
  items: [
    { label: "Appartements", href: "/dashboard/apartments", icon: Building2 },
    { label: "Véhicules", href: "/dashboard/vehicles", icon: Car },
    { label: "Services", href: "/dashboard/site/services", icon: Sparkles },
    { label: "Réservations", href: "/dashboard/reservations", icon: CalendarCheck },
  ],
};

const transportSejours: DashboardNavGroup = {
  label: "Transport & Séjours",
  items: [
    { label: "Vue transport", href: "/dashboard/transport", icon: LayoutDashboard },
    { label: "Transferts & Chauffeur", href: "/dashboard/transfers", icon: Plane },
    { label: "Trajets", href: "/dashboard/trips", icon: Luggage },
    { label: "Partenaires", href: "/dashboard/partners", icon: Handshake },
    { label: "Packs & Sejours", href: "/dashboard/packages", icon: Sparkles },
  ],
};

const contenuSite: DashboardNavGroup = {
  label: "Contenu du site",
  items: [
    { label: "Blog", href: "/dashboard/site/blog", icon: FileText },
    { label: "Pages du site", href: "/dashboard/site/pages", icon: Globe2 },
    { label: "Médias", href: "/dashboard/site/media", icon: Image },
    { label: "SEO", href: "/dashboard/site/seo", icon: Search },
  ],
};

const finance: DashboardNavGroup = {
  label: "Finance",
  items: [
    { label: "Paiements", href: "/dashboard/payments", icon: CreditCard },
    { label: "Dépenses", href: "/dashboard/expenses", icon: DollarSign },
  ],
};

const documents: DashboardNavGroup = {
  label: "Documents",
  items: [
    { label: "Documents", href: "/dashboard/documents", icon: Folder },
  ],
};

const parametres: DashboardNavGroup = {
  label: "Paramètres",
  items: [
    { label: "Paramètres du site", href: "/dashboard/site/settings", icon: Settings },
    { label: "Paramètres internes", href: "/dashboard/settings", icon: Wrench },
  ],
};

const modulesFuturs: DashboardNavGroup = {
  label: "Modules futurs",
  items: [
    { label: "Portail Syndic", href: "", icon: Building2, disabled: true, badge: "À venir" },
    { label: "Événementiel", href: "", icon: Sparkles, disabled: true, badge: "À venir" },
  ],
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  pilotage,
  demandesCRM,
  offresReservations,
  transportSejours,
  contenuSite,
  finance,
  documents,
  parametres,
  modulesFuturs,
];

// Keep flat list for backward compatibility if needed
export const dashboardNav = dashboardNavGroups.flatMap((g) => g.items);

export const futureModules = modulesFuturs.items.map((item) => ({
  title: item.label,
  description: item.badge === "À venir" ? `Module futur pour la gestion des ${item.label.toLowerCase()}.` : "",
}));
