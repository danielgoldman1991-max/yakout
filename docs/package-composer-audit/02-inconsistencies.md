# Incohérences et remédiations

| Priorité | Champ / logique | Problème initial | Conséquence | Correction | Preuve |
|---|---|---|---|---|---|
| P0 | Destination transfert | Texte libre sans relation fiable | Mauvaise destination opérationnelle | Destination dérivée de `apartment_id` ou du mode d’hébergement | Test appartement/transfert |
| P0 | Prix | Valeurs codées en dur et inconnues additionnées | Montant trompeur | État indisponible explicite, jamais `0 MAD` | Test défaut |
| P0 | Soumission | Pas d’identifiant d’opération | Doubles demandes | `operation_id` vérifié côté serveur | Route stay-requests |
| P1 | Budget | Demandé et stocké | Friction inutile | Supprimé de l’UI et du payload du compositeur | Test défaut |
| P1 | Aller-retour | Un seul bloc ambigu | Vol retour inexploitable | Deux objets `arrival` et `departure` | Test transfert |
| P1 | Champs cachés | Structure non discriminée | Validation contradictoire | Unions discriminées Zod | Test validation |
| P1 | Hébergement externe | Destination susceptible d’être redemandée | Doublon et divergence | Lieu saisi une fois puis réutilisé | Test externe |
| P1 | Services | Catalogue fictif codé en dur | Offre incohérente | Services publiés chargés depuis Supabase | Test services/UI |
| P2 | Longueur | 7 étapes | Abandon mobile | 5 étapes maximum | Test défaut |
| P2 | Consentement | Précoché | Consentement invalide | Case non précochée et lien confidentialité | Test contact |
| P2 | Mobile | Résumé collant encombrant | Collision et perte de contexte | Résumé compact dépliable, safe-area | Test responsive |
