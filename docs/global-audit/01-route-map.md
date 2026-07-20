# Cartographie des routes

## Site public

| Domaine | Routes | Source principale | Écriture |
|---|---|---|---|
| Accueil | `/` | appartements, véhicules, packs, contenu | aucune |
| Appartements | `/apartments`, `/apartments/[slug]` | apartments, apartment_images, reservations pour disponibilité | lead via `/api/leads` après demande |
| Transport | `/transport`, `/vehicles`, `/vehicles/[slug]`, `/chauffeur` | vehicles, vehicle_images, transfers | lead |
| Packs | `/packages`, `/packages/[slug]` | packages, package_items | lead |
| Contenu | `/services`, `/blog`, `/blog/[slug]`, `/about`, `/proprietaires` | services, blog_posts, site_pages | lead propriétaire/contact |
| Contact/auth | `/contact`, `/login` | référentiels publics, Supabase Auth | leads/session |

## Dashboard

Les 60 routes dashboard couvrent : vue générale, écosystème, leads, clients, propriétaires, appartements et import, réservations et calendrier, paiements, dépenses, documents, transport, transferts, trajets, véhicules, partenaires, packs, rapports, CMS et paramètres.

Conventions observées :

- routes publiques : slug ;
- routes dashboard : UUID attendu ;
- mutations : principalement `lib/data/actions.ts`, `lib/data/owner-actions.ts` et actions spécialisées ;
- authentification de navigation : proxy/layout ;
- autorisation métier : variable selon l’action, souvent profil puis client admin ;
- revalidation : appels `revalidatePath` dispersés, sans fonction de graphe partagée.

## Routes demandées mais absentes comme modules autonomes

- contrats ;
- reversements globaux ;
- chauffeurs ;
- réservations transport distinctes ;
- réservations de packs ;
- maintenance générale.

Certaines existent comme tables, sections d’une fiche owner ou concepts intégrés, mais pas comme parcours complet. Elles ne doivent pas être déclarées fonctionnelles.

