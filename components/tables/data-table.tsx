import { StatusBadge } from "@/components/dashboard/status-badge";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyLabel = "Aucune donnée pour le moment.",
}: {
  columns: Column<T>[];
  data: T[];
  emptyLabel?: string;
}) {
  if (!data.length) {
    return (
      <div className="rounded-sm border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground/60">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-accent/5">
              {columns.map((column) => (
                <th key={String(column.key)} className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  {column.header}
                </th>
              ))}
              <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t border-border/30 transition-colors duration-200 hover:bg-accent/5">
                {columns.map((column) => {
                  const value = item[column.key as keyof T];
                  return (
                    <td key={String(column.key)} className="px-5 py-3.5 align-middle text-sm text-foreground">
                      {column.render ? column.render(item) : String(value ?? "")}
                    </td>
                  );
                })}
                <td className="px-5 py-3.5 text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold transition hover:text-gold-light cursor-pointer">
                    Voir / modifier
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function statusColumn<T extends { status?: string; is_published?: boolean }>(label = "Statut"): Column<T> {
  return {
    key: "status",
    header: label,
    render: (item) => <StatusBadge status={item.status ?? (item.is_published ? "Publie" : "Brouillon")} />,
  };
}
