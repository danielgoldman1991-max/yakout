"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Building2, Car, FileText, Package, Shield, TrendingUp, Truck, UserCheck, Users, Wallet, Wrench } from "lucide-react";
import type { ReportCategory, ReportDefinition } from "@/lib/reports/definitions";
import Link from "next/link";

const CATEGORY_ICONS: Record<ReportCategory, typeof BarChart3> = {
  executive: BarChart3,
  sales: TrendingUp,
  accommodation: Building2,
  owners: Users,
  finance: Wallet,
  operations: Wrench,
  transport: Car,
  fleet: Truck,
  packages: Package,
  clients: UserCheck,
  compliance: FileText,
  data_quality: Shield,
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  executive: "Direction",
  sales: "Commercial",
  accommodation: "Hébergement",
  owners: "Propriétaires",
  finance: "Finance",
  operations: "Exploitation",
  transport: "Transport",
  fleet: "Véhicules et partenaires",
  packages: "Packs et séjours",
  clients: "Clients",
  compliance: "Contrats et documents",
  data_quality: "Qualité des données",
};

export function ReportCard({ report, locked = false }: { report: ReportDefinition; locked?: boolean }) {
  const Icon = CATEGORY_ICONS[report.category];

  return (
    <Link href={`/dashboard/reports/${report.id}`}>
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-elevation-2 cursor-pointer">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-gold/15 bg-gradient-to-br from-gold/5 to-gold/10">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  {CATEGORY_LABELS[report.category]}
                </p>
                <p className="text-sm font-medium text-foreground">{report.title}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-xs text-muted-foreground/70 line-clamp-2">{report.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {locked && <Badge tone="warning">Suspendu</Badge>}
            {report.supportedFormats.map((fmt) => (
              <Badge key={fmt} tone="muted">
                {fmt === "screen" ? "Écran" : fmt === "pdf" ? "PDF" : fmt === "xlsx" ? "XLSX" : "Impression"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
