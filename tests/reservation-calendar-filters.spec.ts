import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("recherche synchronisée dans l’URL",async({page})=>{await openReservationCalendar(page);await page.getByPlaceholder("Réservation, voyageur, appartement").fill("RES-");await page.getByRole("button",{name:"Filtrer"}).click();await expect(page).toHaveURL(/search=RES-/);});
