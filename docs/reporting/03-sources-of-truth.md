# Sources De Vérité

- Réservations : `reservations`, pour montant réservé, dates de séjour, nuits, statut, appartement, client et canal.
- Encaissements : `payments`, pour montants réellement payés, dates de paiement, acomptes, soldes, remboursements et statut financier.
- Dépenses : `expenses`, pour montant, catégorie, entité liée, responsable du coût, statut et date.
- Propriétaires : `owners`. Les leads ne sont jamais des propriétaires.
- Biens : `apartments`, avec relation propriétaire réelle à vérifier avant certification.
- Transport : `transfers` et `trips` dans le schéma local ; `transport_bookings` doit être confirmé ou introduit par migration avant usage.
- Packs : `packages` et `package_items`; la commande client doit être confirmée dans le schéma live avant certification.
- Reversements : `owner_payouts` et futures lignes sources détaillées.
- Rapports finalisés : futur snapshot immutable, à introduire avant activation PDF/XLSX officielle.
