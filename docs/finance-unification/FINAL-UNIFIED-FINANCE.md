# Rapport de progression — finance unifiée Yakout

## Statut

La cible architecturale est définie et le LOT 1 est préparé dans le dépôt. La refonte globale n’est **pas déclarée terminée** : la migration n’a pas encore été appliquée à une branche du projet Supabase Yakout et les consommateurs des LOTS 2 à 7 restent à convertir progressivement.

## 1–6. Sources, divergences et modèle canonique

Les anciennes sources sont cartographiées dans `01-current-financial-map.md`. `payments` devient le registre unique avec direction, statut, catégorie, devise, date, contrepartie, référence, idempotence et traçabilité. `payment_allocations` ventile chaque mouvement vers les documents et entités métier.

## 7. Service central

- RPC atomique `record_financial_transaction(jsonb, jsonb)`.
- Service serveur `recordFinancialTransaction` avec authentification, rôle, validation exacte en centimes et gestion des doublons.
- Revalidation centralisée du graphe financier.

## 8–11. Modules et migrations historiques

- Réservations : adaptateur existant, migration vers allocations au LOT 2.
- Dépenses : script dry-run créé ; aucune écriture live lancée.
- Reversements et remboursements : modèle prévu, backfill reporté aux LOTS 5 et 2 après inventaire réel.
- Compatibilité : décrite dans `legacy-compatibility.md`.

## 12–18. Données, anomalies, rapprochement et sécurité

- Les données ambiguës restent à régulariser ; aucun paiement fictif n’est créé.
- Vue `payment_allocation_reconciliation_v` et script global fournis.
- RLS activée sur allocations et audit ; RPC en `security invoker`, exécution révoquée à `anon`.
- Audit de création inclus. Les transitions, contrepassations et rapprochements seront complétés avant LOT 5.

## 19–20. Calendrier et rapports

Le calendrier possède déjà un adaptateur depuis `payments`, mais lit encore des colonnes historiques pour certaines requêtes et certains filtres. Les rapports hébergement, finance et propriétaires ont encore des formules locales. Ils ne sont donc pas certifiés sur le nouveau registre à ce stade.

## 21–23. Tests, lint et build

Les tests unitaires du modèle canonique couvrent allocation, devise, pending, remboursement et synthèse. Les résultats lint/build doivent être consignés après chaque lot. Les scénarios E2E demandés nécessitent une branche Supabase avec la migration appliquée.

## 24–26. Migration, rollback et risques résiduels

- Migration : `20260721113734_unified_finance_lot1.sql`.
- Rollback recommandé : sauvegarde préalable puis suppression des nouveaux objets seulement si aucun paiement n’a été créé via la RPC. Ne jamais supprimer les mouvements après utilisation réelle.
- Risques résiduels : projet Supabase Yakout inaccessible au connecteur courant, données historiques non inventoriées live, consommateurs LOTS 2–7 encore présents, permissions fines `finance.*` non matérialisées dans le schéma actuel.

## Condition de clôture

Le chantier ne sera terminé qu’après création d’une transaction depuis un module métier et vérification du même montant dans le registre, la fiche concernée, le calendrier ou module métier, et les rapports, avec rapprochement global sans écart inexpliqué.
