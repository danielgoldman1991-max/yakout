# Cartographie financière actuelle

## Conclusion d’audit

Le dépôt contient quatre sources concurrentes de vérité : `payments`, les colonnes financières de `reservations`, les lignes `expenses` et les documents `owner_payouts`. Les modules transport, packs et propriétaires recalculent ensuite leurs propres agrégats. Cette architecture permet le double comptage et produit des significations différentes pour « payé », « recette » et « remboursement ».

| Source | Écriture actuelle | Lectures principales | Formule actuelle | Divergence / risque | Décision |
|---|---|---|---|---|---|
| `payments.amount/status/payment_type` | `createPaymentAction`, `createAccommodationRevenueAction`, CRUD générique | paiements, réservation, calendrier | payé moins lignes remboursées | essentiellement orienté entrées, statuts historiques libres | registre canonique entrées/sorties |
| `reservations.deposit_amount` | assistant réservation et création couplée paiement/réservation | calendrier, rapports, propriétaires | assimilé à encaissé | document commercial utilisé comme trésorerie | lecture dépréciée, synthèse dérivée des allocations |
| `reservations.remaining_amount` | colonne générée depuis l’acompte | calendrier, rapports finance/hébergement | total − acompte | ignore remboursements et paiements multiples | ne plus utiliser comme source financière |
| `reservations.payment_status` | colonne générée | filtres calendrier et rapports | statut dérivé de l’acompte | vocabulaire divergent et impossible à rapprocher | adaptateur temporaire uniquement |
| `expenses` | CRUD dépenses direct | appartement, propriétaires, rapports | somme des lignes `paid` | ligne métier confondue avec décaissement | document à payer ; règlement = `payments.outflow` |
| `owner_payouts` | actions owner-reporting | fiche propriétaire, rapports | somme des documents `paid` | trésorerie parallèle | conserver le document, créer une allocation `owner_payout` |
| `trips` / `transfers` | CRUD transport | fiches et rapports transport | vendu − coût / `payment_status` local | coût prévu et flux réel mélangés | prix commercial conservé ; flux dans `payments` |
| `packages` / `package_items` | CRUD packs | packs et rapports | prix et coûts des composants | aucune preuve de mouvement réel | documents commerciaux + allocations |
| `maintenance_tasks` | module propriétaires | reporting propriétaire | coût de tâche | prévu et payé non distingués | coût prévu conservé ; sortie réelle dans `payments` |
| rapports hébergement | lecture réservations | PDF/XLSX/dashboard | acompte et solde générés | contredit le registre | migrer vers synthèse centrale |
| rapports propriétaires | réservations + dépenses + taux fixe 20 % + payouts | dashboard/PDF/XLSX | formules locales | taux codé en dur et double comptage | documents attendus séparés des flux réels |

## Écritures à interdire progressivement

- Toute création d’un mouvement réel directement dans `expenses` ou `owner_payouts`.
- Toute modification manuelle de `deposit_amount`, `remaining_amount` ou `payment_status` pour représenter un encaissement.
- Toute suppression d’une transaction finalisée ; utiliser une contrepassation.
- Toute somme réunissant plusieurs devises.

## Risques prioritaires

1. `createPaymentAction` peut créer une réservation avec un acompte puis créer un paiement : deux représentations du même flux.
2. Les rapports propriétaires comptent les réservations, les dépenses et les reversements sans registre commun.
3. Les remboursements historiques sont parfois un statut du paiement initial plutôt qu’une nouvelle sortie.
4. Les commissions à 20 % sont recalculées localement dans plusieurs fichiers.
5. Les statuts `partial`, français et anglais coexistent.

## Décision LOT 1

Faire évoluer `payments`, sans créer une nouvelle table concurrente. Ajouter `payment_allocations`, une RPC atomique, un audit immuable, une vue de rapprochement et une synthèse TypeScript commune. Les anciennes sources restent lisibles jusqu’à leur migration contrôlée, mais ne constituent plus la cible architecturale.
