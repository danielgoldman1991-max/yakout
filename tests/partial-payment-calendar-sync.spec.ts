import { test } from "@playwright/test";
import { assertCalendarPayment, paymentFixture, recordPayment } from "./helpers/payment-calendar-sync";

test("un acompte encaissé de 500 MAD laisse exactement 1 000 MAD au calendrier", async ({ page }) => {
  const fixture = paymentFixture("PARTIAL");
  await recordPayment(page, fixture.reservationId, "500");
  const expected = { status: "Partiellement payé", paid: /Encaissé\s*500[,.]00\s*MAD/i, balance: /Solde\s*1[\s ]?000[,.]00\s*MAD/i };
  await assertCalendarPayment(page, fixture, expected);
  await page.reload();
  await assertCalendarPayment(page, fixture, expected);
});
