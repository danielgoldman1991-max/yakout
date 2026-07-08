"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Owner, Apartment, OwnerDashboardKPIs, OwnerFinancialSummary, OwnerPropertyPerformance, OwnerReport, OwnerPayout, OwnerPayoutItem, Document, Reservation, MaintenanceTask } from "@/types/business";

type OwnerTab = "overview" | "properties" | "reservations" | "finances" | "maintenance" | "payouts" | "documents" | "reports";

type OwnerDetailProps = {
  owner: Owner;
  properties: Apartment[];
  allProperties: Apartment[];
  kpis: OwnerDashboardKPIs;
  financialSummary: OwnerFinancialSummary;
  performance: OwnerPropertyPerformance[];
  reports: OwnerReport[];
  payouts: (OwnerPayout & { items?: OwnerPayoutItem[] })[];
  documents: Document[];
  reservations: Reservation[];
  maintenanceTasks: MaintenanceTask[];
};

const TABS: { id: OwnerTab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "properties", label: "Biens" },
  { id: "reservations", label: "Réservations" },
  { id: "finances", label: "Finances" },
  { id: "maintenance", label: "Exploitation" },
  { id: "payouts", label: "Reversements" },
  { id: "documents", label: "Documents" },
  { id: "reports", label: "Rapports" },
];

export function OwnerDetailClient(props: OwnerDetailProps) {
  const { owner, properties, allProperties, kpis, financialSummary, performance, reports, payouts, documents, reservations, maintenanceTasks } = props;
  const [activeTab, setActiveTab] = useState<OwnerTab>("overview");
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterApartment, setFilterApartment] = useState("all");

  return (
    <div className="space-y-5">
      {/* Global Filter Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Période</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="rounded border px-2 py-1 text-sm" />
            <span className="text-muted-foreground">→</span>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="rounded border px-2 py-1 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Bien</label>
            <select value={filterApartment} onChange={e => setFilterApartment(e.target.value)}
              className="rounded border px-2 py-1 text-sm">
              <option value="all">Tous les biens</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.internal_name ?? p.public_name ?? "Sans titre"}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab kpis={kpis} financialSummary={financialSummary} performance={performance} reservations={reservations} maintenanceTasks={maintenanceTasks} />}
      {activeTab === "properties" && <PropertiesTab properties={properties} performance={performance} allProperties={allProperties} ownerId={owner.id} />}
      {activeTab === "reservations" && <ReservationsTab reservations={reservations} />}
      {activeTab === "finances" && <FinancesTab summary={financialSummary} />}
      {activeTab === "maintenance" && <MaintenanceTab tasks={maintenanceTasks} />}
      {activeTab === "payouts" && <PayoutsTab payouts={payouts} />}
      {activeTab === "documents" && <DocumentsTab documents={documents} />}
      {activeTab === "reports" && <ReportsTab reports={reports} ownerId={owner.id} />}
    </div>
  );
}

// ─── KPI Card ───
function KpiCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle?: string; tone?: "default" | "gold" | "ruby" | "success" | "warning" | "info" }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "gold" ? "text-gold" : tone === "ruby" ? "text-ruby" : tone === "success" ? "text-green-600" : tone === "warning" ? "text-amber-600" : "text-foreground"}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Vue d'ensemble ───
function OverviewTab({ kpis, financialSummary, performance, reservations, maintenanceTasks }: {
  kpis: OwnerDashboardKPIs; financialSummary: OwnerFinancialSummary; performance: OwnerPropertyPerformance[];
  reservations: Reservation[]; maintenanceTasks: MaintenanceTask[];
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">Indicateurs clés</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard title="Biens" value={String(kpis.propertyCount)} />
        <KpiCard title="Taux d'occupation" value={`${kpis.occupancyRate.toFixed(1)}%`} subtitle={`${kpis.occupiedNights} / ${kpis.availableNights} nuits`} tone="gold" />
        <KpiCard title="Revenus hébergement" value={formatCurrency(kpis.accommodationRevenue)} tone="success" />
        <KpiCard title="Encaissements" value={formatCurrency(kpis.collectedRevenue)} />
        <KpiCard title="Commission Yakout" value={formatCurrency(kpis.yakoutCommission)} tone="warning" />
        <KpiCard title="Net propriétaire" value={formatCurrency(kpis.netOwner)} tone={kpis.netOwner >= 0 ? "success" : "ruby"} />
        <KpiCard title="Reversements" value={formatCurrency(kpis.payoutsMade)} subtitle={kpis.balanceDue > 0 ? `Solde dû : ${formatCurrency(kpis.balanceDue)}` : "À jour"} />
        <KpiCard title="Réservations futures" value={String(kpis.futureReservations)} tone="info" />
      </div>

      <h3 className="text-lg font-semibold">Synthèse financière</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Réservé" value={formatCurrency(financialSummary.reservedAmount)} />
        <KpiCard title="Facturé" value={formatCurrency(financialSummary.invoicedAmount)} />
        <KpiCard title="Encaissé" value={formatCurrency(financialSummary.collectedAmount)} tone="success" />
        <KpiCard title="Remboursé" value={formatCurrency(financialSummary.refundedAmount)} tone="ruby" />
        <KpiCard title="Solde dû" value={formatCurrency(financialSummary.balanceDue)} tone={financialSummary.balanceDue > 0 ? "warning" : "success"} />
      </div>

      {performance.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Performance par bien</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {performance.map(p => (
              <Card key={p.apartmentId}>
                <CardHeader><CardTitle className="text-sm">{p.apartmentName}</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Occupation</span><span className="font-medium">{p.occupancyRate.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>ADR</span><span className="font-medium">{formatCurrency(p.adr)}</span></div>
                  <div className="flex justify-between"><span>RevPAR</span><span className="font-medium">{formatCurrency(p.revpar)}</span></div>
                  <div className="flex justify-between"><span>Séjour moyen</span><span className="font-medium">{p.avgStayDays} nuits</span></div>
                  <div className="flex justify-between"><span>Revenus</span><span className="font-medium">{formatCurrency(p.revenue)}</span></div>
                  {p.prevPeriodRevenue !== undefined && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Période précédente</span>
                      <span>{formatCurrency(p.prevPeriodRevenue)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Réservations récentes</CardTitle></CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réservation</p>
            ) : (
              <div className="space-y-2">
                {reservations.slice(0, 5).map(r => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span>{r.check_in} → {r.check_out}</span>
                    <span className="font-medium">{formatCurrency(r.total_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Maintenance en cours</CardTitle></CardHeader>
          <CardContent>
            {maintenanceTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune tâche en cours</p>
            ) : (
              <div className="space-y-2">
                {maintenanceTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.title}</span>
                    <Badge tone={t.status === "open" ? "warning" : t.status === "in_progress" ? "info" : "default"}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Biens ───
function PropertiesTab({ properties, performance, allProperties, ownerId }: {
  properties: Apartment[]; performance: OwnerPropertyPerformance[]; allProperties: Apartment[]; ownerId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{properties.length} bien{properties.length > 1 ? "s" : ""}</h3>
        <div className="flex gap-2">
          <a href={`/dashboard/apartments/new?ownerId=${ownerId}`}>
            <Button variant="primary" className="text-sm">Nouveau bien</Button>
          </a>
          {allProperties.length > properties.length && (
            <AttachApartmentForm ownerId={ownerId} allProperties={allProperties} />
          )}
        </div>
      </div>
      {properties.map(apt => {
        const perf = performance.find(p => p.apartmentId === apt.id);
        return (
          <Card key={apt.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{apt.internal_name ?? apt.public_name ?? "Sans titre"}</CardTitle>
                  <CardDescription>{apt.city ?? apt.district ?? ""}</CardDescription>
                </div>
                <a href={`/dashboard/apartments/${apt.id}`}><Button variant="ghost" className="text-sm">Voir</Button></a>
              </div>
            </CardHeader>
            <CardContent>
              {perf ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Occupation</span><p className="font-medium">{perf.occupancyRate.toFixed(1)}%</p></div>
                  <div><span className="text-muted-foreground">ADR</span><p className="font-medium">{formatCurrency(perf.adr)}</p></div>
                  <div><span className="text-muted-foreground">RevPAR</span><p className="font-medium">{formatCurrency(perf.revpar)}</p></div>
                  <div><span className="text-muted-foreground">Revenus</span><p className="font-medium">{formatCurrency(perf.revenue)}</p></div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée de performance</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AttachApartmentForm({ ownerId, allProperties }: { ownerId: string; allProperties: Apartment[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const router = useRouter();
  const handleAttach = useCallback(async () => {
    if (!selected) return;
    try {
      const { attachApartmentToOwnerAction } = await import("@/lib/data/owner-actions");
      const form = new FormData();
      form.set("apartmentId", selected);
      await attachApartmentToOwnerAction(ownerId, form);
      router.refresh();
      setOpen(false);
    } catch {}
  }, [ownerId, selected, router]);
  if (!open) return <Button variant="ghost" className="text-sm" onClick={() => setOpen(true)}>Attribuer un bien</Button>;
  return (
    <div className="flex items-center gap-2">
      <select value={selected} onChange={e => setSelected(e.target.value)} className="rounded border px-2 py-1 text-sm">
        <option value="">Choisir...</option>
        {allProperties.map(apt => <option key={apt.id} value={apt.id}>{apt.internal_name ?? apt.public_name ?? apt.id.slice(0, 8)}</option>)}
      </select>
      <Button variant="primary" className="text-sm" onClick={handleAttach} disabled={!selected}>Attribuer</Button>
      <Button variant="ghost" className="text-sm" onClick={() => setOpen(false)}>Annuler</Button>
    </div>
  );
}

// ─── Réservations ───
function ReservationsTab({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) return <p className="text-muted-foreground">Aucune réservation</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Arrivée</th>
            <th className="pb-2 pr-4">Départ</th>
            <th className="pb-2 pr-4">Nuits</th>
            <th className="pb-2 pr-4">Montant</th>
            <th className="pb-2 pr-4">Statut</th>
            <th className="pb-2 pr-4">Bien</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{r.check_in}</td>
              <td className="py-2 pr-4">{r.check_out}</td>
              <td className="py-2 pr-4">{r.nights}</td>
              <td className="py-2 pr-4 font-medium">{formatCurrency(r.total_amount)}</td>
              <td className="py-2 pr-4"><Badge tone={r.status === "confirmed" ? "success" : r.status === "checked_in" ? "info" : r.status === "checked_out" ? "default" : r.status === "cancelled" ? "ruby" : "warning"}>{r.status}</Badge></td>
              <td className="py-2 pr-4">{r.apartment_id?.slice(0, 8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Finances ───
function FinancesTab({ summary }: { summary: OwnerFinancialSummary }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Synthèse financière</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard title="Montant réservé" value={formatCurrency(summary.reservedAmount)} />
            <KpiCard title="Montant facturé" value={formatCurrency(summary.invoicedAmount)} />
            <KpiCard title="Montant encaissé" value={formatCurrency(summary.collectedAmount)} tone="success" />
            <KpiCard title="Montant restant" value={formatCurrency(summary.remainingAmount)} tone={summary.remainingAmount > 0 ? "warning" : "success"} />
            <KpiCard title="Montant remboursé" value={formatCurrency(summary.refundedAmount)} tone="ruby" />
          </div>
          <div className="mt-6 border-t pt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard title="Dépenses" value={formatCurrency(summary.expensesAmount)} tone="ruby" />
            <KpiCard title="Commission Yakout" value={formatCurrency(summary.commissionAmount)} tone="warning" />
            <KpiCard title="Net propriétaire" value={formatCurrency(summary.ownerAmount)} tone={summary.ownerAmount >= 0 ? "success" : "ruby"} />
            <KpiCard title="Reversements" value={formatCurrency(summary.payoutsMade)} />
            <KpiCard title="Solde dû" value={formatCurrency(summary.balanceDue)} tone={summary.balanceDue > 0 ? "warning" : "success"} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Détail des flux</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between"><span>Recettes réservées</span><span className="font-medium">{formatCurrency(summary.reservedAmount)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Remboursements</span><span>{formatCurrency(summary.refundedAmount)}</span></div>
          <div className="border-t pt-2 flex justify-between"><span>Base de calcul</span><span className="font-medium">{formatCurrency(summary.invoicedAmount)}</span></div>
          <div className="flex justify-between"><span>Dépenses ({summary.expensesAmount > 0 ? "déduites" : "aucune"})</span><span>{summary.expensesAmount > 0 ? `-${formatCurrency(summary.expensesAmount)}` : "0"}</span></div>
          <div className="flex justify-between"><span>Commission Yakout</span><span>{`-${formatCurrency(summary.commissionAmount)}`}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Net propriétaire</span><span>{formatCurrency(summary.ownerAmount)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Exploitation ───
function MaintenanceTab({ tasks }: { tasks: MaintenanceTask[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tâches de maintenance</h3>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">Aucune tâche de maintenance</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Tâche</th>
                <th className="pb-2 pr-4">Priorité</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Catégorie</th>
                <th className="pb-2 pr-4">Coût</th>
                <th className="pb-2 pr-4">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={t.priority === "urgent" ? "ruby" : t.priority === "high" ? "warning" : t.priority === "medium" ? "info" : "default"}>
                      {t.priority}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">{t.status}</td>
                  <td className="py-2 pr-4">{t.category}</td>
                  <td className="py-2 pr-4 font-medium">{t.actual_cost ? formatCurrency(t.actual_cost) : t.estimated_cost ? `Est. ${formatCurrency(t.estimated_cost)}` : "—"}</td>
                  <td className="py-2 pr-4">{t.due_date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reversements ───
function PayoutsTab({ payouts }: { payouts: (OwnerPayout & { items?: OwnerPayoutItem[] })[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Reversements</h3>
      {payouts.length === 0 ? (
        <p className="text-muted-foreground">Aucun reversement</p>
      ) : (
        <div className="space-y-3">
          {payouts.map(p => (
            <Card key={p.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div>
                    <CardTitle className="text-sm">{p.reference ?? `Reversement #${p.id.slice(0, 8)}`}</CardTitle>
                    <CardDescription>
                      {p.period_start && p.period_end ? `${p.period_start} → ${p.period_end}` : formatDate(p.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                    <Badge tone={p.payout_status === "paid" ? "success" : p.payout_status === "approved" ? "info" : p.payout_status === "partially_paid" ? "warning" : p.payout_status === "cancelled" ? "ruby" : "default"}>
                      {p.payout_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {expanded === p.id && (
                <CardContent className="border-t pt-3 text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Brut</span><p>{formatCurrency(p.gross_amount ?? p.amount)}</p></div>
                    <div><span className="text-muted-foreground">Retenues</span><p>{formatCurrency(p.deductions ?? 0)}</p></div>
                    <div><span className="text-muted-foreground">Net</span><p className="font-medium">{formatCurrency(p.net_amount ?? p.amount)}</p></div>
                    <div><span className="text-muted-foreground">Méthode</span><p>{p.payout_method ?? "—"}</p></div>
                  </div>
                  {p.items && p.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Lignes couvertes</p>
                      {p.items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span>{item.source_type} ({item.source_id.slice(0, 8)})</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Documents ───
function DocumentsTab({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-muted-foreground">Aucun document</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Titre</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{d.title}</td>
                  <td className="py-2 pr-4">{d.document_type ?? d.type}</td>
                  <td className="py-2 pr-4">{formatDate(d.created_at)}</td>
                  <td className="py-2 pr-4">
                    <a href={d.file_url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline text-xs">
                      {d.file_url ? "Télécharger" : "—"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Rapports ───
function ReportsTab({ reports, ownerId }: { reports: OwnerReport[]; ownerId: string }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const handleGenerate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("ownerId", ownerId);
    try {
      const { createOwnerReportAction } = await import("@/lib/data/owner-actions");
      const result = await createOwnerReportAction(null, form);
      if (result.success) {
        setShowForm(false);
        router.refresh();
      } else {
        alert(result.message);
      }
    } catch {}
  }, [ownerId, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rapports</h3>
        <Button variant="primary" className="text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Nouveau rapport"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Générer un rapport</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select name="reportType" required className="w-full rounded border px-2 py-1 text-sm">
                  <option value="monthly_owner_statement">Relevé mensuel propriétaire</option>
                  <option value="property_performance">Performance du bien</option>
                  <option value="reservation_activity">Activité des réservations</option>
                  <option value="financial_ledger">Recettes et dépenses</option>
                  <option value="maintenance_operations">Exploitation et maintenance</option>
                  <option value="owner_payout_statement">Relevé de reversement</option>
                  <option value="forward_forecast">Prévision 30/60/90 jours</option>
                  <option value="annual_owner_summary">Rapport annuel</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Période début</label>
                <input type="date" name="periodStart" required className="w-full rounded border px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Période fin</label>
                <input type="date" name="periodEnd" required className="w-full rounded border px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Base comptable</label>
                <select name="accountingBasis" className="w-full rounded border px-2 py-1 text-sm">
                  <option value="activity">Activité</option>
                  <option value="cash">Encaissement</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Devise</label>
                <select name="currency" className="w-full rounded border px-2 py-1 text-sm">
                  <option value="MAD">MAD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="text-sm">Générer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <p className="text-muted-foreground">Aucun rapport généré</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Rapport</th>
                <th className="pb-2 pr-4">Période</th>
                <th className="pb-2 pr-4">Version</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Généré le</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.label}</td>
                  <td className="py-2 pr-4">{r.period_start} → {r.period_end}</td>
                  <td className="py-2 pr-4">v{r.version}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={r.status === "finalized" ? "success" : r.status === "sent" ? "info" : r.status === "draft" ? "default" : r.status === "superseded" ? "warning" : "ruby"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">{r.generated_at ? formatDate(r.generated_at) : "—"}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      {r.status === "draft" && (
                        <Button variant="ghost" className="text-xs" onClick={async () => {
                          const { finalizeOwnerReportAction } = await import("@/lib/data/owner-actions");
                          await finalizeOwnerReportAction(r.id);
                          router.refresh();
                        }}>Finaliser</Button>
                      )}
                      {(r.status === "finalized" || r.status === "sent") && (
                        r.pdf_storage_path ? (
                          <>
                            <a href={`/api/documents/${r.pdf_storage_path}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" className="text-xs">PDF</Button>
                            </a>
                            <Button variant="ghost" className="text-xs" onClick={async () => {
                              const { regenerateOwnerReportPdfAction } = await import("@/lib/data/owner-actions");
                              await regenerateOwnerReportPdfAction(r.id);
                              router.refresh();
                            }}>Regénérer</Button>
                          </>
                        ) : (
                          <Button variant="ghost" className="text-xs" onClick={async () => {
                            const { regenerateOwnerReportPdfAction } = await import("@/lib/data/owner-actions");
                            await regenerateOwnerReportPdfAction(r.id);
                            router.refresh();
                          }}>Générer PDF</Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
