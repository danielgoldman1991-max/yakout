import { notFound } from "next/navigation";
import { getPartnerById } from "@/lib/data";
import { updatePartnerAction, deletePartnerAction } from "@/lib/data/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function PartnerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await getPartnerById(id);
  if (!partner) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Partenaires / {partner.name}</p>
        <h1 className="mt-2 text-3xl font-semibold">{partner.name}</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Modifier le partenaire</CardTitle></CardHeader>
          <CardContent>
            <FormErrorBanner />
            <form action={updatePartnerAction.bind(null, id)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom *</label>
                  <Input name="name" defaultValue={partner.name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type *</label>
                  <Input name="type" defaultValue={partner.type} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Telephone *</label>
                  <Input name="phone" defaultValue={partner.phone} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input name="email" type="email" defaultValue={partner.email ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Commission (%)</label>
                <Input name="commission" type="number" min="0" defaultValue={partner.commission ?? 0} />
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={deletePartnerAction.bind(null, id)}>
              <Button type="submit" variant="danger" className="w-full">Supprimer ce partenaire</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
