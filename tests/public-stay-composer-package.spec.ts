import { expect, test } from "@playwright/test";

test("un pack sélectionné n’est pas redemandé", async ({ page }) => {
  await page.goto("/contact?type=package&package=escapade-romantique-marrakech");
  await expect(page.getByText(/budget/i)).toHaveCount(0);
  await expect(page.getByText("Choisissez votre pack")).toHaveCount(0);
});
