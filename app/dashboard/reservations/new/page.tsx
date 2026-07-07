import type { Client, Lead } from "@/types/business";
import { getClients, getApartmentsForSelect } from "@/lib/data";
import { getLeads } from "@/lib/data";
import { getPackages } from "@/lib/data/transport";
import ReservationWizard from "@/components/dashboard/reservation-wizard";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams?: Promise<{ apartmentId?: string; clientId?: string; leadId?: string; packageId?: string }>;
}) {
  const [clients, apartments, leads, packagesData, query] = await Promise.all([
    getClients(),
    getApartmentsForSelect(),
    getLeads(),
    getPackages(),
    searchParams ?? Promise.resolve({} as { apartmentId?: string; clientId?: string; leadId?: string; packageId?: string }),
  ]);

  const clientOptions = clients.map((c: Client) => ({ id: c.id, label: c.full_name ?? "Client", description: c.email ?? c.phone ?? undefined }));
  const leadOptions = leads.map((l: Lead) => ({ id: l.id, label: l.name ?? "Lead", description: l.request_type ?? undefined }));
  const packageOptions = packagesData.map((p: { id: string; title?: string; name?: string; internal_name?: string }) => ({
    id: p.id,
    label: p.title ?? p.name ?? p.internal_name ?? "Pack",
    description: undefined,
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Reservations / Nouvelle</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvelle reservation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assistant de reservation en 4 etapes</p>
      </div>

      <ReservationWizard
        clients={clientOptions}
        apartments={apartments}
        leads={leadOptions}
        packages={packageOptions}
        defaultApartmentId={query.apartmentId}
        defaultClientId={query.clientId}
        defaultLeadId={query.leadId}
        defaultPackageId={query.packageId}
      />
    </div>
  );
}
