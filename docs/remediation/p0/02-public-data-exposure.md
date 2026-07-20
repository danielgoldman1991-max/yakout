# Exposition des appartements

La table mélange des champs publics et privés (`exact_address`, `address_private`, `wifi_password`, `access_instructions`, `internal_notes`, `commission_rate`, `owner_id`). Une RLS de publication filtre les lignes et non les colonnes.

Correction locale :

- migration `20260720_p0_secure_public_apartments.sql` ;
- révocation des privilèges globaux `anon` ;
- grants anonymes limités aux colonnes publiques ;
- vue `public_apartments_v` avec `security_invoker` et filtre publié ;
- loaders publics dirigés exclusivement vers cette vue ;
- retrait du client admin et des mocks de ces loaders.

La migration contient contrôles et rollback. Elle n’a pas été déployée faute d’introspection/sauvegarde vérifiables.
