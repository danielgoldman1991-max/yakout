import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("vue mois conserve ses paramètres URL",async({page})=>{await openReservationCalendar(page,"?view=month&from=2026-07-01&to=2026-08-01");await expect(page).toHaveURL(/view=month/);await expect(page.getByText(/arrivée/)).toBeVisible();});
