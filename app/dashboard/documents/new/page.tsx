import {
  getOwnersForSelect,
  getApartmentsForSelect,
  getClientsForSelect,
  getVehiclesForSelect,
  getReservationsForSelect,
  getPaymentsForSelect,
  getExpensesForSelect,
  getPartnersForSelect,
} from "@/lib/data";
import type { SelectOption } from "@/lib/data";
import { getTransportTrips, getTransfers, getPackages } from "@/lib/data/transport";
import { DocumentNewForm } from "./document-new-form";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toSelectOpt(items: { id: string; title?: string | null; name?: string; destination?: string | null; destination_label?: string | null; public_title?: string | null }[]): SelectOption[] {
  return items.map((item) => ({
    id: item.id,
    label: item.title ?? item.name ?? item.public_title ?? item.destination_label ?? item.destination ?? item.id,
  }));
}

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; ownerId?: string; apartmentId?: string; clientId?: string; paymentId?: string; partnerId?: string; tripId?: string; transferId?: string; packageId?: string; type?: string; relatedType?: string }>;
}) {
  const params = await searchParams;
  const defaultOwnerId = params?.ownerId && uuidRegex.test(params.ownerId) ? params.ownerId : undefined;
  const defaultApartmentId = params?.apartmentId && uuidRegex.test(params.apartmentId) ? params.apartmentId : undefined;
  const defaultClientId = params?.clientId && uuidRegex.test(params.clientId) ? params.clientId : undefined;
  const defaultPaymentId = params?.paymentId && uuidRegex.test(params.paymentId) ? params.paymentId : undefined;
  const defaultPartnerId = params?.partnerId && uuidRegex.test(params.partnerId) ? params.partnerId : undefined;
  const defaultTripId = params?.tripId && uuidRegex.test(params.tripId) ? params.tripId : undefined;
  const defaultTransferId = params?.transferId && uuidRegex.test(params.transferId) ? params.transferId : undefined;
  const defaultPackageId = params?.packageId && uuidRegex.test(params.packageId) ? params.packageId : undefined;
  const defaultRelatedType = params?.relatedType && ["trip", "transfer", "package", "partner"].includes(params.relatedType) ? params.relatedType : undefined;
  const defaultType = params?.type === "payment_receipt" ? "payment_receipt" : undefined;

  const [owners, apartments, clients, vehicles, reservations, payments, expenses, partners, trips, transfers, packages] = await Promise.all([
    getOwnersForSelect(),
    getApartmentsForSelect(),
    getClientsForSelect(),
    getVehiclesForSelect(),
    getReservationsForSelect(),
    getPaymentsForSelect(),
    getExpensesForSelect(),
    getPartnersForSelect(),
    getTransportTrips().catch(() => []),
    getTransfers().catch(() => []),
    getPackages().catch(() => []),
  ]);

  return (
    <DocumentNewForm
      owners={owners}
      apartments={apartments}
      clients={clients}
      vehicles={vehicles}
      trips={toSelectOpt(trips)}
      transfers={toSelectOpt(transfers)}
      packages={toSelectOpt(packages)}
      reservations={reservations}
      payments={payments}
      expenses={expenses}
      partners={partners}
      defaultOwnerId={defaultOwnerId}
      defaultApartmentId={defaultApartmentId}
      defaultClientId={defaultClientId}
      defaultPaymentId={defaultPaymentId}
      defaultPartnerId={defaultPartnerId}
      defaultTripId={defaultTripId}
      defaultTransferId={defaultTransferId}
      defaultPackageId={defaultPackageId}
      defaultRelatedType={defaultRelatedType}
      defaultType={defaultType}
    />
  );
}
