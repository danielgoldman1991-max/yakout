import { revalidatePath } from "next/cache";

export function revalidateClientBookingGraph(input: {
  clientId: string;
  leadId?: string | null;
  reservationIds?: string[];
  apartmentIds?: string[];
  packageBookingIds?: string[];
  transportBookingIds?: string[];
  organizationId?: string | null;
}) {
  for (const path of ["/dashboard", "/dashboard/clients", `/dashboard/clients/${input.clientId}`, "/dashboard/leads", "/dashboard/reservations", "/dashboard/reservations/calendar", "/dashboard/packages", "/dashboard/transport", "/dashboard/reports"]) revalidatePath(path);
  if (input.leadId) revalidatePath(`/dashboard/leads/${input.leadId}`);
  for (const id of input.reservationIds ?? []) revalidatePath(`/dashboard/reservations/${id}`);
  for (const id of input.apartmentIds ?? []) revalidatePath(`/dashboard/apartments/${id}`);
}
