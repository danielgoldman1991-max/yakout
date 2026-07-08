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
};

export type ReportMetadata = {
  reportId: string;
  title: string;
  generatedAt: string;
  periodStart?: string;
  periodEnd?: string;
  status: "ready" | "partial" | "error" | "suspended";
  certificationStatus?: "draft" | "under_review" | "certified" | "suspended";
  formulaVersion?: string;
  dataSourceVersion?: string;
  testingMode?: boolean;
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
