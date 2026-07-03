import { createPartnerAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { PartnerForm } from "@/components/dashboard/partner_form";

export default function NewPartnerPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Partenaires / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau partenaire</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Fournisseur</CardTitle></CardHeader>
        <CardContent>
          <FormErrorBanner />
          <PartnerForm action={createPartnerAction} />
        </CardContent>
      </Card>
    </div>
  );
}
