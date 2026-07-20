import { expect, test } from "@playwright/test";

test("l'API d'export refuse un rapport non certifié", async ({ request }) => {
  const response = await request.post("/api/reports/executive-dashboard/export?format=pdf", { data: { filters: {} } });
  expect(response.status()).toBe(423);
});

test("la route d'impression contient un verrou serveur avant le chargement des données", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile("app/dashboard/reports/[reportId]/print/page.tsx", "utf8"));
  const gate = source.indexOf("if (!canUseReportOutputs())");
  const dataLoad = source.indexOf("const data = await getReportData");
  expect(gate).toBeGreaterThan(-1);
  expect(gate).toBeLessThan(dataLoad);
  expect(source).toContain("Impression désactivée");
});
