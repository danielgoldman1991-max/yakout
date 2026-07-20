import { expect, test } from "@playwright/test";

test("un appartement vérifié supprime les questions redondantes", async ({ page }) => {
  await page.goto("/contact?type=package&apartment=appartement-hivernage-elegance");
  await expect(page.getByText(/budget/i)).toHaveCount(0);
  await expect(page.getByLabel(/quartier préféré/i)).toHaveCount(0);
  await expect(page.getByLabel(/chambres souhaitées/i)).toHaveCount(0);
  await expect(page.getByLabel(/^destination$/i)).toHaveCount(0);
});
