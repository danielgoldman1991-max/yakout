# Registre des anomalies

| ID | Module | Gravité | Description et preuve | Cause racine | Correction attendue | Statut |
|---|---|---:|---|---|---|---|
| SEC-001 | Appartements/RLS | P0 | La policy publique autorise toute ligne `is_published=true`; RLS ne masque pas `address_private`, `wifi_password`, `internal_notes`, `commission_rate`. Preuve : `database/policies.sql`. | table publique mixant colonnes publiques/privées | vue `security_invoker` ou privilèges colonnes + test anon | Ouvert, base non introspectée |
| FIN-001 | Rapports | P0 | valeurs absentes/non numériques converties en `0`. Preuve : `lib/reports/safe-values.ts`. | contrat de résultat sans état unavailable/error | type résultat explicite et blocage certification/export | Ouvert |
| DATA-001 | Loaders | P1 | erreurs Supabase remplacées par mocks pour appartements, paiements, dépenses et contenu. Preuve : appels `publicFallback(...mock*)` dans `lib/data/index.ts`. | stratégie de démonstration restée active | supprimer les mocks runtime, fournir état d’erreur | Ouvert |
| DATA-002 | Loaders métier | P1 | de nombreux échecs deviennent `[]`. Preuve : `lib/data/owners.ts`, `apartments.ts`, `owner-reporting.ts`. | signature ne représente pas l’erreur | résultat discriminé `{data,error}` | Ouvert |
| QA-001 | Playwright | P1 | commande obligatoire impossible : module `@playwright/test` absent. | dépendance runner non installée | installer/pinner runner et config | Ouvert |
| STATUS-001 | Réservations/paiements | P1 | coexistence de `Pre-reservation`, `Confirmée`, `confirmed`, `Paye`, `paid`, etc. | migrations progressives sans frontière de compatibilité unique | normalisation DB + domaine unique | Ouvert |
| CACHE-001 | Mutations | P1 | revalidations dispersées et incomplètes, sans graphes partagés. | logique dupliquée dans les actions | fonctions de revalidation par agrégat | Ouvert |
| ARCH-001 | Schéma | P1 | `schema.sql` ne représente pas les migrations dont dépend le code. | absence de snapshot régénéré | introspection, migration list, schéma canonique | Ouvert |
| UX-001 | Erreurs | P2 | tableaux et KPI peuvent afficher vide/zéro lors d’une panne. | erreurs avalées | états erreur explicites | Ouvert |
| PROC-001 | Transport | P2 | booking transport distinct du trajet non confirmé. | table/processus absent | spécifier puis implémenter sans confondre lead/transfert/trip | Ouvert |
| PROC-002 | Packs | P2 | pack booking distinct du catalogue non confirmé. | table/processus absent | modèle de booking et orchestration | Ouvert |

