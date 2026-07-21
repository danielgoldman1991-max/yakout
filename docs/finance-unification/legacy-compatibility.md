# Compatibilité financière temporaire

| Source historique | Consommateurs encore présents | Adaptateur / stratégie | Retrait prévu | Preuve exigée |
|---|---|---|---|---|
| `reservations.deposit_amount` | assistant réservation, rapports hébergement/propriétaire | total commercial uniquement ; aucun nouvel encaissement | LOT 2 puis LOT 7 | comparaison synthèse par réservation |
| `reservations.remaining_amount` | calendrier et rapports | remplacer par `getEntityFinancialSummary` | LOT 2 | tests calendrier + rapprochement |
| `reservations.payment_status` | filtres calendrier, rapports | statut central calculé depuis allocations | LOT 2 puis suppression LOT 7 | zéro lecture directe |
| `expenses` | CRUD, appartement, rapports | document à payer ; migration dry-run des lignes payées | LOT 3 | clé `legacy:expenses:<id>:outflow` |
| `owner_payouts.payout_status` | propriétaire et rapports | statut d’approbation du document ; paiement réel séparé | LOT 5 | allocation `owner_payout_id` |
| `trips.payment_status`, `transfers.payment_status` | fiches transport | statut opérationnel temporaire | LOT 4 | marges depuis entrées/sorties allouées |
| statuts historiques de `payments` | toutes les pages finance | backfill canonique dans la migration LOT 1 | LOT 1 | contrainte canonique validée |

Date cible de retrait des adaptateurs : après exécution et certification des LOTS 2 à 6. Aucune date calendaire ne peut être honnêtement fixée avant application de la migration sur une branche Supabase et inventaire des données ambiguës.

Toute utilisation d’une source historique doit être journalisée. Aucun montant absent ne doit devenir `0`, et aucune ligne marquée payée sans preuve ne doit générer automatiquement un mouvement réel.
