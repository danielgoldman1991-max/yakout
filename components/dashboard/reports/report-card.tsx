import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportDefinition } from "@/lib/reports/definitions";
import type { ReportHealthItem } from "@/lib/reports/health";
import Link from "next/link";

const labels = { available: "Disponible", available_with_warnings: "Disponible avec réserves", unavailable: "Indisponible", not_configured: "Configuration incomplète" } as const;
const tones = { available: "success", available_with_warnings: "warning", unavailable: "ruby", not_configured: "muted" } as const;

export function ReportCard({ report, health }: { report: ReportDefinition; health?: ReportHealthItem }) {
  const availability = health?.availability ?? "unavailable";
  const usable = availability === "available" || availability === "available_with_warnings";
  return <Card className="h-full"><CardHeader className="p-4 pb-2"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{report.title}</p><p className="mt-1 text-xs text-muted-foreground">{report.description}</p></div><Badge tone={tones[availability]}>{labels[availability]}</Badge></div></CardHeader><CardContent className="p-4 pt-2"><div className="mb-3 flex gap-3 text-xs text-muted-foreground"><span>{health?.sourceCount ?? 0} éléments sources</span><span>{health?.warningCount ?? 0} réserves</span></div><div className="flex flex-wrap items-center gap-2"><Link href={`/dashboard/reports/${report.id}`} className="tool">Ouvrir</Link>{usable && report.supportedFormats.includes("pdf") && <form action={`/api/reports/${report.id}/export?format=pdf`} method="post"><button type="submit" className="tool">PDF</button></form>}{usable && report.supportedFormats.includes("xlsx") && <form action={`/api/reports/${report.id}/export?format=xlsx`} method="post"><button type="submit" className="tool">XLSX</button></form>}{usable && report.supportedFormats.includes("print") && <Link href={`/dashboard/reports/${report.id}/print`} className="tool">Imprimer</Link>}{!usable && <span className="text-xs text-muted-foreground">Exports indisponibles</span>}</div></CardContent></Card>;
}
