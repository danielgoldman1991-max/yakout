# Diagnostic initial du calendrier

Audit du 20 juillet 2026 sur `/dashboard/reservations/calendar`.

## Limite de la capture automatisée

La session navigateur de test n’était pas authentifiée et a été redirigée vers `/login`. Les trois captures `before-*` documentent donc cet état d’accès. L’audit fonctionnel détaillé a été réalisé sur le code et le schéma local. Aucune capture de données privées n’a été fabriquée.

## Pourquoi les réservations paraissaient invisibles

La page appelait `getReservations()` sans période. Ce loader renvoyait `[]` pour toute erreur Supabase, rendant une panne identique à un mois réellement vide. La page filtrait ensuite localement et limitait arbitrairement à 100 lignes. Les événements étaient des liens de 10 px ne montrant que le numéro dérivé de l’ID.

## Pourquoi les appartements étaient invisibles

Aucune requête ne chargeait les appartements comme ressources. Le calendrier mensuel ne disposait ni d’une ligne par appartement ni du titre, quartier, capacité ou statut opérationnel. Une réservation sans appartement était simplement indiscernable.

## Incohérences techniques

- Mapping `reservation_status` → `status`, puis comparaison uniquement avec des statuts anglais.
- Aucun voyageur joint et aucun `apartment_id` visible.
- Aucune distinction entre erreur, absence et données partielles.
- Aucun chargement borné côté Supabase sur la période visible.
- Aucun conflit détecté.
- Maintenance absente.
- Paiement utilisé comme texte, sans état « indisponible ».
- Grille 7 colonnes fixe, textes essentiels de 10 px, inutilisable comme planning mobile.
- Aucun filtre métier, aucun KPI, aucun panneau de détail, aucune vue agenda ou occupation.

## Schéma réellement disponible

La compatibilité est basée sur les colonnes de base présentes dans `database/schema.sql` : réservations (`apartment_id`, `client_id`, dates, voyageurs, montants, `payment_status`, `reservation_status`), appartements, clients et `maintenance_tasks` (`due_date`, priorité, statut). Les tables `apartment_blocks` et `owner_blocks` ne sont pas définies dans le schéma local et n’ont pas été inventées.
