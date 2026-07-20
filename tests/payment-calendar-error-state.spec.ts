import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";

test("une erreur financière ne devient pas non payé", async ({ page }) => {
  await page.route("**/rest/v1/payments**", route => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "forced" }) }));
  await openReservationCalendar(page);
  await expect(page.getByText("Données indisponibles").first()).toBeVisible();
});
