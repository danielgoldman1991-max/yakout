import { expect, type Page, test } from "@playwright/test";

type Fixture = { reservationId: string; from: string; to: string };

export function paymentFixture(prefix: "FULL" | "PARTIAL"): Fixture {
  const reservationId = process.env[`PLAYWRIGHT_${prefix}_PAYMENT_RESERVATION_ID`];
  const from = process.env[`PLAYWRIGHT_${prefix}_PAYMENT_FROM`];
  const to = process.env[`PLAYWRIGHT_${prefix}_PAYMENT_TO`];
  test.skip(!reservationId || !from || !to, `Fixture ${prefix} et session dashboard authentifiée requises.`);
  return { reservationId: reservationId!, from: from!, to: to! };
}

export async function recordPayment(page: Page, reservationId: string, amount: string) {
  await page.goto(`/dashboard/reservations/${reservationId}`);
  test.skip(await page.getByRole("button", { name: "Se connecter" }).count() > 0, "Session dashboard authentifiée requise.");
  await page.getByRole("link", { name: "Ajouter paiement" }).click();
  await expect(page.locator('select[name="reservation_id"]')).toHaveValue(reservationId);
  await page.locator('input[name="amount"]').fill(amount);
  await page.locator('select[name="status"]').selectOption("paid");
  await page.getByRole("button", { name: "Creer le paiement" }).click();
  await expect(page).toHaveURL(/\/dashboard\/payments\/[0-9a-f-]+$/i);
  await expect(page.getByText(new RegExp(`${amount.replace(".", "[.,]")}\\s*MAD`, "i")).first()).toBeVisible();
}

export async function assertCalendarPayment(page: Page, fixture: Fixture, expected: { status: string; paid: RegExp; balance: RegExp }) {
  const prefix = fixture.reservationId.slice(0, 8).toUpperCase();
  await page.goto(`/dashboard/reservations/calendar?view=planning&from=${fixture.from}&to=${fixture.to}&search=${prefix}`);
  await page.getByRole("button", { name: new RegExp(`RES-${prefix}`) }).click();
  const panel = page.getByRole("dialog");
  await expect(panel).toContainText(expected.status);
  await expect(panel).toContainText(expected.paid);
  await expect(panel).toContainText(expected.balance);
}
