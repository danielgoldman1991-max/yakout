import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/tables/data-table";

export function EntityPage<T extends { id: string }>({
  title,
  description,
  addLabel,
  data,
  columns,
}: {
  title: string;
  description: string;
  addLabel: string;
  data: T[];
  columns: Column<T>[];
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / {title}</p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      <div className="flex flex-col gap-3 rounded-sm border bg-card p-3 shadow-elevation-1 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Recherche" />
        </div>
        <Input className="sm:max-w-48" placeholder="Filtre statut" />
        <Input className="sm:max-w-48" placeholder="Filtre source/type" />
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
