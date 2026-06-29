"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { PieLabelRenderProps } from "recharts";

const chartColors = { gold: "#c9a96e", goldLight: "#e8d09a", ruby: "#dc143c", cream: "rgba(240,230,210,0.35)", goldMuted: "#a0834b" };
const pieColors = ["#c9a96e", "#dc143c", "#e8d09a", "#a0834b", "rgba(240,230,210,0.45)"];

export function DashboardCharts({
  payments,
  expenses,
  leads,
}: {
  payments: { amount: number; paid_at: string; activity_type: string; status: string }[];
  expenses: { amount: number; expense_date: string; category: string }[];
  leads: { source: string }[];
}) {
  const caByMonth: Record<string, number> = {};
  const expensesByCategory: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  const caByActivity: Record<string, number> = {};

  payments.filter((p) => p.status === "Paye").forEach((p) => {
    const month = p.paid_at.slice(0, 7);
    caByMonth[month] = (caByMonth[month] || 0) + p.amount;
    caByActivity[p.activity_type] = (caByActivity[p.activity_type] || 0) + p.amount;
  });

  expenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  leads.forEach((l) => {
    leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
  });

  const caData = Object.entries(caByMonth).map(([month, amount]) => ({ month, amount }));
  const expenseData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({ name, value }));
  const activityData = Object.entries(caByActivity).map(([name, value]) => ({ name, value }));

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2, fontSize: 12, color: "var(--foreground)" };

  if (caData.length === 0 && expenseData.length === 0) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {caData.length > 0 && (
        <div className="rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">CA par mois</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11, opacity: 0.6 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11, opacity: 0.6 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="amount" fill={chartColors.gold} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {expenseData.length > 0 && (
        <div className="rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Dépenses par catégorie</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11, opacity: 0.6 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11, opacity: 0.6 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={chartColors.ruby} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sourceData.length > 0 && (
        <div className="rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Leads par source</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activityData.length > 0 && (
        <div className="rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">CA par activité</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {activityData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
