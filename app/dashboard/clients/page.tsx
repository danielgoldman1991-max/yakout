import { ClientsCrmList } from "@/components/dashboard/clients-crm-list";
import { getClientCrmSummaries } from "@/lib/clients-crm";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ invalidClient?: string }> }) {
  const { invalidClient } = await searchParams;
  const clients = await getClientCrmSummaries();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Clients</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">CRM Clients 360</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Centre relation client premium pour suivre demandes, reservations, relances, avis et valeur commerciale Yakout.
        </p>
      </div>

      {invalidClient && (
        <div className="rounded-sm border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-200">
          Ancien lien demo invalide. Ouvrez la fiche depuis la liste clients.
        </div>
      )}

      <ClientsCrmList clients={clients} />
    </div>
  );
}
