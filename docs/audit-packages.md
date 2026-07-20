# Audit de la page Packs & Séjours

Date : 20 juillet 2026  
Page : `/packages`

## État actuel

La page est fonctionnelle et utilise `next/image`, mais elle affiche six modèles de secours lorsque Supabase ne retourne aucun pack. La hiérarchie est longue : hero plein écran, filtres, aides au choix, six cartes, comparateur, étapes, builder et FAQ.

## Anomalies

| Priorité | Anomalie | Fichier | Correction recommandée | Résultat attendu |
|---|---|---|---|---|
| P0 | Six packs de secours sont présentés comme des offres publiées alors qu’ils ne viennent pas des données métier. | `lib/packages/public-packages.ts` | Limiter le secours à quatre catégories réelles, sans prix ni durée inventés. | Aucun faux tarif, durée ou service. |
| P0 | Agafay, Ourika, city tour, chauffeur demi-journée et capacités 1–6 sont affirmés sans confirmation disponible. | `lib/packages/public-packages.ts` | Retirer ces affirmations des modèles de secours. | Contenu démontrable uniquement. |
| P1 | Le CTA principal ouvre un formulaire et ne transmet pas systématiquement le nom du pack à WhatsApp. | `packages-experience.tsx` | Utiliser le helper WhatsApp centralisé avec un message encodé par pack. | Demande contextualisée sur mobile. |
| P1 | Hero presque plein écran et page très longue avant la décision. | `packages-experience.tsx` | Hero compact, introduction courte, quatre cartes, réassurance et CTA final. | Parcours plus rapide et lisible. |
| P1 | Filtres et comparateur donnent une précision artificielle à des modèles non tarifés. | `packages-experience.tsx` | Les supprimer. | Moins de charge cognitive et aucune comparaison trompeuse. |
| P1 | Accents français absents dans de nombreux titres et libellés. | Page et modèles | Réécrire en UTF-8 français. | Cohérence éditoriale. |
| P1 | Image “fond marocain” utilisée pour Ourika sans représenter clairement l’offre. | `public-packages.ts` | Affecter quatre images locales distinctes et directement liées. | Visuels cohérents, sans répétition. |
| P2 | Cartes très chargées : badges, capacité, durée, timeline, cible, prix et deux CTA. | `packages-experience.tsx` | Conserver image, titre, promesse, 3–5 prestations et un CTA. | Cartes de hauteur homogène. |
| P2 | “Sur estimation” est moins clair que la règle commerciale demandée. | `packages-experience.tsx` | Afficher “Sur devis” quand aucun prix n’existe. | Prix non inventé et attente claire. |
| P2 | Métadonnées sans accents et promesses spécifiques non garanties. | `app/packages/page.tsx` | SEO concret, Open Graph local. | Extrait de recherche fiable. |

## Accessibilité et technique

- Structure H1/H2/H3 présente, mais contenu excessif.
- Liens sans `href="#"`; ancre interne fonctionnelle.
- Images rendues avec `next/image`, `fill` et `sizes`.
- Les boutons filtres ont une cible réduite et aucun `aria-pressed`.
- Aucun message console React observé lors du premier chargement.
