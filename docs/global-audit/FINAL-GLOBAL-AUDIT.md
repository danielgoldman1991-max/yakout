# Audit global Yakout — synthèse exécutive

Date : 20 juillet 2026

## Verdict

L’application compile et son périmètre fonctionnel est important, mais elle n’est pas encore certifiable pour une mise en production métier complète. Deux risques P0 et plusieurs risques P1 doivent être traités ou levés par preuve.

## Score actuel

| Domaine | Score | Motif principal |
|---|---:|---|
| Fonctionnel | 72/100 | Couverture large, parcours transport et packs non démontrés de bout en bout |
| Métier | 62/100 | Statuts mixtes et invariants peu centralisés |
| Technique | 68/100 | Build sain, dérive possible entre schéma et migrations |
| Financier | 45/100 | Valeurs inconnues transformables en zéro |
| UX | 70/100 | Interfaces riches, erreurs parfois masquées en état vide |
| Sécurité | 55/100 | Bonne intention RLS, exposition des colonnes publiques à confirmer |
| QA | 35/100 | Unitaires présents, infrastructure E2E actuellement inexécutable |
| **Global pondéré** | **58/100** | **Go conditionnel interdit tant que les P0 restent ouverts** |

## Bloquants P0

1. **Exposition publique potentielle des colonnes privées d’appartement.** La policy RLS repérée filtre les lignes publiées mais pas leurs colonnes. Il faut vérifier les grants réellement déployés, puis restreindre l’API publique à une vue ou RPC aux colonnes autorisées.
2. **Fiabilité financière.** Les helpers qui transforment une valeur absente ou invalide en zéro peuvent produire des rapports crédibles mais faux. Les états `inconnu`, `indisponible` et `zéro réel` doivent être distincts.

## P1 prioritaires

- Supprimer les mocks des chemins runtime de production.
- Remplacer les retours `[]` sur erreur par des résultats typés distinguant erreur et absence.
- Installer et configurer le runner Playwright, puis couvrir authentification, rôles, isolation d’entreprise, réservations, paiements et documents.
- Centraliser les statuts et transitions.
- Établir un schéma canonique et une vérification automatique des migrations déployées.
- Tester l’invalidation de cache après chaque mutation métier.

## Contrôles exécutés

- Build : réussi.
- Lint : 0 erreur, 4 avertissements.
- Unitaires : 5/5 réussis.
- E2E : bloqué avant exécution (`@playwright/test` absent).
- Recherche de `select("*")` applicatif : aucun résultat dans le périmètre inspecté.
- Inventaire : 81 routes, 74 Server Actions, 28 tables du schéma de base, 32 migrations.

## Décision de mise en production

**NO-GO en l’état pour une exploitation financière et multi-entreprise certifiée.** Le site public peut être démontré en environnement contrôlé, mais les P0 doivent être fermés par correction et preuve, et les parcours critiques doivent disposer de tests E2E reproductibles.

## Plan de remédiation recommandé

1. Introspecter Supabase en lecture seule : tables, colonnes, grants, RLS, policies et migrations.
2. Corriger l’exposition publique des appartements et ajouter un test anonyme de non-divulgation.
3. Introduire un type financier explicite (`known`, `unknown`, `unavailable`) et interdire le fallback silencieux à zéro.
4. Retirer les mocks runtime et rendre les erreurs visibles sans révéler d’information sensible.
5. Normaliser les statuts avec contraintes SQL et transitions serveur.
6. Réparer Playwright et automatiser la matrice d’acceptation.
7. Rejouer build, lint, unitaires, E2E, contrôle RLS et intégrité des données avant un nouveau verdict.

## Limite importante

Aucune donnée de production n’a été modifiée. Sans accès fiable au schéma déployé, l’audit ne prétend pas avoir validé les grants ni les policies réellement actives.
