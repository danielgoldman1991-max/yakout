import { expect, test } from "@playwright/test";

test("les vols ne s’affichent que pour le transfert choisi", async ({ page }) => {
  await page.goto("/contact?type=package");
  await page.getByRole("textbox", { name: "Date d’arrivée*" }).type("10082027");
  await page.getByRole("textbox", { name: "Date de départ*" }).type("14082027");
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("Vol d’arrivée")).toHaveCount(0);
  await page.getByText("Aller-retour", { exact: true }).click();
  await expect(page.getByText("Vol d’arrivée")).toBeVisible();
  await expect(page.getByText("Vol de départ")).toBeVisible();
  await page.getByText("Aucun transfert", { exact: true }).click();
  await expect(page.getByText("Vol d’arrivée")).toHaveCount(0);
});
