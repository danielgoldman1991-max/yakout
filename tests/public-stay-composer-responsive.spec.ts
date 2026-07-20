import { expect, test } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`aucun débordement horizontal à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto("/contact?type=package");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  });
}
