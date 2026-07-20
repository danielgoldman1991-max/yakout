import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("planning par appartement et grille locale", async ({page})=>{await openReservationCalendar(page,"?view=planning&from=2026-07-20&to=2026-08-03");await expect(page.getByTestId("planning-scroll")).toBeVisible();await expect(page.getByText("Appartement",{exact:true})).toBeVisible();});
