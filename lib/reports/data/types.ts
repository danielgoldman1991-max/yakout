export type ReportFilters = {
  period_start?: string;
  period_end?: string;
  owner_id?: string;
  apartment_id?: string;
  client_id?: string;
  status?: string;
  source?: string;
  activity?: string;
  vehicle_id?: string;
  partner_id?: string;
  package_id?: string;
  currency?: string;
};

export type ReportingSystemStatus = "operational" | "degraded" | "unavailable";
export type ReportAvailability = "available" | "available_with_warnings" | "unavailable" | "not_configured";

export type ReportMetric =
  | { state: "known"; value: number; currency?: string }
  | { state: "unknown"; reason: string }
  | { state: "unavailable"; reason: string }
  | { state: "not_applicable"; reason: string };

export type ReportWarning = { code: string; message: string };

export type ReportResult<T> =
  | { ok: true; availability: "available" | "available_with_warnings"; data: T; totals: Record<string, ReportMetric>; warnings: ReportWarning[]; sourceCounts: Record<string, number>; generatedAt: string; filtersApplied: ReportFilters }
  | { ok: false; availability: "unavailable"; error: { code: string; message: string; retryable: boolean }; generatedAt: string; filtersApplied: ReportFilters };

export type ReportMetadata = {
  reportId: string;
  title: string;
  generatedAt: string;
  periodStart?: string;
  periodEnd?: string;
  status: "ready" | "partial" | "error" | "suspended";
  availability?: ReportAvailability;
  formulaVersion?: string;
  dataSourceVersion?: string;
  filtersApplied?: ReportFilters;
};

export type ReportKPI = {
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
  description?: string;
};

export type ReportTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "percent" | "integer" | "decimal" | "date" | "string";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReportTableRow = Record<string, any>;

export type ReportTable = {
  title: string;
  columns: ReportTableColumn[];
  rows: ReportTableRow[];
  totals?: Record<string, number>;
};

export type ReportChart = {
  type: "line" | "bar" | "pie" | "funnel";
  title: string;
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
};

export type ReportData = {
  metadata: ReportMetadata;
  kpis: ReportKPI[];
  charts?: ReportChart[];
  tables: ReportTable[];
  totals?: Record<string, number>;
  warnings: string[];
  anomalies?: {
    severity: "critical" | "major" | "minor";
    code: string;
    message: string;
  }[];
  sourceCounts: Record<string, number>;
};
