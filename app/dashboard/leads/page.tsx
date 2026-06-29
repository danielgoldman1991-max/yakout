import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getLeads } from "@/lib/data";
import { deleteLeadAction, updateLeadStatus } from "@/lib/data/actions";
import { formatDate } from "@/lib/formatters";
import { getLeadTypeLabel } from "@/lib/leads";

const LEAD_STATUSES = ["new", "Nouveau", "A qualifier", "Contacte", "Devis envoye", "Confirme", "Perdu", "A relancer"];

function statusLabel(status: string) {
  return status === "new" ? "Nouveau" : status;
}

function whatsappUrl(phone: string, name: string) {
  const number = phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(`Bonjour ${name}, je vous contacte au sujet de votre demande Yakout.`);
  return `https://wa.me/${number}?text=${message}`;
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / Demandes</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Demandes / Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Boîte centrale de toutes les demandes entrantes du site.</p>
        </div>
        <Link href="/dashboard/leads/new" className="inline-flex h-10 items-center justify-center rounded-sm bg-gold px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold">
          Nouvelle demande
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-sm border border-border/60 bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground/60">Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-accent/5">
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Nom</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Téléphone</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Email</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Type</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Message</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Source</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Bien / véhicule</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Statut</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Date</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border/30 transition-colors duration-200 hover:bg-accent/5">
                    <td className="px-5 py-3.5 align-middle">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-sm font-medium text-foreground transition hover:text-gold">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">{lead.phone}</td>
                    <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">{lead.email || "-"}</td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className="rounded-sm border border-gold/15 bg-gold/5 px-2.5 py-1 text-xs font-medium text-gold">
                        {getLeadTypeLabel(lead.request_type)}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-5 py-3.5 align-middle text-sm text-muted-foreground">
                      <p className="line-clamp-3 whitespace-pre-wrap">{lead.message || "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">{lead.source || "-"}</td>
                    <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">{lead.related_slug || "-"}</td>
                    <td className="px-5 py-3.5 align-middle">
                      {lead.client_id ? (
                        <span className="rounded-sm border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">Converti</span>
                      ) : (
                        <form action={updateLeadStatus.bind(null, lead.id)} className="flex items-center gap-1.5">
                          <select name="status" defaultValue={lead.status} className="rounded-sm border border-border/50 bg-surface px-2.5 py-1.5 text-xs text-foreground transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20">
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>{statusLabel(s)}</option>
                            ))}
                          </select>
                          <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold transition hover:text-gold-light">OK</button>
                        </form>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3.5 text-right align-middle">
                      <div className="flex items-center justify-end gap-3">
                        {lead.phone ? (
                          <Link href={whatsappUrl(lead.phone, lead.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold transition hover:text-gold-light">
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </Link>
                        ) : null}
                        <form action={deleteLeadAction.bind(null, lead.id)}>
                          <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ruby-light transition hover:text-ruby">Supprimer</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
