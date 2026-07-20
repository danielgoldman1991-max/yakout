# Reproduction

La session navigateur disponible est redirigée vers `/login` et l’environnement ne dispose pas d’un accès Supabase authentifié. Il n’a donc pas été possible de créer légalement un paiement réel ni de relever `reservation.id`, `payment.id`, réponse Supabase, console et serveur pour le cas observé.

## Reproduction statique confirmée

- `createAccommodationRevenueAction` reçoit `reservation_id` et insère une ligne dans `payments`.
- Le calendrier lisait `reservations.deposit_amount`, `remaining_amount` et `payment_status`.
- Dans le schéma de base, ces deux derniers champs sont générés depuis `deposit_amount`, qui n’est pas mis à jour lors de l’insertion dans `payments`.
- Un paiement réel pouvait donc exister tandis que le calendrier affichait encore 0 MAD encaissé.
- Le formulaire générique n’appliquait pas non plus le paramètre URL `reservationId` comme valeur initiale du sélecteur.

## Preuves réelles indisponibles

Les UUID, payload réseau, réponse Supabase et journaux du cas métier restent « non disponibles — authentification requise ». Aucune valeur n’a été inventée. Le scénario Playwright est prêt à être exécuté avec une session dashboard et une base de test autorisées.
