import { expect, type Page, test } from "@playwright/test";

export async function openReservationCalendar(page: Page, query = "") {
  await page.goto(`/dashboard/reservations/calendar${query}`);
  const login = await page.getByRole("button", { name: "Se connecter" }).count();
  test.skip(login > 0, "Session dashboard authentifiée requise.");
  await expect(page.getByRole("heading", { name: "Calendrier des séjours" })).toBeVisible();
}
