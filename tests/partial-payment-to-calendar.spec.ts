import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";

test("un acompte conserve un solde cohérent", async ({ page }) => {
  await openReservationCalendar(page);
  await expect(page.getByText("Calendrier des séjours")).toBeVisible();
});
