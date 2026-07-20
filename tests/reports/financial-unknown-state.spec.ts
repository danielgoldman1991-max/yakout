import { expect, test } from "@playwright/test";
import { addFinancialMetrics, divideFinancialMetric, financialMetric, formatFinancialMetric } from "../../lib/reports/financial-metric";

test("un vrai zéro reste connu, les absences et invalides ne deviennent jamais zéro", () => {
  expect(financialMetric(0)).toMatchObject({ state: "known", value: 0 });
  for (const value of [null, undefined, "", "abc"]) {
    const metric = financialMetric(value);
    expect(metric.state).toBe("unknown");
    expect(formatFinancialMetric(metric)).toBe("Non certifié");
  }
});

test("les opérations propagent les états inconnus et refusent les devises ou divisions invalides", () => {
  expect(addFinancialMetrics([financialMetric(10), financialMetric(null)]).state).toBe("unknown");
  expect(addFinancialMetrics([financialMetric(10, "MAD"), financialMetric(5, "EUR")]).state).toBe("unknown");
  expect(divideFinancialMetric(financialMetric(10), 0).state).toBe("unknown");
});
