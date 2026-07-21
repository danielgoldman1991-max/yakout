import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";

test("une erreur financière ne devient pas non payé", async ({ page }) => {
  const reservationId = process.env.PLAYWRIGHT_UNAVAILABLE_FINANCE_RESERVATION_ID;
  const from = process.env.PLAYWRIGHT_UNAVAILABLE_FINANCE_FROM;
  const to = process.env.PLAYWRIGHT_UNAVAILABLE_FINANCE_TO;
  test.skip(!reservationId || !from || !to, "Fixture serveur avec synthèse financière indisponible requise.");
  await openReservationCalendar(page, `?from=${from}&to=${to}&search=${reservationId!.slice(0, 8)}`);
  await page.getByRole("button", { name: new RegExp(`RES-${reservationId!.slice(0, 8).toUpperCase()}`) }).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByText("Données indisponibles")).toBeVisible();
  await expect(panel.getByText("Non payé", { exact: true })).toHaveCount(0);
  await expect(panel).not.toContainText(/Encaissé\s*0[,.]00\s*MAD/i);
});
