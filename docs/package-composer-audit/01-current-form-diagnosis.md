# Diagnostic du formulaire initial

Audit réalisé le 20 juillet 2026 sur `/contact?type=package`, avec captures aux formats 360×800, 390×844, 768×1024, 1024×900 et 1440×1000 dans le dossier `before/`.

## Parcours observé

Le formulaire initial comportait 7 étapes : séjour, hébergement, transfert, véhicule/chauffeur, expériences, services et contact. La première étape demandait les dates, les voyageurs, la ville d’origine, un style, un objectif et un budget global. Le récapitulatif additionnait les valeurs locales, dont plusieurs prix codés en dur.

## Problèmes constatés

- Budget demandé et transmis dans `metadata.stay.budget`.
- Transfert aéroport, chauffeur et trajet urbain mélangés.
- Destination libre demandée même lorsqu’un appartement pouvait la déterminer.
- Aller-retour représenté par un seul objet de transfert, sans deux vols distincts.
- Services et prix codés en dur au lieu d’être chargés depuis Supabase.
- 7 étapes et choix secondaires avant les informations opérationnelles.
- Consentement WhatsApp précoché.
- Estimation pouvant agréger des montants inconnus comme zéro.
- Le mode était déduit du paramètre URL avant vérification de l’entité.
- L’API renvoyait la ligne complète du lead après insertion.

## Destination des données

La soumission créait un `lead` dans Supabase via `/api/leads`, avec les détails dans `metadata`. Elle ne créait pas de réservation confirmée. Le nouveau parcours conserve ce modèle métier.
