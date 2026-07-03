import { notFound } from "next/navigation";
import { getTransferById, getTransportPartners, getTransportVehicles } from "@/lib/data/transport";
import { deleteTransferAction, updateTransferAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { TransferForm } from "@/components/dashboard/transfer-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatCurrency } from "@/lib/formatters";

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [transfer, vehicles, partners] = await Promise.all([getTransferById(id), getTransportVehicles(), getTransportPartners()]);
  if (!transfer) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Transferts / {transfer.transfer_type}</p>
        <h1 className="mt-2 text-3xl font-semibold">{transfer.pickup_location ?? "Transfert"} {"->"} {transfer.dropoff_location ?? "Destination"}</h1>
        <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={transfer.status} /><StatusBadge status={transfer.payment_status} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Marge estimee : {formatCurrency(Number(transfer.amount ?? 0) - Number(transfer.cost_amount ?? 0))}</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card><CardHeader><CardTitle>Modifier le transfert</CardTitle></CardHeader><CardContent><FormErrorBanner /><TransferForm action={updateTransferAction.bind(null, id)} transfer={transfer} vehicles={vehicles} partners={partners} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="space-y-3"><form action={deleteTransferAction.bind(null, id)}><Button type="submit" variant="danger" className="w-full">Supprimer ce transfert</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
