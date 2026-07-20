# Audit d’intégrité des données

## État

Le contrôle statique est réalisé. Le contrôle SQL live reste non certifié : l’accès Supabase échoue dans l’environnement de build et le schéma déployé n’a pas été introspecté.

## Contrôles à exécuter

Le script `scripts/audit-global-data-integrity.mjs` vérifie sans mutation : propriétaires d’appartements, appartements publiés incomplets, réservations orphelines ou invalides, chevauchements, paiements incohérents et documents orphelins. Une erreur de table/colonne est rapportée comme contrôle indisponible, jamais comme résultat à zéro.

## Constats statiques

- `lib/data/index.ts` utilise encore des jeux `mock*` comme secours lors d’erreurs réelles.
- plusieurs loaders métier retournent `[]` en cas d’erreur ; l’interface ne distingue donc pas « aucun résultat » de « requête échouée ».
- `lib/reports/safe-values.ts` convertit valeurs absentes ou non numériques en `0`, incompatible avec une certification financière sans signal de qualité.
- les statuts français historiques et les statuts anglais normalisés coexistent.

