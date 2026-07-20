# Cartographie des entités

## Schéma de base versionné

`database/schema.sql` définit 28 tables : companies, profiles, company_settings, modules, activity_logs, clients, leads, partners, apartments, apartment_images, vehicles, vehicle_images, reservations, trips, transfers, packages, package_items, payments, expenses, documents, site_pages, site_sections, site_settings, media_assets, blog_categories, blog_posts, services et seo_metadata.

## Entités ajoutées par migrations

Les migrations ajoutent notamment owners, maintenance_tasks, owner_statements, owner_payouts, données CRM client, enrichissements appartements/réservations/paiements/documents et reporting. L’application dépend donc d’un schéma post-migrations qui n’est pas reflété intégralement par `schema.sql`.

## Entités demandées non confirmées

Les tables `organizations`, `amenities`, `apartment_amenities`, `contracts`, `transport_bookings`, `drivers`, `package_bookings`, `report_runs` et `audit_logs` ne sont pas confirmées comme tables métier disponibles dans le schéma de référence. Ne pas inventer leurs relations.

## RLS et stockage

- `database/policies.sql` active RLS sur les tables connues et applique une isolation par `company_id` aux utilisateurs authentifiés.
- Les lectures publiques sont filtrées par statut au niveau ligne.
- `yakout-media` est public ; `yakout-private` est utilisé pour les documents avec URL signée.
- Une politique de ligne ne masque pas les colonnes privées d’une ligne publiée. Une vue publique ou des privilèges de colonnes sont nécessaires pour une défense en profondeur.

