# Règles métier de référence

## Identités

- Un lead est conservé après conversion.
- Un client et un owner ont leur propre UUID ; ces identifiants ne sont jamais interchangeables.
- Les routes publiques utilisent des slugs, les routes internes utilisent des UUID.
- Toute donnée dashboard est limitée à la société du profil connecté.

## Appartements et réservations

- Seuls les appartements publiés sont publics.
- Les champs privés ne sont jamais sélectionnés ni accessibles publiquement.
- Une réservation référence un appartement et un client réels.
- L’intervalle de séjour est `[check_in, check_out)` et autorise départ/arrivée le même jour.
- Capacité, minimum de nuits et conflits sont validés côté serveur.
- Une annulation conserve l’historique.

## Finance

- Réservé, facturé, encaissé et remboursé sont des grandeurs différentes.
- `pending` n’est pas encaissé ; `paid` l’est ; un remboursement réduit l’encaissé.
- Aucun rapport ne transforme une erreur ou une valeur absente en zéro certifié.
- Les paiements et revenus d’hébergement ne sont pas additionnés deux fois.
- Commission et reversement nécessitent une base contractuelle et une devise cohérente.

## Transport et packs

- La commande client, l’exécution opérationnelle et les ressources sont des entités distinctes.
- Prix client, coût et marge sont séparés.
- Un pack catalogue n’est pas un booking ; les composants générés ne doivent pas être comptés deux fois.

## Rapports

- Chaque KPI possède une formule, un périmètre de statuts et une source documentés.
- Écran, impression, PDF et XLSX doivent partager le même jeu de données et les mêmes calculs.
- Un rapport en erreur n’est ni affiché à zéro ni certifié/exporté.

