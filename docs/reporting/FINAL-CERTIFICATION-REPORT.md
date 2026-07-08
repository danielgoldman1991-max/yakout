# Rapport Final De Certification

Statut actuel : non certifié.

Mode test : activé localement via `REPORTS_ALLOW_UNCERTIFIED_TESTING=true`.

Résumé :

- Rapports existants : 24.
- Rapports incorrects ou non vérifiés : 24.
- Rapports suspendus : 24.
- Rapports certifiés : 0.
- Exports PDF/XLSX : désactivés tant que `REPORTS_CERTIFIED` n'est pas activé et que chaque rapport n'a pas le statut `certified`.
- Impression officielle : désactivée.
- Rapprochement financier : non exécutable sans requêtes SQL de référence et accès à la base live.

Corrections appliquées après le verrouillage initial :

- Les conversions `Number(... ?? 0)` détectées dans le reporting ont été remplacées par des helpers explicites.
- Les loaders critiques échouent désormais explicitement si Supabase renvoie une erreur.
- L'audit `scripts/audit-reporting-integrity.mjs` retourne 0 finding.
- L'API d'export retourne `423` tant que le reporting est suspendu.
- En mode test local, l'API d'export peut retourner PDF/XLSX pour permettre les contrôles de parité, tout en gardant les rapports non certifiés.

Warnings restants hors certification :

- 3 warnings `<img>` existants dans des composants hors reporting.
- 1 warning React Compiler lié à `react-hook-form watch()` dans `components/public/apartment-booking-form.tsx`.

Prochaine étape obligatoire : exécuter l'audit SQL réel, appliquer la migration non destructive de certification, puis certifier les rapports un par un.
