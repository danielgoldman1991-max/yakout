"use client";

import { Copy, Mail, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildMailtoUrl,
  buildWhatsAppUrl,
  renderTemplate,
  yakoutMessageTemplates,
} from "@/lib/clients-crm-shared";
import { formatDateFr } from "@/lib/dates";

type Props = {
  client: {
    full_name: string;
    phone?: string;
    email?: string;
  };
  serviceType?: string;
  apartmentName?: string;
  vehicleName?: string;
};

export function ClientMessageTemplates({ client, serviceType, apartmentName, vehicleName }: Props) {
  const [templateId, setTemplateId] = useState(yakoutMessageTemplates[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const template = yakoutMessageTemplates.find((item) => item.id === templateId) ?? yakoutMessageTemplates[0];
  const values = useMemo(() => ({
    client_name: client.full_name,
    service_type: serviceType ?? "Yakout",
    apartment_name: apartmentName ?? "",
    vehicle_name: vehicleName ?? "",
    date: formatDateFr(new Date()),
    company_name: "Yakout",
  }), [apartmentName, client.full_name, serviceType, vehicleName]);
  const message = renderTemplate(template.body, values);
  const subject = renderTemplate(template.subject ?? "Votre demande Yakout", values);
  const whatsappHref = buildWhatsAppUrl(client.phone, message);
  const mailHref = buildMailtoUrl(client.email, subject, message);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reponses pre-parametrees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {yakoutMessageTemplates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <div className="rounded-sm border border-border/60 bg-background/45 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="secondary" onClick={copyMessage}>
            <Copy className="h-4 w-4" />
            {copied ? "Copie" : "Copier"}
          </Button>
          <a
            href={whatsappHref || undefined}
            aria-disabled={!whatsappHref}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium transition ${whatsappHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-45"}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={mailHref || undefined}
            aria-disabled={!mailHref}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-medium transition ${mailHref ? "text-gold hover:border-gold/30 hover:bg-gold/10" : "pointer-events-none opacity-45"}`}
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
