<!--
## Goal
Améliorer le rendu du contenu blog (paragraphes/listes), personnaliser les formulaires de demande par type, réorganiser le menu dashboard par familles métier, et créer les modules Finance & Documents opérationnels avec upload réel, bucket privé et workflow propriétaire.

## Constraints & Preferences
- Blog : contenu stocké en `\n` brut, rendu via `dangerouslySetInnerHTML` → créer un renderer qui convertit `\n\n` en `<p>`, listes `1.`/`-` en `<ol>`/`<ul>`, sécurisé par `sanitizeHtml`.
- Leads : formulaire `/contact` unique centralisé → `/api/leads` → Supabase `leads`. Mais formulaire dynamique selon `request_type` avec champs spécifiques stockés dans `metadata jsonb`.
- Dashboard nav : remplacer le menu plat par 9 groupes métier.
- Documents upload : vrai upload fichier (PDF, Word, Excel, CSV, images) avec drag & drop, validation client (10Mo max, formats autorisés), upload server action vers bucket `yakout-private` privé, signed URLs pour accès, lien aux entités métier.
- Documents sécurité : bucket privé `yakout-private`, signed URLs 10min, pas de service role côté client, RLS storage pour authenticated + rôle admin/manager/staff.
- Propriétaires & Biens confiés : module complet avec table `owners`, extension `apartments`, tables support (`maintenance_tasks`, `owner_statements`, `owner_payouts`), lead proprietaire → owner → bien confié → contrat → publication → réservations → recettes → dépenses → maintenance → rapport → reversement.
- Aucune modification des pages publiques, auth, design global hors sidebar dashboard.

## Progress
### Done
- **Blog renderer** : `components/blog/blog-content-renderer.tsx` — conversion texte→HTML sécurisé, rendu dans `app/blog/[slug]/page.tsx`.
- **Formulaire leads dynamique** : `components/public/lead-form.tsx` réécrit — 6 types (réservation, chauffeur, véhicule, propriétaire, services, général) avec sections spécifiques, soumission POST `/api/leads`, metadata dans `metadata jsonb`. CTA mise à jour dans `app/apartments/[slug]/page.tsx` et `app/vehicles/[slug]/page.tsx`.
- **Dashboard nav groupée** : `lib/constants/app.ts` → 9 groupes typés avec `DashboardNavGroup`. `components/layout/dashboard-layout.tsx` réécrit — rendu groupé via `NavGroup`, modules futurs désactivés avec badge "À venir", mobile drawer, active state gold.
- **Payments CRUD** : 3 pages (`/dashboard/payments` liste/KPI, `/new` formulaire, `/[id]` détail) — statuts, badges, sélecteurs client/méthode/activité.
- **Expenses CRUD** : 3 pages (`/dashboard/expenses` liste/KPI, `/new`, `/[id]`) — catégories, badges, sélecteurs appartement/véhicule/partenaire.
- **Documents upload réel** : `lib/storage.ts` (upload/signed URL/delete bucket privé), `components/dashboard/document-upload-field.tsx` (drag & drop + validation + preview), 3 pages rewrite (`/dashboard/documents` KPI+9 filtres+signed URLs, `/new` upload réel, `/[id]` signed URLs+remplacement). `lib/data/actions.ts` modifié (upload rollback, cleanup on delete). `next.config.ts` → `serverActions.bodySizeLimit: "10mb"`.
- **PostgrestError logging fix** : `lib/data/index.ts` → `logSupabaseError()` extrait `message`/`details`/`hint`/`code` explicitement contournant non-enumerabilité de `Error.message`.
- **Lead metadata display** : `components/dashboard/lead-metadata-display.tsx` → affichage lisible metadata par type (labels FR, formatage dates/valeurs booléennes) intégré dans `app/dashboard/leads/[id]/page.tsx`.
- **SQL migrations** : 4 migrations créées (`20260701_leads_metadata`, `20260701_finance_documents`, `20260701_documents_storage`, `20260701_owners_module`).
- **Owners module types** : `Owner`, `MaintenanceTask`, `OwnerStatement`, `OwnerPayout` types ajoutés à `types/business.ts`. `owner_id` ajouté à `Lead` type.
- **Owners data layer** : `lib/data/owners.ts` — CRUD owners, owner properties/documents/finances, maintenance tasks, statements & payouts, lead conversion (`convertLeadToOwner`), KPIs (`getOwnersKpi`).
- **Owners server actions** : `lib/data/owner-actions.ts` — `createOwnerAction`, `updateOwnerAction`, `updateOwnerStatusAction` (pipeline), `deleteOwnerAction`, `convertLeadToOwnerAction`, `createPropertyFromOwnerAction`, `createMaintenanceTaskAction`.
- **Owners pages** : `/dashboard/owners` (liste avec 4 KPIs, 6 filtres pipeline, search, table avec WhatsApp), `/dashboard/owners/[id]` (360° vue: header + infos + pipeline selector + biens + finances + documents + réservations + notes + danger zone delete).
- **Lead→Owner conversion** : `app/dashboard/leads/[id]/page.tsx` → bouton "Convertir en propriétaire" pour `request_type=proprietaire`, lien vers `/dashboard/owners/[id]` si déjà converti.
- Build: 0 errors, 50 pages, lint 1 warning (intentional `<img>` blob URL preview).

### Not Done / Blocked
- Migrations SQL non exécutées (pas d'accès Supabase Dashboard).
- Migration CRM 360 (`20260629_clients_crm_360.sql`) non exécutée.

## Key Decisions
- **Blog renderer** : conversion texte→HTML plutôt que `white-space:pre-line` pour support listes sémantiques.
- **Formulaire leads** : champs spécifiques dans `metadata jsonb`, soumission via POST `/api/leads` (pas action server).
- **Document upload** : upload dans server action (pas avant soumission) pour éviter fichiers orphelins, rollback si DB échoue. Bucket privé `yakout-private` distinct.
- **Signed URLs** : générées côté serveur via `createSupabaseAdminClient()`, durée 10min.
- **Logger limitation** : `Error.message` non-enumerable, le spread ne le capture pas. Solution : extraction explicite des propriétés.
- **Propriétaires** : table `owners` dédiée (pas `partners`). Bien confié = `apartments` avec `owner_id` + `management_status` (prospect→published→active→paused).
- **Dashboard nav** : modules futurs intégrés avec `disabled: true`.

## Next Steps
1. Exécuter toutes les migrations SQL dans Supabase SQL Editor.
2. Tester upload documents, soumission leads (6 types), CRUD propriétaires.
3. `npm run dev` + test local avant push Vercel.

## Critical Context
- `Error.message` est non-enumerable en JavaScript. Le spread `...data` dans `logger.ts` ne capture pas `message`. Solution : extraction explicite des props.
- Bucket `yakout-private` privé, signed URLs 10min.
- `insertWithCompany()` = admin client + `getCurrentCompanyId()` → bypass RLS.
- `desired_date` dans `leadSchema` : preprocess vide→undefined.
-->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
