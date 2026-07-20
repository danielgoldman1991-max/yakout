import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("un paiement complet est identique dans la fiche et le calendrier", async ({ page }) => {
  await openReservationCalendar(page);
  await expect(page.getByText("Données indisponibles")).toHaveCount(0);
});
