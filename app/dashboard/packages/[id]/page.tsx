import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePackageAction, updatePackageAction } from "@/lib/data/actions";
import { getPackageById } from "@/lib/data/transport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { PackageForm } from "@/components/dashboard/package_form";
import { formatCurrency } from "@/lib/formatters";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPackageById(id);
  if (!pack) notFound();
  const required = pack.package_items?.filter((item) => !item.is_optional) ?? [];
  const revenue = required.reduce((sum, item) => sum + Number(item.price_amount ?? 0), 0);
  const cost = required.reduce((sum, item) => sum + Number(item.cost_amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm text-muted-foreground">Dashboard / Packs / {pack.title}</p><h1 className="mt-2 text-3xl font-semibold">{pack.public_title ?? pack.title}</h1><div className="mt-2"><StatusBadge status={pack.public_status} /></div><p className="mt-2 text-sm text-muted-foreground">Prix: {formatCurrency(pack.price_from ?? revenue)} · Cout: {formatCurrency(cost)} · Marge: {formatCurrency(revenue - cost)}</p></div>
        {pack.public_status === "published" ? <Link href={`/packages/${pack.slug}`}><Button variant="secondary">Voir sur site</Button></Link> : null}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <form action={updatePackageAction.bind(null, id)} className="space-y-5"><FormErrorBanner /><PackageForm pack={pack} /><Button type="submit">Enregistrer</Button></form>
        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Composition</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{pack.package_items?.length ? pack.package_items.map((item) => <div key={item.id} className="rounded-sm border border-border p-3"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.item_type} · {formatCurrency(item.price_amount ?? 0)} · cout {formatCurrency(item.cost_amount ?? 0)}</p></div>) : <p className="text-muted-foreground">Aucun item.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Demande client</CardTitle></CardHeader><CardContent><Link href={`/contact?type=package&package=${pack.slug}`}><Button variant="secondary" className="w-full">Tester le CTA contact</Button></Link></CardContent></Card>
          <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent><form action={deletePackageAction.bind(null, id)}><Button type="submit" variant="danger" className="w-full">Supprimer ce pack</Button></form></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
