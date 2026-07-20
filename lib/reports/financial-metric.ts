export type DataState = "known" | "unknown" | "unavailable" | "not_applicable";

export type FinancialMetric =
  | { state: "known"; value: number; currency: string; sourceCount: number }
  | { state: "unknown"; reason: string; currency?: string }
  | { state: "unavailable"; reason: string; errorCode?: string; currency?: string }
  | { state: "not_applicable"; reason: string };

export function financialMetric(value: unknown, currency = "MAD", sourceCount = 1): FinancialMetric {
  if (value === null || value === undefined || value === "") {
    return { state: "unknown", reason: "Donnée source absente.", currency };
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return { state: "unknown", reason: "Donnée source non numérique.", currency };
  }
  return { state: "known", value: parsed, currency, sourceCount };
}

export function unavailableMetric(reason: string, errorCode?: string, currency?: string): FinancialMetric {
  return { state: "unavailable", reason, errorCode, currency };
}

export function addFinancialMetrics(metrics: FinancialMetric[]): FinancialMetric {
  const blocking = metrics.find((metric) => metric.state === "unavailable" || metric.state === "unknown");
  if (blocking) return blocking;
  const known = metrics.filter((metric): metric is Extract<FinancialMetric, { state: "known" }> => metric.state === "known");
  if (known.length === 0) return { state: "not_applicable", reason: "Aucune métrique applicable." };
  if (new Set(known.map((metric) => metric.currency)).size !== 1) {
    return { state: "unknown", reason: "Devises incompatibles." };
  }
  return {
    state: "known",
    value: known.reduce((sum, metric) => sum + metric.value, 0),
    currency: known[0].currency,
    sourceCount: known.reduce((sum, metric) => sum + metric.sourceCount, 0),
  };
}

export function divideFinancialMetric(metric: FinancialMetric, divisor: unknown): FinancialMetric {
  if (metric.state !== "known") return metric;
  const parsed = Number(divisor);
  if (!Number.isFinite(parsed) || parsed === 0) {
    return { state: "unknown", reason: "Division impossible.", currency: metric.currency };
  }
  return { ...metric, value: metric.value / parsed };
}

export function formatFinancialMetric(metric: FinancialMetric): string {
  if (metric.state === "unavailable") return "Données indisponibles";
  if (metric.state !== "known") return "Non certifié";
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: metric.currency }).format(metric.value);
}
