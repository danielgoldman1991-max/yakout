import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getLeadById } from "@/lib/data";
import { updateLeadAction, deleteLeadAction, convertLeadToClientAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { getLeadTypeLabel, leadRequestTypes, leadTypeLabels } from "@/lib/leads";

const LEAD_STATUSES = ["new", "Nouveau", "A qualifier", "Contacte", "Devis envoye", "Confirme", "Perdu", "A relancer"];

function statusLabel(status: string) {
  return status === "new" ? "Nouveau" : status;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidRegex.test(id)) { notFound(); }
  const lead = await getLeadById(id);
  if (!lead) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Leads / {lead.name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{lead.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cree le {formatDate(lead.created_at)} - {getLeadTypeLabel(lead.request_type)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le lead</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updateLeadAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                  <Input name="name" defaultValue={lead.name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Telephone *</label>
                  <Input name="phone" defaultValue={lead.phone} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input name="email" type="email" defaultValue={lead.email ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type *</label>
                  <select name="request_type" defaultValue={lead.request_type} required className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    {leadRequestTypes.map((t) => (<option key={t} value={t}>{leadTypeLabels[t]}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Source</label>
                  <Input name="source" defaultValue={lead.source} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Statut</label>
                  <select name="status" defaultValue={lead.status} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                    {LEAD_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type lie</label>
                  <Input name="related_type" defaultValue={lead.related_type ?? ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug lie</label>
                  <Input name="related_slug" defaultValue={lead.related_slug ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea name="message" defaultValue={lead.message ?? ""} rows={3} />
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lead.client_id ? (
              <Link href={`/dashboard/clients/${lead.client_id}`} className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-gold px-5 text-sm font-semibold text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold">
                Voir le client
              </Link>
            ) : (
              <form action={convertLeadToClientAction.bind(null, id)}>
                <Button type="submit" className="w-full">Convertir en client</Button>
              </form>
            )}
            {lead.phone ? (
              <div className="flex gap-2">
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${lead.name}, je vous contacte au sujet de votre demande Yakout.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a href={`tel:${lead.phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                  <Phone className="h-4 w-4" />
                  Appeler
                </a>
              </div>
            ) : null}
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium text-gold transition hover:border-gold/30 hover:bg-gold/10">
                <Mail className="h-4 w-4" />
                Email
              </a>
            ) : null}
            <form action={deleteLeadAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce lead</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
