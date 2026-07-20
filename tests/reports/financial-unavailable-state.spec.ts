import { expect, test } from "@playwright/test";
import { formatFinancialMetric, unavailableMetric } from "../../lib/reports/financial-metric";

test("une panne reste indisponible et n'est jamais affichée comme zéro", () => {
  const metric = unavailableMetric("Supabase inaccessible", "PGRST000", "MAD");
  expect(metric.state).toBe("unavailable");
  expect(formatFinancialMetric(metric)).toBe("Données indisponibles");
  expect(formatFinancialMetric(metric)).not.toContain("0");
});
