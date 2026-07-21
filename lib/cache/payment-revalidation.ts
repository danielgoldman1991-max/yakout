import "server-only";
import { revalidatePath } from "next/cache";

type FinancialGraph = {
  paymentId?: string | null;
  reservationIds?: string[];
  apartmentIds?: string[];
  clientIds?: string[];
  ownerIds?: string[];
  tripIds?: string[];
  transferIds?: string[];
  packageIds?: string[];
  maintenanceIds?: string[];
  partnerIds?: string[];
  organizationId?: string | null;
};

export function revalidateFinancialTransactionGraph(input: FinancialGraph) {
  for (const path of ["/dashboard", "/dashboard/payments", "/dashboard/reservations", "/dashboard/reservations/calendar", "/dashboard/apartments", "/dashboard/clients", "/dashboard/owners", "/dashboard/transport", "/dashboard/packages", "/dashboard/expenses", "/dashboard/reports"]) revalidatePath(path);
  if (input.paymentId) revalidatePath(`/dashboard/payments/${input.paymentId}`);
  for (const id of input.reservationIds ?? []) revalidatePath(`/dashboard/reservations/${id}`);
  for (const id of input.apartmentIds ?? []) revalidatePath(`/dashboard/apartments/${id}`);
  for (const id of input.clientIds ?? []) revalidatePath(`/dashboard/clients/${id}`);
  for (const id of input.ownerIds ?? []) revalidatePath(`/dashboard/owners/${id}`);
  for (const id of input.tripIds ?? []) revalidatePath(`/dashboard/trips/${id}`);
  for (const id of input.transferIds ?? []) revalidatePath(`/dashboard/transfers/${id}`);
  for (const id of input.packageIds ?? []) revalidatePath(`/dashboard/packages/${id}`);
  for (const id of input.maintenanceIds ?? []) revalidatePath(`/dashboard/maintenance/${id}`);
  for (const id of input.partnerIds ?? []) revalidatePath(`/dashboard/partners/${id}`);
}

export function revalidatePaymentGraph(input: { paymentId?: string | null; reservationId?: string | null; apartmentId?: string | null; clientId?: string | null; ownerId?: string | null; organizationId?: string | null }) {
  revalidateFinancialTransactionGraph({
    paymentId: input.paymentId,
    reservationIds: input.reservationId ? [input.reservationId] : [],
    apartmentIds: input.apartmentId ? [input.apartmentId] : [],
    clientIds: input.clientId ? [input.clientId] : [],
    ownerIds: input.ownerId ? [input.ownerId] : [],
    organizationId: input.organizationId,
  });
}
