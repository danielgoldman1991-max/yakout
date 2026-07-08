# Modèle De Données Réel

Inspection live Supabase : bloquée dans cet environnement, le build montre des erreurs réseau `EACCES` sur les lectures Supabase.

Source locale consultée : `database/schema.sql`.

Tables métier visibles localement :

- `companies`, `profiles`, `company_settings`, `activity_logs`
- `clients`, `leads`, `owners`, `apartments`
- `reservations`, `payments`, `expenses`, `owner_payouts`
- `vehicles`, `transfers`, `trips`, `partners`, `packages`, `package_items`
- `documents`, `maintenance_tasks`

Risque : les migrations récentes ne sont pas forcément appliquées en production. Aucun rapport ne doit supposer une colonne sans vérification live préalable.

SQL à exécuter dans Supabase SQL Editor : voir la demande utilisateur, section 4.
