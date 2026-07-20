# Correction paiement → calendrier

## Cause racine exacte

Deux sources financières concurrentes étaient utilisées. L’écriture créait une ligne dans `payments`, mais le calendrier lisait `reservations.deposit_amount`, `remaining_amount` et `payment_status`, générés depuis l’acompte. La fiche réservation recalculait encore autrement, en ne retenant que le statut exactement égal à `paid`. L’invalidation après paiement n’incluait pas le calendrier.

Le formulaire générique présentait un second défaut : `reservationId` était validé depuis l’URL, mais pas appliqué au sélecteur `reservation_id`. Le flux « hébergement » transmettait correctement le véritable UUID.

## Nouvelle source de vérité

- `payments` fournit les encaissements et remboursements réels.
- `reservations` fournit le total réservé, le séjour, l’appartement et le voyageur.
- `computeReservationFinancialSummary` est la formule centrale pure.
- `getReservationFinancialSummaries` charge les paiements de plusieurs réservations en une requête, sans N+1.
- Calendrier, panneau latéral, fiche réservation et liste des réservations utilisent désormais cette synthèse.

Formule : `netPaid = grossPaid - refunded`, puis `balanceDue = max(total - netPaid, 0)`. Les statuts pending, failed, cancelled, draft et voided ne sont jamais encaissés.

## Compatibilité et normalisation

Les anciennes valeurs `Paye`, `Payé`, `completed`, `encaissé`, `succeeded`, `En attente`, `remboursé`, `annulé` et `voided` sont normalisées temporairement. La migration idempotente prépare les statuts canoniques et une vue `reservation_financial_summary_v` en `security_invoker`.

## Interface et erreurs

Le panneau affiche Total, Encaissé net, Remboursé, Solde et le statut canonique. Si la lecture des paiements échoue, tous les montants financiers deviennent indisponibles : l’interface ne transforme jamais l’erreur en « Non payé / 0 MAD ».

## Cache

`revalidatePaymentGraph` invalide paiements, réservations, calendrier, dashboard financier, rapports et, lorsqu’ils sont connus, paiement, réservation, appartement, client et propriétaire.

## Rapprochement

`scripts/reconcile-reservation-payments.mjs --dry-run` compare les paiements réels aux champs historiques et signale les paiements sans réservation. Le mode `--apply` est volontairement refusé avec le schéma actuel : les snapshots sont des colonnes générées depuis `deposit_amount`. Modifier l’acompte pour simuler un paiement serait incorrect.

## Vérifications et limites

- Les tests purs couvrent aucun paiement, pending, acompte, complet, multiples, remboursements partiel/total, trop-perçu, devise incompatible, montant invalide et statuts historiques.
- Les scénarios Playwright paiement complet, acompte, cache et erreur sont présents.
- ESLint : réussi. TypeScript : réussi. Build Next.js : réussi, 60 pages. Tests unitaires existants : 5 réussis. Tests financiers Playwright : 11 réussis, 4 scénarios authentifiés ignorés, 0 échec.
- Dry-run : non exécuté contre la base, arrêt contrôlé avec code 2 car `SUPABASE_SERVICE_ROLE_KEY` n’est pas disponible dans l’environnement.
- La base distante, les valeurs réelles, les policies RLS et la migration ne sont pas vérifiables sans session Supabase authentifiée.
- Les fiches appartement/client/propriétaire et certains rapports historiques agrègent déjà `payments`, mais leur propagation complète vers la fonction centrale doit être confirmée contre le schéma déployé.
- Aucun UUID, paiement, réponse SQL ou écart réel n’a été inventé.
- Aucun commit n’a été créé dans le worktree partagé déjà modifié.
