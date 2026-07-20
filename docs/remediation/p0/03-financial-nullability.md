# Nullabilité financière

`FinancialMetric` distingue `known`, `unknown`, `unavailable` et `not_applicable`. Un vrai zéro reste connu ; null, undefined, chaîne vide et valeur non numérique restent inconnus. Addition, devises incompatibles et division par zéro propagent un état non connu.

`optionalNumber` ne retourne plus silencieusement zéro : une source absente ou invalide suspend le rapport via le gestionnaire d’erreur. Les formules historiques restent non certifiées jusqu’à vérification indépendante.
