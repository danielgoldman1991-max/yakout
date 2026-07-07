<!--
## Goal
Global audit et refonte UX/UI complète de l'écosystème Yakout : sites public + dashboard, cohérence dark/light, responsive, formulaires, SEO, accessibilité, performance.

## Constraints & Preferences
- Aucun `select("*")` sur les routes publiques — colonnes restreintes uniquement.
- Aucun champ privé exposé en public (`owner_id`, `address_private`, `wifi_password`, `access_instructions`, `internal_notes`, `commission_rate`, `cost_amount`, `rib`, `bank_name`).
- Aucun `SERVICE_ROLE` dans le code client, aucune donnée mock, aucun faux témoignage/statistique, aucun `href="#"`, aucun `TODO`.
- Utilisation de vrais caractères UTF-8 (pas d'entités HTML comme `&apos;` / `&thinsp;`).
- Palette Yakout Moroccan Ruby Hospitality : or, rubis, espresso, ivoire, sable — premium, lisible.
- Travail par passes : PASS 1 audit → LOT 1 corrections critiques → LOT 2 design system → LOT 3 pages → LOT 4 dashboard → LOT 5–7 tests/report.
- Build validé après chaque lot.

## Progress
### Done (pre-session)
- **Blog renderer** : `components/blog/blog-content-renderer.tsx` — conversion texte→HTML sécurisé.
- **Formulaire leads dynamique** : `components/public/lead-form.tsx` — 6 types avec sections spécifiques, metadata jsonb.
- **Dashboard nav groupée** : 9 groupes métier, modules futurs désactivés, active state gold.
- **Payments CRUD** : 3 pages (`/dashboard/payments`) — liste, form, détail.
- **Expenses CRUD** : 3 pages (`/dashboard/expenses`) — liste, form, détail.
- **Documents upload réel** : bucket privé `yakout-private`, drag & drop, validation, signed URLs 10min.
- **Owners module** : types, data layer, server actions, pages 360°, lead→owner conversion.
- **SQL migrations** : 4 migrations créées (non exécutées).
- **PostgrestError fix** : extraction explicite des props `Error.message` (non-enumerable).

### Done (this session)
- **PASS 1 — Audit complet** : grep sur `select(*)`, données privées, SERVICE_ROLE, bg-white/text-black hardcodés, TODO, entités HTML, localhost, text-[9px]/[10px]. Résultats : 0 fuite sécurité, ~40 entités HTML, text sizes incohérents.
- **LOT 1 — Corrections critiques appliquées** (build 57 pages, 0 errors, 0 lint) :
  - Header nav : "Transport prive" → "Transport privé", "Packs & Sejours" → "Packs & Séjours", `text-[10px]` → `text-[13px]`.
  - Footer : restructuré 4 colonnes (Découvrir / Propriétaires / Yakout / Contact). "Reponse rapide" → "Réponse rapide". "Tous droits reserves" → "Tous droits réservés". "Espace Maria" → "Accès professionnel" → `/login`. Réseaux factices supprimés.
  - `lib/constants/site.ts` : meta title "Chauffeur Privé" → "transport privé". Hero text "chauffeur privé" → "transport privé".
  - `app/page.tsx` : réécriture complète — hero texte spec, 6 sections, UTF-8 réel, imports harmonisés.
  - `components/ui/select.tsx` : shadcn Radix Select créé. `ApartmentSearchBar` + `ApartmentFiltersDrawer` convertis.
  - Globals.css : overrides select/option natifs + `@keyframes fade-out-up`.
  - ESLint : 2 erreurs fixées (unescaped entities, unused imports).
  - Dark mode : sélecteurs shadcn + CSS `color-scheme:dark` fonctionnels.
- **Packages hero overlay** : `bg-black/70` remplacé par `bg-gradient-to-b from-black/20 via-black/35 to-black/55`, image passée à `opacity-55`, titre avec `drop-shadow` pour lisibilité.

### Done (this session)
- **Base schema compatibility — Réservations** (build 59 pages, 0 errors, 0 lint) :
  - Cause racine identifiée : migration `20260710_reservations_module_lot1.sql` jamais exécutée → `RESERVATION_COLUMNS` référençait 40 colonnes dont ~30 inexistantes
  - `RESERVATION_COLUMNS` réduit aux 10 colonnes du schéma base
  - `mapReservation` : mappe `reservation_status` DB → `status` code
  - Type `Reservation` : champs enrichis rendus optionnels
  - `normalizeReservationInput` : seulement colonnes base ; `nights` (generated) exclu
  - `changeReservationStatusAction` / `checkReservationAvailabilityAction` : `reservation_status` au lieu de `status`
  - `createPaymentAction` : statuts anglais (`draft`, `confirmed`) au lieu du français
  - Event handlers interdits extraits en client components : `ReservationFilters`, `DeleteReservationForm`
  - Détail réservation : sections adaptées aux colonnes disponibles
- **Accommodation revenue** : `createAccommodationRevenueAction` avec payload explicite ; `AccommodationRevenueForm` client component ; UUID helpers ; `optionalUuid` dans schéma paiement
- **Package reservations** : `getPackageReservations` ajoutée dans data layer
- **Lead detail page** : section réservations liées ajoutée
- **Package detail page** : section réservations liées ajoutée
  - Tokens CSS : `--popover`/`--popover-foreground` ajoutés (dark + light) et enregistrés dans `@theme inline`.
  - Composants shadcn créés : `dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `command.tsx`, `dropdown-menu.tsx` — tous avec `bg-popover text-popover-foreground`, animations `fade-in-down`/`fade-out-up`, hover gold, palette Yakout.
  - `button.tsx` : `hover:bg-[#e8c86a]` → `hover:bg-gold-light` (hardcoded hex supprimé).
  - `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip`, `@radix-ui/react-dropdown-menu`, `cmdk` installés.
  - Dépendances : 5 packages ajoutés, `package.json` à jour.
- **Conversion Lead → Propriétaire corrigée V3** (build 62 pages, 0 errors, 0 lint) :
  - **Migration V3** (`20260708_atomic_lead_owner_conversion_v3.sql`) :
    - RPC `convert_lead_to_owner` : `security definer` + `set search_path = public, auth`
    - `auth.uid()` check au début (rejette les appels non authentifiés avec code `42501`)
    - `revoke execute from public, anon` + `grant execute to authenticated`
    - Colonnes adaptées au schéma réel : `owners.full_name` (pas `name`), `owners.company_id`, `leads.updated_at`
    - Normalisation téléphone simplifiée : chiffres uniquement
    - Flow atomique : FOR UPDATE → lookup lead_id/email/phone → create si nécessaire → link → return
  - **Action Next.js** (`owner-actions.ts`) :
    - Utilise `createSupabaseActionClient()` (client serveur auth, cookies) au lieu du client admin
    - Vérifie la session auth avant d'appeler la RPC
    - Log complet de l'erreur RPC (code, message, details, hint)
    - Messages d'erreur contextualisés : "La conversion en proprietaire n'a pas pu etre effectuee."
  - **Page lead** : `FormErrorBanner` déplacé au niveau page (hors carte "Modifier le lead")
  - `updateLeadAction` supprime déjà `owner_id`/`converted_at` (inchangé, confirmé)
  - `dropdown-menu.tsx` : imports inutilisés nettoyés

### Blocked
- Migrations SQL non exécutées (pas d'accès Supabase Dashboard).

## Key Decisions
- `localhost:3000` fallback conservé dans `robots.ts`, `sitemap.ts` — contrôlé par `NEXT_PUBLIC_SITE_URL` en production.
- Ancien `components/public/apartment-card.tsx` non supprimé immédiatement — stabilité après changement d'import.
- LOT 1 prioritaire avant refonte visuelle (comme demandé).
- Overlay hero packages : gradient simple `black/20→35→55` + drop-shadow titre plutôt que le complexe radial+linéaire à 86-98% d'opacité.

## Next Steps
1. LOT 2 — Consolider design system : tokens CSS, shadcn Dialog/Command/Popover, standardiser boutons/cards/layout.
2. LOT 3 — Pages prioritaires : transport, services, contact, blog, créer `/proprietaires`.
3. LOT 4 — Dashboard UX : sidebar labels, tableaux adaptatifs, fiches 360°, zone dangereuse séparée.
4. LOT 5–7 — Tests responsive (360–1920px), accessibilité (WCAG AA), SEO, Lighthouse, rapport final.
5. Exécuter migrations SQL dans Supabase SQL Editor.

## Critical Context
- `Error.message` non-enumerable → extraction explicite des props dans logger.
- Bucket `yakout-private` privé, signed URLs 10min, `insertWithCompany()` bypass RLS.
- `desired_date` dans `leadSchema` : preprocess vide→undefined.
- `schema.sql` n'a PAS `public_status` — migration `20260702_apartments_business_module.sql` non exécutée. Fallback `is_published`.
- SEO localhost contrôlé par `NEXT_PUBLIC_SITE_URL` — définir sur Vercel pour prod.
- Dark mode select fix en place : shadcn Select + `color-scheme:dark` sur `<html>` + classes document.

## Relevant Files
- `components/public/packages/packages-experience.tsx` : hero overlay corrigé.
- `components/layout/site-header.tsx` : nav 13px, accents, CTA gold "Confier mon bien".
- `components/layout/site-footer.tsx` : 4 colonnes, accents, pas "Espace Maria".
- `lib/constants/site.ts` : meta/hero sans "Chauffeur Privé".
- `app/page.tsx` : réécrit 6 sections, UTF-8, hero spec.
- `components/ui/select.tsx` : créé, shadcn Select.
- `app/globals.css` : select overrides + keyframes.
-->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
