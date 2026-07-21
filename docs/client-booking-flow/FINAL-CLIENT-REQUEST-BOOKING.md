# Parcours Lead → Client → Réservation

## État initial

La conversion était réalisée en plusieurs écritures depuis une action utilisant le client administrateur. Un échec entre la création du client et la mise à jour du lead pouvait laisser un état partiel. Le lead passait au statut `Confirme`, sans `converted_at` ni `converted_by`. La fiche client affichait les leads, mais obligeait à quitter la page pour créer une réservation. Les packs étaient des objets catalogue et les `trips` des trajets opérationnels ; aucune table de commande pack ou transport n’existait dans le schéma de base.

## État implémenté

- `convert_lead_to_client(uuid)` verrouille le lead, retrouve ou crée le client dans la même organisation, lie le véritable `clients.id`, conserve la demande et renseigne la conversion.
- La fiche client utilise `getClient360Data()` et distingue les demandes à traiter.
- Un Dialog de 680 px sur desktop, plein écran sur mobile, permet de créer une réservation sans quitter la fiche.
- Le formulaire reprend les dates, voyageurs, appartement, pack, transport, lieux, vol, message et estimation disponibles dans le lead ou son `metadata`.
- Les réservations d’appartement conservent `client_id`, `lead_id`, `source_request_id`, un snapshot de la demande, `created_by` et une clé d’idempotence.
- `package_bookings` représente une commande de pack sans modifier `packages`.
- `transport_bookings` représente la commande client sans créer de `trip`.
- Les demandes composites peuvent créer plusieurs composantes dans une seule fonction transactionnelle.
- La disponibilité, la capacité, les dates, l’organisation et les doublons sont vérifiés côté base.
- Le tarif inconnu reste `NULL`. Aucun paiement et aucun acompte fictif ne sont créés.
- `revalidateClientBookingGraph()` actualise client, lead, réservations, calendrier, appartements, packs, transport, dashboard et rapports.

## Sécurité et permissions

Les deux RPC vérifient `auth.uid()` et l’organisation. Leur exécution est retirée à `public` et `anon`, puis accordée à `authenticated`. L’action serveur vérifie aussi le rôle `admin` ou `manager`. Les nouvelles tables ont la RLS et des politiques limitées à `current_company_id()`.

## Statuts et idempotence

Le statut de traitement de la demande est séparé du statut de réservation : `new`, `qualified`, `converted`, `booking_pending`, `partially_booked`, `booked`, `declined`, `cancelled`. La clé stable `lead:<UUID>:primary` reçoit un suffixe par composante. Un double envoi converge donc vers les mêmes lignes.

## Validation locale

- Lint : aucune erreur ; six avertissements préexistants hors de ce parcours.
- Build Next.js : réussi avant les derniers ajouts de loader/tests, à revalider en clôture.
- Tests unitaires : classification de demande, clé stable et statuts traités ajoutés.

## Risques résiduels

- La migration `20260721122103_client_request_booking_flow.sql` n’est pas appliquée au projet Supabase Yakout depuis cette session.
- Les scénarios Playwright avec authentification et vraies données ne peuvent pas être validés sans environnement Supabase Yakout accessible.
- Le loader CRM historique journalise certaines sous-requêtes indisponibles et retourne des listes vides ; une prochaine passe devra rendre chaque sous-erreur explicite dans `Client360Result`.
- La section « Origine de la réservation » sur la fiche réservation reste à ajouter après application de la migration et exposition des nouvelles colonnes au data layer.

Le parcours ne doit être considéré comme validé en production qu’après application de la migration et réussite d’un scénario réel lead → client → réservation sur le projet Yakout.
