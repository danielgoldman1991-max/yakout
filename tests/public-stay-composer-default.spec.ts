import { expect, test } from "@playwright/test";

test("parcours par défaut sans budget ni destination", async ({ page }) => {
  await page.goto("/contact?type=package");
  await expect(page.getByRole("heading", { name: "Une demande simple, adaptée à vos choix" })).toBeVisible();
  await expect(page.getByText(/budget/i)).toHaveCount(0);
  await expect(page.getByLabel(/destination/i)).toHaveCount(0);
  await expect(page.getByText("Étape 1 sur 5 · Votre séjour")).toBeVisible();
});
