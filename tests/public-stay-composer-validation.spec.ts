import { expect, test } from "@playwright/test";

test("les dates incohérentes sont expliquées sans exiger de champ caché", async ({ page }) => {
  await page.goto("/contact?type=package");
  await page.getByRole("textbox", { name: "Date d’arrivée*" }).type("14082027");
  await page.getByRole("textbox", { name: "Date de départ*" }).type("10082027");
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("La date de départ doit être après l’arrivée.")).toBeVisible();
  await expect(page.getByLabel(/numéro de vol/i)).toHaveCount(0);
});
