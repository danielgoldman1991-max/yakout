import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("le rechargement conserve la synthèse", async ({ page }) => { await openReservationCalendar(page); await page.reload(); await expect(page.getByText("Calendrier des séjours")).toBeVisible(); });
