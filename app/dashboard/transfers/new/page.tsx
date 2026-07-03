import { createTransferAction } from "@/lib/data/actions";
import { getTransportPartners, getTransportVehicles } from "@/lib/data/transport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { TransferForm } from "@/components/dashboard/transfer-form";

export default async function NewTransferPage() {
  const [vehicles, partners] = await Promise.all([getTransportVehicles(), getTransportPartners()]);
  return (
    <div className="space-y-5">
      <div><p className="text-sm text-muted-foreground">Dashboard / Transferts / Nouveau</p><h1 className="mt-2 text-3xl font-semibold">Nouveau transfert</h1></div>
      <Card><CardHeader><CardTitle>Operation simple</CardTitle></CardHeader><CardContent><FormErrorBanner /><TransferForm action={createTransferAction} vehicles={vehicles} partners={partners} /></CardContent></Card>
    </div>
  );
}
