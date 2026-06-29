# PROJECT_MAP.md

## PROJECT_OVERVIEW

- **Objectif** : Application web de conciergerie premium (site public + dashboard interne + CMS) pour Yakout Conciergerie et Services, Marrakech.
- **Périmètre exact V1** : Site public vitrine, dashboard de gestion (leads, clients, appartements, véhicules, réservations, trajets, partenaires, paiements, dépenses, documents), CMS (pages, blog, services, SEO, médias), authentification Supabase.
- **Hors périmètre** : Module Portail Syndic, Module Événementiel, portail client, paiement en ligne, mobile, i18n, multi-tenant.
- **Hypothèses** : Voir section 2 de la planification validée.

## TECH_STACK

- **Langage** : TypeScript 5+
- **Framework** : Next.js 16.2.9 (App Router, Turbopack par défaut)
- **UI** : React 19.2.4, Tailwind CSS 4, Lucide React, Recharts
- **Formulaires** : React Hook Form 7.80+, Zod 4.4.3
- **Backend/DB** : Supabase (PostgreSQL, Auth SSR, Storage, RLS)
- **Outils** : ESLint 9 (flat config), Sonner (toasts), CVA + tailwind-merge + clsx
- **Déploiement** : Vercel

## ARCHITECTURE

```
app/               # Next.js App Router (pages + API)
components/        # UI, layout, dashboard, tables, public
lib/               # Supabase clients, auth, validations, data, utils
types/             # TypeScript types (business, cms, auth, database)
database/          # SQL (schema, policies, storage, seed)
proxy.ts           # Route guard (ex-middleware)
```

- **Convention nommage** : kebab-case pour dossiers, camelCase pour fonctions/variables, PascalCase pour composants/types.
- **Règles d'import** : `@/` pour tout sous `yakout/`, imports absolus uniquement.
- **Logique partagée** : `lib/supabase/` pour les clients, `lib/validations/schemas.ts` pour Zod, `lib/data/` pour les queries réutilisables.

## SYSTEM_FLOW

### Parcours visiteur (site public)
1. Arrivée sur `/` → navigation pages publiques
2. Consultation appartements, véhicules, services, blog
3. Soumission formulaire de contact → validation Zod → insertion BDD (ou fallback demo)
4. Feedback toast confirmation

### Parcours admin (dashboard)
1. Connexion via `/login` (Supabase Auth)
2. `proxy.ts` protège `/dashboard/*`
3. Arrivée sur `/dashboard/ecosystem` → navigation par module
4. CRUD leads, clients, appartements, etc. via Supabase
5. Logging dans `activity_logs`

### Parcours CMS
1. Accès via `/dashboard/site/*`
2. Édition pages, blog, services, SEO, media
3. Modifications visibles sur site public après revalidation

## VERIFIABLE_GOALS

| ID | Nom | Critère | Statut |
|----|-----|---------|--------|
| OV1 | Authentification | Connexion OK → dashboard accessible | PENDING (dépend Supabase config) |
| OV2 | Leads | Soumission formulaire → lead en base | DONE (API + demo fallback) |
| OV3 | CRUD Appartements | Création dashboard → visible site public | DONE (pages + data layer) |
| OV4 | Dashboard KPI | Chiffres = somme des données réelles | DONE (via data layer) |
| OV5 | CMS Pages | Édition CMS → mise à jour site public | DONE (pages dynamiques) |
| OV6 | Upload média | Fichier uploadé → accessible | DONE (mode demo via `/api/upload`) |
| OV7 | Build | npm run build → exit 0 | DONE (48 routes) |
| OV8 | Protection routes | /dashboard sans session → /login | DONE (proxy.ts) |
| OV9 | CRUD complet | Toutes entités : create, list, edit, delete | DONE |

## LOGGING_STRATEGY

- Niveaux : debug (dev), info, warn, error
- Implémentation : `lib/utils/logger.ts` (console, préfixé `[Yakout]`)
- Données interdites : tokens, mots de passe, clés API, secrets

## ORPHANS_AND_PENDING

### Implémenté
- [x] `lib/utils/logger.ts` — Logger créé (niveaux debug/info/warn/error)
- [x] `lib/data/index.ts` — Couche d'accès complète (CRUD + fallback mock-data) pour toutes les entités
- [x] `lib/data/actions.ts` — Server Actions complètes (create/update/delete) pour toutes les entités
- [x] Pages dashboard : list + create (`new/`) + edit (`[id]/`) pour toutes les entités
- [x] Pages publiques dynamiques : accueil, appartements, véhicules, services, blog, pages génériques
- [x] Migration Next.js 16 : params/searchParams async, proxy.ts, login page fixée
- [x] ESLint flat config OK (`npm run lint` → 0 errors)
- [x] Build OK (48 routes, 0 type errors)
- [x] Upload média fonctionnel en mode demo (sauvegarde dans `public/uploads/`)
- [x] Conversion lead → client
- [x] Boutons Nouveau + liens Voir/Modifier sur toutes les pages liste
- [x] Types manquants ajoutés : `Partner.commission`, `Reservation.people_count`

### Restant (hors périmètre V1 ou différé)
- [ ] Upload Supabase Storage (interface UI à connecter, API route `/api/upload` prête)
- [ ] Pagination sur listes dashboard (limit 50 sans pagination pour V1)
- [ ] Tests automatisés (reportés V2)
- [ ] Éditeur de texte riche pour le blog (textarea simple pour V1)
- [ ] Cohérence types `string` (mock) vs `uuid` (Supabase) à assurer lors migration Supabase
- [ ] Connexion Supabase réelle (nécessite vars d'env + scripts SQL)
- [ ] Résoudre incohérence Zod schema vs TypeScript type pour trips/payments (client_id vs client_name)
