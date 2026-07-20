# Règles métier auditées

1. Toute ressource privée appartient à une entreprise et reste isolée par `company_id`.
2. Une annonce publique n’expose que des colonnes explicitement autorisées.
3. Le départ d’une réservation est postérieur à son arrivée.
4. Deux réservations actives ne se chevauchent pas pour un même bien.
5. Un paiement encaissé possède un montant, une date et une réservation cohérents.
6. Une valeur financière inconnue ne devient jamais zéro par défaut.
7. Une erreur de lecture ne devient jamais une liste vide valide.
8. Les statuts utilisent un vocabulaire canonique partagé.
9. Les documents privés restent dans un stockage privé avec URL temporaire.
10. Toute action sensible vérifie session, entreprise et rôle côté serveur.
