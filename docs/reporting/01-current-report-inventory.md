# Inventaire Des Rapports Actuels

Nombre de rapports détectés dans `lib/reports/definitions.ts` : 24.

Statut initial imposé : `suspended`.

Niveau de confiance initial : `incorrect` pour les rapports financiers et opérationnels, `unknown` pour les rapports de qualité, conformité et portefeuille tant qu'ils ne sont pas rapprochés par SQL.

| ID | Titre | Catégorie | Loader | Exports déclarés | Confiance |
| --- | --- | --- | --- | --- | --- |
| executive-dashboard | Tableau de bord exécutif | executive | `getExecutiveDashboard` | écran, PDF, impression | incorrect |
| executive-performance | Performance par activité | executive | `getExecutivePerformance` | écran, PDF, XLSX, impression | incorrect |
| sales-lead-funnel | Entonnoir des leads | sales | `getSalesLeadFunnel` | écran, PDF, XLSX, impression | unknown |
| sales-conversion | Conversion par source | sales | `getSalesConversion` | écran, PDF, XLSX, impression | unknown |
| accommodation-performance | Performance du portefeuille | accommodation | `getAccommodationPerformance` | écran, PDF, XLSX, impression | incorrect |
| accommodation-reservations | Réservations détaillées | accommodation | `getAccommodationReservations` | écran, PDF, XLSX, impression | incorrect |
| accommodation-arrivals-departures | Arrivées et départs | accommodation | `getAccommodationArrivalsDepartures` | écran, impression | unknown |
| finance-revenue-journal | Journal des recettes | finance | `getFinanceRevenueJournal` | écran, PDF, XLSX, impression | incorrect |
| finance-expense-journal | Journal des dépenses | finance | `getFinanceExpenseJournal` | écran, PDF, XLSX, impression | incorrect |
| finance-accounts-receivable | Créances clients | finance | `getFinanceAccountsReceivable` | écran, PDF, XLSX, impression | incorrect |
| finance-result-by-apartment | Résultat par appartement | finance | `getFinanceResultByApartment` | écran, PDF, XLSX, impression | incorrect |
| finance-reconciliation | Rapprochement financier | finance | `getFinanceReconciliation` | écran, PDF, XLSX, impression | incorrect |
| owners-monthly-statement | Relevé mensuel propriétaire | owners | `getOwnerMonthlyStatement` | écran, PDF, XLSX, impression | incorrect |
| owners-consolidated | Rapport consolidé | owners | `getOwnersConsolidated` | écran, PDF, XLSX, impression | incorrect |
| owners-payouts | Reversements propriétaires | owners | `getOwnerPayouts` | écran, PDF, XLSX, impression | incorrect |
| operations-maintenance | Maintenance et incidents | operations | `getOperationsMaintenance` | écran, PDF, XLSX, impression | unknown |
| transport-performance | Performance transport | transport | `getTransportPerformance` | écran, PDF, XLSX, impression | incorrect |
| transport-trips | Trajets détaillés | transport | `getTransportTrips` | écran, PDF, XLSX, impression | incorrect |
| fleet-vehicle-usage | Utilisation des véhicules | fleet | `getFleetVehicleUsage` | écran, PDF, XLSX, impression | incorrect |
| fleet-partner-performance | Performance partenaires | fleet | `getFleetPartnerPerformance` | écran, PDF, XLSX, impression | incorrect |
| packages-sales | Ventes de packs | packages | `getPackagesSales` | écran, PDF, XLSX, impression | incorrect |
| clients-portfolio | Portefeuille clients | clients | `getClientsPortfolio` | écran, PDF, XLSX, impression | unknown |
| compliance-contracts | Contrats expirant | compliance | `getComplianceContracts` | écran, PDF, XLSX, impression | unknown |
| data-quality-overview | Qualité des données | data_quality | `getDataQualityOverview` | écran, PDF, XLSX, impression | unknown |

Anomalies transversales détectées :

- Exports disponibles avant certification.
- Totaux calculés dans plusieurs loaders JavaScript sans SQL de référence.
- Plusieurs `Number(... ?? 0)` et `Number(... || 0)` dans les calculs et exports.
- PDF, XLSX, impression et écran ne sont pas encore garantis depuis un snapshot certifié unique.
