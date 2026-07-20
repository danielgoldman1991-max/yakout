import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("affiche les données réelles ou un état vide explicite", async ({page})=>{await openReservationCalendar(page);await expect(page.getByText(/Aucune réservation sur cette période|RES-/)).toBeVisible();});
