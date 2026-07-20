# Introspection Supabase déployé

Projet configuré localement : `rplnihauyeifaldcjntx`.

Le connecteur Supabase ne liste pas ce projet parmi les projets accessibles. L’exécution SQL en lecture seule a répondu : `You do not have permission to perform this action`.

Il n’a donc pas été possible de certifier les colonnes, grants, grants par colonne, RLS, policies, vues ou fonctions réellement déployés.

| Contrôle apartments | Résultat |
|---|---|
| RLS déployée | Non prouvé |
| Accès anon | Non prouvé |
| Accès authenticated | Non prouvé |
| Colonnes publiques/privées | Déduites des migrations uniquement |
| Vue publique | Migration préparée, déploiement non prouvé |
| Risque SEC-001 | Ouvert |
