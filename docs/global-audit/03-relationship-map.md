# Cartographie des relations

| Relation | Colonne observée | État |
|---|---|---|
| Lead → Client | `leads.client_id` | présente |
| Lead propriétaire → Owner | `leads.owner_id` par migration | présente si migrations exécutées |
| Owner → Appartements | `apartments.owner_id` | présente par migration |
| Appartement → Réservations | `reservations.apartment_id` | présente |
| Client → Réservations | `reservations.client_id` | présente |
| Réservation → Paiements | `payments.reservation_id` | présente |
| Appartement → Paiements | `payments.apartment_id` | migration requise |
| Appartement → Dépenses | `expenses.apartment_id` | présente |
| Appartement → Maintenance | `maintenance_tasks.apartment_id` | migration requise |
| Owner → Documents | `documents.owner_id` | migration requise |
| Owner → Reversements | `owner_payouts.owner_id` | migration requise |
| Trajet → véhicule/partenaire/client | `trips.vehicle_id`, `partner_id`, `client_id` | présente |
| Trajet → booking transport | aucune relation confirmée | processus incomplet |
| Pack catalogue → composants | `package_items.package_id` | présente |
| Pack → booking | aucune table confirmée | processus incomplet |

Risque structurel : le code doit fonctionner face à un schéma de base partiellement migré. Plusieurs correctifs récents ont déjà réduit des sélections à la version réellement disponible, preuve que la migration et le code ne sont pas synchronisés de façon certifiée.

