# État initial — audit global Yakout

Date : 20 juillet 2026  
Branche : `audit/global-business-processes`  
Commit de départ : `68c2bd6`

## État du dépôt

Le dépôt contenait déjà des changements non commités liés à l’import Airbnb et à la page publique d’un appartement. Ils ont été conservés et ne sont pas attribués à cet audit.

## Validation initiale

- Build Next.js : réussi, 60 routes générées.
- ESLint : 0 erreur, 4 avertissements.
- Tests unitaires : 5 réussis sur 5.
- Tests E2E : non exécutables, car `@playwright/test` n’est pas installé et aucune suite n’est découverte.
- Connexion Supabase pendant le build : échecs réseau/permission, masqués par plusieurs fallbacks applicatifs.

## Inventaire statique

- 81 fichiers de routes : 17 publiques, 60 dashboard, 4 API.
- 28 tables dans le schéma de base et 32 migrations SQL.
- 74 Server Actions exportées.
- Aucun `select("*")` détecté dans les routes et bibliothèques applicatives contrôlées.
- 74 policies SQL et 51 activations RLS détectées.

## Limites de preuve

L’audit statique ne permet pas de certifier les grants, policies et migrations réellement déployés. Toute conclusion dépendant du schéma en production reste « à confirmer » tant qu’une introspection authentifiée et en lecture seule n’a pas réussi.
