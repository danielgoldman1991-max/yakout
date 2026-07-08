# Anomalies D'Intégrité

Statut : première version statique, sans accès live Supabase.

Anomalies bloquantes confirmées dans l'état initial :

- Exports PDF/XLSX disponibles avant certification.
- Impression accessible par URL directe avant blocage.
- Calculs financiers dispersés dans `lib/reports/data/*`.
- Conversions numériques pouvant masquer une absence de donnée critique.
- Absence de SQL de référence par rapport.
- Absence de snapshots immutables pour les exports.
- Absence de tests Playwright reporting.

Corrections déjà appliquées :

- Exports PDF/XLSX bloqués avant certification.
- Impression directe bloquée avant certification.
- Conversions `Number(... ?? 0)` détectées par l'audit supprimées.
- Erreurs Supabase remontées explicitement dans les principaux loaders.

Anomalies à confirmer en base :

- Réservations sans appartement.
- Paiements sans réservation ou sans date de paiement.
- Dépenses sans entité ou responsable financier.
- Reversements sans lignes sources.
- Mélanges de devises.
- Incohérences `company_id` / organisation.
