import Link from "next/link";
import { getOwners, getOwnersKpi } from "@/lib/data/owners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, Plus, Home, Phone } from "lucide-react";

const pipelineLabels: Record<string, string> = {
  new: "Nouveau lead",
  contact_pending: "À contacter",
  contacted: "Contacté",
  site_visit: "Visite effectuée",
  negotiation: "En négociation",
  contract_pending: "Contrat en attente",
  contract_signed: "Contrat signé",
  active_management: "Gestion active",
  published: "Publié",
  lost: "Perdu",
  inactive: "Inactif",
};

const pipelineTones: Record<string, "success" | "warning" | "ruby" | "muted" | "default"> = {
  new: "muted",
  contact_pending: "muted",
  contacted: "warning",
  site_visit: "warning",
  negotiation: "warning",
  contract_pending: "warning",
  contract_signed: "success",
  active_management: "success",
  published: "success",
  lost: "ruby",
  inactive: "muted",
};

const contractLabels: Record<string, string> = {
  contract_pending: "En attente",
  contract_signed: "Signé",
  none: "—",
};

const contractTones: Record<string, "warning" | "success" | "muted"> = {
  contract_pending: "warning",
  contract_signed: "success",
  none: "muted",
};

const filterTabs = [
  { key: "all", label: "Tous" },
  { key: "new", label: "Nouveaux leads" },
  { key: "contract_pending", label: "Contrat en attente" },
  { key: "contract_signed", label: "Contrat signé" },
  { key: "active", label: "Actifs" },
  { key: "lost", label: "Perdus" },
] as const;

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>;
}) {
  const { tab, search } = await searchParams;

  const kpi = await getOwnersKpi();
  const owners = await getOwners({ search });

  const filtered =
    !tab || tab === "all"
      ? owners
      : owners.filter((o) => {
          switch (tab) {
            case "new":
              return o.status === "new" || o.status === "Nouveau";
            case "contract_pending":
              return o.status === "contract_pending";
            case "contract_signed":
              return o.status === "contract_signed";
            case "active":
              return o.status === "active_management" || o.status === "published";
            case "lost":
              return o.status === "lost" || o.status === "Perdu";
            default:
              return true;
          }
        });

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Propriétaires</p>
          <h1 className="mt-2 text-3xl font-semibold">Propriétaires</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Suivez les propriétaires qui confient ou souhaitent confier un bien à Yakout.
          </p>
        </div>
        <Link href="/dashboard/owners/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un propriétaire
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Propriétaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-300">{kpi.activeOwners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Biens total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-300">{kpi.totalProperties}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contrats en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-300">{kpi.contractsPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Prêts à publier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-violet-300">{kpi.readyToPublish}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((t) => {
            const active =
              (!tab || tab === "all") ? t.key === "all" : tab === t.key;
            return (
              <Link
                key={t.key}
                href={
                  t.key === "all"
                    ? "/dashboard/owners"
                    : `/dashboard/owners?tab=${t.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`
                }
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/dashboard/owners" className="flex items-center gap-2">
          {tab && tab !== "all" && (
            <input type="hidden" name="tab" value={tab} />
          )}
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Rechercher..."
              className="h-9 w-48 rounded-md border border-border bg-background px-3 pl-8 text-xs placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none"
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
        </form>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Home className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium">Aucun propriétaire</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search
                ? `Aucun résultat pour &laquo; ${search} &raquo;.`
                : "Ajoutez un propriétaire pour commencer."}
            </p>
          </div>
          <Link href="/dashboard/owners/new">
            <Button variant="secondary" className="mt-1">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter un propriétaire
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Téléphone</th>
                  <th className="px-4 py-3 font-medium">Biens</th>
                  <th className="px-4 py-3 font-medium">Statut pipeline</th>
                  <th className="px-4 py-3 font-medium">Contrat</th>
                  <th className="px-4 py-3 font-medium">Recettes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((owner) => (
                  <tr key={owner.id} className="border-t border-border transition-colors hover:bg-accent/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/owners/${owner.id}`}
                        className="flex items-center gap-2 font-medium hover:text-gold hover:underline"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 text-[11px] font-bold text-gold">
                          {owner.full_name.charAt(0).toUpperCase()}
                        </div>
                        {owner.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground/50" />
                        {owner.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3">
                      <Badge tone={pipelineTones[owner.status] ?? "default"}>
                        {pipelineLabels[owner.status] ?? owner.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={contractTones[owner.status === "contract_signed" ? "contract_signed" : owner.status === "contract_pending" ? "contract_pending" : "none"] ?? "muted"}>
                        {contractLabels[owner.status === "contract_signed" ? "contract_signed" : owner.status === "contract_pending" ? "contract_pending" : "none"] ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/owners/${owner.id}`}>
                          <Button variant="secondary" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Voir fiche
                          </Button>
                        </Link>
                        {owner.phone && (
                          <a
                            href={`https://wa.me/${owner.phone.replace(/[\s\-_().]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="secondary">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
