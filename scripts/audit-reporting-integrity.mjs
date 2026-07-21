import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDirs = ["app/dashboard/reports", "app/api/reports", "components/dashboard/reports", "lib/reports"];

const envLocalPath = path.join(root, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envLocal.split(/\r?\n/)) {
    const match = line.match(/^(REPORTS_[A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

const files = reportDirs.flatMap(walk).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const checks = [
    ["REPORT_SELECT_STAR", /\.select\(\s*["'`]?\*["'`]?\s*\)/, "select(*) interdit"],
    ["REPORT_SERVICE_ROLE", /SERVICE_ROLE/, "service role interdit dans le reporting interactif"],
    ["REPORT_MOCK_DATA", /\bmock\b/i, "donnée mockée détectée"],
    ["REPORT_TODO", /\bTODO\b/, "TODO détecté"],
    ["REPORT_ZERO_MASKING", /Number\([^)]*(\|\|\s*0|\?\?\s*0)[^)]*\)/, "conversion numérique pouvant masquer une donnée absente"],
  ];

  for (const [code, pattern, message] of checks) {
    if (pattern.test(text)) {
      findings.push({ severity: "major", code, file, message });
    }
  }
}

const exportRoute = path.join(root, "app/api/reports/[reportId]/export/route.ts");
if (fs.existsSync(exportRoute)) {
  const text = fs.readFileSync(exportRoute, "utf8");
  if (!text.includes("getUserPermissions") || !text.includes("canUseReportOutputs")) {
    findings.push({
      severity: "critical",
      code: "REPORT_EXPORT_NOT_LOCKED",
      file: "app/api/reports/[reportId]/export/route.ts",
      message: "Export PDF/XLSX sans contrôle serveur de permission et de disponibilité",
    });
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  reportingMode: "per_report_health",
  filesScanned: files.length,
  findings,
};

console.log(JSON.stringify(result, null, 2));
