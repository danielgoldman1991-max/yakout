import {
  Building2,
  CalendarCheck,
  Car,
  FileText,
  Globe2,
  Home,
  LayoutDashboard,
  MessageCircle,
  Plane,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { ModuleCard } from "@/components/dashboard/module-card";
import { KpiCard } from "@/components/dashboard/kpi-card";

const activeModules = [
  {
    title: "Demandes / Leads",
    status: "Actif" as const,
    description: "Gérez les demandes entrantes : qualification, suivi, transformation en client.",
    features: ["Qualification", "Suivi client", "Devis", "Conversion"],
    href: "/dashboard/leads",
    buttonLabel: "Voir les demandes",
    icon: MessageCircle,
  },
  {
    title: "Appartements",
    status: "Actif" as const,
    description: "Gérez les appartements visibles sur le site public et leur disponibilité.",
    features: ["Publication", "Photos", "Tarifs", "Disponibilités"],
    href: "/dashboard/apartments",
    buttonLabel: "Gérer les appartements",
    icon: Building2,
    publicHref: "/apartments",
  },
  {
    title: "Véhicules",
    status: "Actif" as const,
    description: "Gérez les véhicules partenaires et le Skoda Kodiaq principal.",
    features: ["Skoda Kodiaq", "Partenaires", "Tarifs", "Capacités"],
    href: "/dashboard/vehicles",
    buttonLabel: "Gérer les véhicules",
    icon: Car,
    publicHref: "/vehicles",
  },
  {
    title: "Réservations",
    status: "Actif" as const,
    description: "Suivez les demandes confirmées liées aux appartements, transferts et services.",
    features: ["Appartements", "Transferts", "Clients", "Paiements"],
    href: "/dashboard/reservations",
    buttonLabel: "Voir les réservations",
    icon: CalendarCheck,
  },
  {
    title: "Clients",
    status: "Actif" as const,
    description: "Centralisez les voyageurs et contacts ayant effectué une demande ou réservation.",
    features: ["Contacts", "Historique", "Suivi"],
    href: "/dashboard/clients",
    buttonLabel: "Voir les clients",
    icon: Users,
  },
  {
    title: "Propriétaires",
    status: "Actif" as const,
    description: "Suivez les propriétaires qui confient ou souhaitent confier un bien à Yakout.",
    features: ["Bailleurs", "Mandats", "Documents"],
    href: "/dashboard/owners",
    buttonLabel: "Gérer les propriétaires",
    icon: Home,
    publicHref: "/concierge",
  },
  {
    title: "Transferts & Chauffeur",
    status: "Actif" as const,
    description: "Organisez les demandes de transfert aéroport, trajets privés et mises à disposition.",
    features: ["Aéroport", "Excursions", "Mise à disposition"],
    href: "/dashboard/transfers",
    buttonLabel: "Organiser les transferts",
    icon: Plane,
    publicHref: "/chauffeur",
  },
  {
    title: "Services du site",
    status: "Actif" as const,
    description: "Gérez les services visibles sur le site public Yakout.",
    features: ["Publication", "Ordre", "Tarifs"],
    href: "/dashboard/site/services",
    buttonLabel: "Gérer les services",
    icon: Sparkles,
    publicHref: "/services",
  },
  {
    title: "Blog",
    status: "Actif" as const,
    description: "Gérez les conseils et articles publiés sur le site Yakout.",
    features: ["Articles", "Publication", "Catégories"],
    href: "/dashboard/site/blog",
    buttonLabel: "Gérer le blog",
    icon: FileText,
    publicHref: "/blog",
  },
  {
    title: "Pages du site",
    status: "Actif" as const,
    description: "Modifiez le contenu des pages publiques sans toucher au code.",
    features: ["Textes", "Photos", "Boutons", "SEO"],
    href: "/dashboard/site/pages",
    buttonLabel: "Gérer les pages",
    icon: Globe2,
  },
  {
    title: "SEO",
    status: "Actif" as const,
    description: "Optimisez le référencement du site : balises, sitemap, robots.txt.",
    features: ["Balises", "Sitemap", "Robots", "Analytics"],
    href: "/dashboard/site/seo",
    buttonLabel: "Modifier le SEO",
    icon: Search,
  },
  {
    title: "Paramètres du site",
    status: "Actif" as const,
    description: "Configurez les informations générales du site : nom, contact, réseaux sociaux.",
    features: ["Coordonnées", "Réseaux", "Logo"],
    href: "/dashboard/site/settings",
    buttonLabel: "Configurer le site",
    icon: Settings,
  },
];

const futureModules = [
  {
    title: "Portail Syndic",
    status: "À venir" as const,
    description: "Module futur pour la gestion des résidences, copropriétaires, charges et documents.",
    features: ["Résidences", "Copropriétaires", "Charges", "Documents"],
    buttonLabel: "Module non activé",
    icon: Building2,
  },
  {
    title: "Module Événementiel",
    status: "À venir" as const,
    description: "Module futur pour les anniversaires, EVJF/EVG, séjours de groupe et excursions premium.",
    features: ["Packs", "Prestataires", "Groupes", "Excursions"],
    buttonLabel: "Module non activé",
    icon: Sparkles,
  },
];

const configSteps = [
  { step: "1", title: "Paramètres du site", desc: "Nom, coordonnées, logo, réseaux sociaux", href: "/dashboard/site/settings" },
  { step: "2", title: "SEO", desc: "Balises, sitemap, robots.txt", href: "/dashboard/site/seo" },
  { step: "3", title: "Services", desc: "Définir les services affichés sur le site", href: "/dashboard/site/services" },
  { step: "4", title: "Appartements", desc: "Ajouter les biens avec photos et tarifs", href: "/dashboard/apartments" },
  { step: "5", title: "Véhicules", desc: "Configurer le Skoda Kodiaq et les partenaires", href: "/dashboard/vehicles" },
  { step: "6", title: "Blog", desc: "Rédiger et publier les premiers articles", href: "/dashboard/site/blog" },
  { step: "7", title: "Leads", desc: "Suivre et qualifier les demandes entrantes", href: "/dashboard/leads" },
  { step: "8", title: "Réservations & Clients", desc: "Centraliser les confirmations et contacts", href: "/dashboard/reservations" },
];

export default function EcosystemPage() {
  return (
    <div className="space-y-10">
      {/* ─── Header ─── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / Écosystème</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Écosystème Yakout</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground/70">
          Pilotez les modules qui alimentent le site, les demandes clients, les appartements, les véhicules et les services Yakout.
        </p>
      </div>

      {/* ─── KPI résumé ─── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Modules actifs"
          value="12"
          description="Modules opérationnels connectés au dashboard"
          icon={LayoutDashboard}
        />
        <KpiCard
          title="Pages publiques connectées"
          value="6"
          description="Appartements, Véhicules, Services, Blog, Chauffeur, Conciergerie"
          icon={Globe2}
        />
        <KpiCard
          title="Modules à configurer"
          value="0"
          description="Tous les modules sont prêts"
          icon={Settings}
        />
        <KpiCard
          title="Modules futurs"
          value="2"
          description="Syndic et Événementiel — V2"
          icon={TrendingUp}
        />
      </div>

      {/* ─── Modules actifs ─── */}
      <div>
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Modules actifs</h2>
          <p className="mt-1 text-sm text-muted-foreground/70">
            L&apos;ensemble des outils disponibles pour piloter votre activité.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {activeModules.map((mod) => (
            <ModuleCard key={mod.href} {...mod} />
          ))}
        </div>
      </div>

      {/* ─── Modules futurs ─── */}
      <div>
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Modules futurs</h2>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Modules prévus pour les versions futures, non activés dans la V1.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {futureModules.map((mod, i) => (
            <ModuleCard key={i} {...mod} disabled />
          ))}
        </div>
      </div>

      {/* ─── Parcours recommandé ─── */}
      <div>
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Ordre conseillé de configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Suivez ces étapes pour configurer votre écosystème Yakout dans l&apos;ordre logique.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {configSteps.map(({ step, title, desc, href }) => (
            <a
              key={step}
              href={href}
              className="group flex items-start gap-4 rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5 text-sm font-semibold text-gold">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground transition-colors group-hover:text-gold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ─── CTA utiles ─── */}
      <div className="rounded-sm border border-border/60 bg-card p-6 shadow-elevation-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Actions rapides</h3>
            <p className="mt-0.5 text-sm text-muted-foreground/70">Accédez aux pages clés du dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Voir les demandes", href: "/dashboard/leads", icon: MessageCircle },
              { label: "Appartements", href: "/dashboard/apartments", icon: Building2 },
              { label: "Véhicules", href: "/dashboard/vehicles", icon: Car },
              { label: "SEO", href: "/dashboard/site/seo", icon: Search },
              { label: "Paramètres", href: "/dashboard/site/settings", icon: Settings },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-surface px-3.5 py-2 text-[11px] font-medium text-muted-foreground/80 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold hover:shadow-elevation-2"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
