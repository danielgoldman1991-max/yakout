"use client";

import Link from "next/link";
import { CalendarClock, Eye, Mail, MessageCircle, Phone, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  buildMailtoUrl,
  buildWhatsAppUrl,
  clientStatusLabels,
  clientTypeLabels,
  renderTemplate,
  yakoutMessageTemplates,
} from "@/lib/clients-crm-shared";

type ClientRow = {
  client: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    city?: string;
    country?: string;
    client_type?: string;
    status?: string;
    created_at: string;
  };
  lastDemand?: { message?: string; request_type?: string; created_at: string };
  lastService?: string;
  lastContactAt?: string;
  nextFollowup?: { due_date?: string | null; title: string; status: string };
  totalValue: number;
  satisfaction?: { rating?: number | null; status: string };
  leads: unknown[];
  reservations: unknown[];
};

const filters = [
  { label: "Tous", value: "all" },
  { label: "Nouveau", value: "new" },
  { label: "A relancer", value: "to_follow_up" },
  { label: "Client actif", value: "active" },
  { label: "Client VIP", value: "vip" },
  { label: "Ancien client", value: "inactive" },
  { label: "Avis a demander", value: "review_requested" },
  { label: "Attention", value: "attention" },
  { label: "Sans reponse", value: "waiting_reply" },
];

function statusTone(status?: string) {
  if (status === "vip") return "gold";
  if (status === "attention") return "ruby";
  if (status === "active" || status === "booked" || status === "review_received") return "success";
  if (status === "to_follow_up" || status === "waiting_reply" || status === "review_requested") return "warning";
  return "muted";
}

function sortDate(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

export function ClientsCrmList({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const firstTemplate = yakoutMessageTemplates[0];

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clients
      .filter((row) => {
        const status = row.client.status ?? "new";
        if (filter !== "all" && status !== filter) return false;
        if (!normalizedQuery) return true;
        return [
          row.client.full_name,
          row.client.phone,
          row.client.email,
          row.client.city,
          row.client.country,
          row.lastDemand?.message,
          row.lastService,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "last_demand") return sortDate(b.lastDemand?.created_at) - sortDate(a.lastDemand?.created_at);
        if (sort === "next_followup") return sortDate(a.nextFollowup?.due_date ?? undefined) - sortDate(b.nextFollowup?.due_date ?? undefined);
        if (sort === "value") return b.totalValue - a.totalValue;
        return sortDate(b.client.created_at) - sortDate(a.client.created_at);
      });
  }, [clients, filter, query, sort]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher nom, telephone, email, message, ville ou pays"
            className="pl-9"
          />
        </label>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="recent">Plus recents</option>
          <option value="last_demand">Derniere demande</option>
          <option value="next_followup">Prochaine relance</option>
          <option value="value">Valeur client</option>
        </select>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground shadow-elevation-1 transition hover:bg-[#e8c86a]"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === item.value
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:border-gold/20 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun client pour le moment."
            description="Les clients peuvent etre crees depuis les demandes ou ajoutes manuellement."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom client</th>
                  <th className="px-4 py-3 font-medium">Telephone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Statut relation</th>
                  <th className="px-4 py-3 font-medium">Derniere demande</th>
                  <th className="px-4 py-3 font-medium">Dernier service</th>
                  <th className="px-4 py-3 font-medium">Dernier contact</th>
                  <th className="px-4 py-3 font-medium">Prochaine relance</th>
                  <th className="px-4 py-3 font-medium">Valeur</th>
                  <th className="px-4 py-3 font-medium">Avis</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((row) => {
                  const client = row.client;
                  const status = client.status ?? "new";
                  const message = renderTemplate(firstTemplate.body, {
                    client_name: client.full_name,
                    service_type: row.lastService,
                    company_name: "Yakout",
                  });
                  const whatsappHref = buildWhatsAppUrl(client.phone, message);
                  const mailHref = buildMailtoUrl(client.email, "Votre demande Yakout", message);

                  return (
                    <tr key={client.id} className="border-t border-border/40 transition hover:bg-accent/5">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/clients/${client.id}`} className="font-medium text-foreground transition hover:text-gold">
                          {client.full_name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{[client.city, client.country].filter(Boolean).join(", ") || "Localisation non renseignee"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{client.phone || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{client.email || "-"}</td>
                      <td className="px-4 py-3">{clientTypeLabels[client.client_type ?? ""] ?? client.client_type ?? "Voyageur"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(status)}>{clientStatusLabels[status] ?? status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.lastDemand ? formatDate(row.lastDemand.created_at) : "-"}</p>
                        <p className="mt-1 line-clamp-2 max-w-[220px] text-xs text-muted-foreground">{row.lastDemand?.message ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.lastService ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(row.lastContactAt)}</td>
                      <td className="px-4 py-3">
                        {row.nextFollowup ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-300">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(row.nextFollowup.due_date)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(row.totalValue)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.satisfaction?.rating ? `${row.satisfaction.rating}/5` : row.satisfaction?.status ? "Suivi" : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <a
                            href={whatsappHref || undefined}
                            aria-disabled={!whatsappHref}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border transition ${whatsappHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-35"}`}
                            title={whatsappHref ? "Ouvrir WhatsApp" : "Telephone non renseigne"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <a
                            href={client.phone ? `tel:${client.phone}` : undefined}
                            aria-disabled={!client.phone}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border transition ${client.phone ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-35"}`}
                            title={client.phone ? "Appeler" : "Telephone non renseigne"}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                          <a
                            href={mailHref || undefined}
                            aria-disabled={!mailHref}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border transition ${mailHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-35"}`}
                            title={mailHref ? "Envoyer email" : "Email non renseigne"}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border text-gold transition hover:border-gold/30 hover:bg-gold/10"
                            title="Voir fiche"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
