import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportRoute = path.join(root, "app/api/reports/[reportId]/export/route.ts");
const certification = path.join(root, "lib/reports/certification.ts");

const checks = [
  {
    id: "exports_locked_when_uncertified",
    passed: fs.existsSync(exportRoute) && fs.readFileSync(exportRoute, "utf8").includes("canExportReports"),
  },
  {
    id: "certification_gate_exists",
    passed: fs.existsSync(certification) && fs.readFileSync(certification, "utf8").includes("applyCertificationGate"),
  },
];

const failed = checks.filter((check) => !check.passed);
const result = {
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "blocked_until_live_sql_reconciliation" : "failed",
  financialDiscrepancy: null,
  rowCountDiscrepancy: null,
  currencyDiscrepancy: null,
  checks,
  note: "Le rapprochement financier complet nécessite les requêtes SQL de référence et l'accès à la base Supabase réelle.",
};

console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exitCode = 1;
