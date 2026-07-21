import { test } from "@playwright/test";
import { assertCalendarPayment, paymentFixture, recordPayment } from "./helpers/payment-calendar-sync";

test("un paiement encaissé de 1 500 MAD solde immédiatement le calendrier et persiste après rechargement", async ({ page }) => {
  const fixture = paymentFixture("FULL");
  await recordPayment(page, fixture.reservationId, "1500");
  const expected = { status: "Payé", paid: /Encaissé\s*1[\s ]?500[,.]00\s*MAD/i, balance: /Solde\s*0[,.]00\s*MAD/i };
  await assertCalendarPayment(page, fixture, expected);
  await page.reload();
  await assertCalendarPayment(page, fixture, expected);
});
