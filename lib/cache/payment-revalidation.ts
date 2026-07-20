import "server-only";
import { revalidatePath } from "next/cache";

export function revalidatePaymentGraph(input: { paymentId?: string | null; reservationId?: string | null; apartmentId?: string | null; clientId?: string | null; ownerId?: string | null; organizationId?: string | null }) {
  for (const path of ["/dashboard", "/dashboard/finance", "/dashboard/payments", "/dashboard/reservations", "/dashboard/reservations/calendar", "/dashboard/reports"]) revalidatePath(path);
  if (input.paymentId) revalidatePath(`/dashboard/payments/${input.paymentId}`);
  if (input.reservationId) revalidatePath(`/dashboard/reservations/${input.reservationId}`);
  if (input.apartmentId) revalidatePath(`/dashboard/apartments/${input.apartmentId}`);
  if (input.clientId) revalidatePath(`/dashboard/clients/${input.clientId}`);
  if (input.ownerId) revalidatePath(`/dashboard/owners/${input.ownerId}`);
}
