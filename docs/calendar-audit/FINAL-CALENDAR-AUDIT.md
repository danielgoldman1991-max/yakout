# Audit final du calendrier opérationnel

## Résultat livré

Le calendrier est devenu un cockpit à quatre vues : planning des appartements, mois, agenda et occupation. Le planning est la vue desktop par défaut; l’agenda remplace automatiquement la timeline sur mobile.

## Loader et fiabilité

`getReservationCalendarData(filters)` charge en parallèle une période bornée de réservations, les appartements et la maintenance, avec colonnes explicites et relations facultatives. Une erreur de réservation ou d’appartement produit un état d’erreur et une disponibilité inconnue. Une erreur de maintenance produit un avertissement de données partielles. Aucun mock n’est utilisé.

Le mapper indépendant normalise les statuts, les paiements et les dates SQL, calcule `[check_in, check_out)`, conserve les réservations sans client ou appartement et génère un numéro opérationnel stable depuis l’ID réel lorsque le schéma de base ne possède pas `reservation_number`.

## Décision opérationnelle

- 7 KPI réels : arrivées, départs, en séjour, disponibles, options, paiements à régulariser et conflits.
- Ressource appartement : nom interne, quartier, capacité, statut et occupation de période.
- Barre : numéro, voyageur, voyageurs, paiement et conflit.
- Maintenance distincte des réservations.
- Panneau latéral de détail avec liens vers réservation, paiement et contact.
- Recherche synchronisée dans l’URL.
- Navigation temporelle, aujourd’hui, actualisation et plein écran.
- Légende textuelle : la couleur n’est jamais le seul indicateur.

## Vues

- Planning : colonne appartement et dates sticky, scroll horizontal local, aujourd’hui visible.
- Mois : compteurs arrivées/départs/en séjour/disponibles, trois événements puis « + autres ».
- Agenda : regroupement journalier des arrivées, départs, séjours et interventions; vue mobile.
- Occupation : taux, nuits occupées, disponibles et maintenance, classement par appartement. Les encaissements ne sont pas affichés faute de source certifiée.

## Sécurité, performance et accessibilité

Une requête groupée remplace la requête par appartement. La période est limitée à 366 jours. Le loader utilise le client serveur authentifié et les politiques RLS existantes. Le rendu possède un H1, des labels, des boutons de 44 px, des libellés ARIA complets, un focus visible, un dialogue modal et des états de chargement/erreur/absence distincts.

## Validation

- TypeScript : réussi.
- ESLint : réussi.
- Build Next.js : réussi, 60 pages générées.
- Tests navigateur authentifiés : non exécutables dans la session automatisée disponible, redirigée vers la connexion.
- Accès Supabase distant : bloqué par le réseau du bac à sable pendant le build; aucune erreur n’a été masquée par le nouveau loader.

## Captures

Les captures avant montrent la redirection d’authentification rencontrée. Les captures après ne sont pas revendiquées sans session dashboard authentifiée; aucune donnée ou image factice n’a été créée.

## Risques résiduels

- Les migrations enrichies n’étant pas toutes exécutées, le cockpit reste compatible avec le schéma de base et n’affiche pas les champs inexistants (heures, source, blocs propriétaires).
- `maintenance_tasks` représente une intervention datée, pas un intervalle de blocage. La disponibilité n’est donc pas retranchée au-delà de ce jour.
- Une contrainte d’exclusion PostgreSQL anti-chevauchement n’existe pas dans le schéma audité; les conflits sont signalés mais jamais résolus automatiquement.
