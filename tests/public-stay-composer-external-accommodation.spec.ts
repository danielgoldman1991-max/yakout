import { expect, test } from "@playwright/test";

test("l’hébergement externe est demandé une seule fois", async ({ page }) => {
  await page.goto("/contact?type=package");
  await page.getByRole("textbox", { name: "Date d’arrivée*" }).type("10082027");
  await page.getByRole("textbox", { name: "Date de départ*" }).type("14082027");
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByText("J’ai déjà mon hébergement", { exact: true }).click();
  await expect(page.getByLabel("Hôtel, riad ou résidence")).toHaveCount(1);
});
