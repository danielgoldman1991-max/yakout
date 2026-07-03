import Image from "next/image";
import Link from "next/link";
import { Box, Plus, Sparkles, TrendingUp } from "lucide-react";
import { getPackages } from "@/lib/data/transport";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function PackagesPage() {
  const packages = await getPackages();
  const published = packages.filter((pack) => pack.public_status === "published").length;
  const margin = packages.reduce((sum, pack) => {
    const required = pack.package_items?.filter((item) => !item.is_optional) ?? [];
    const revenue = required.reduce((itemSum, item) => itemSum + Number(item.price_amount ?? 0), 0);
    const cost = required.reduce((itemSum, item) => itemSum + Number(item.cost_amount ?? 0), 0);
    return sum + revenue - cost;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm text-muted-foreground">Dashboard / Transport & Sejours</p><h1 className="mt-2 text-3xl font-semibold">Packs & Sejours</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Offres composees : appartement, transfert, vehicule, chauffeur, circuit et services a la carte.</p></div>
        <Link href="/dashboard/packages/new"><Button><Plus className="h-4 w-4" /> Nouveau pack</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3"><KpiCard title="Packs" value={String(packages.length)} icon={Box} /><KpiCard title="Publies" value={String(published)} icon={Sparkles} /><KpiCard title="Marge theorique" value={formatCurrency(margin)} icon={TrendingUp} /></div>
      {packages.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">Aucun pack Supabase.</Card> : (
        <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Pack</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Destination</th><th className="px-4 py-3 font-medium">Items</th><th className="px-4 py-3 font-medium">Prix</th><th className="px-4 py-3 font-medium">Publication</th><th className="px-4 py-3 font-medium">Site</th></tr></thead><tbody>{packages.map((pack) => (<tr key={pack.id} className="border-t border-border/60"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="relative h-12 w-16 overflow-hidden rounded-sm border border-border bg-card">{pack.image_url ? <Image src={pack.image_url} alt={pack.image_alt_text || pack.title} fill sizes="64px" className="object-cover" unoptimized /> : null}</div><div><Link href={`/dashboard/packages/${pack.id}`} className="font-medium hover:text-gold hover:underline">{pack.public_title ?? pack.title}</Link><p className="text-xs text-muted-foreground">{pack.slug}</p></div></div></td><td className="px-4 py-3">{pack.package_type}</td><td className="px-4 py-3">{pack.destination ?? "-"}</td><td className="px-4 py-3">{pack.package_items?.length ?? 0}</td><td className="px-4 py-3">{formatCurrency(pack.price_from ?? 0)}</td><td className="px-4 py-3"><StatusBadge status={pack.public_status} /></td><td className="px-4 py-3">{pack.public_status === "published" ? <Link href={`/packages/${pack.slug}`} className="text-gold hover:underline">Voir</Link> : "-"}</td></tr>))}</tbody></table></div></Card>
      )}
    </div>
  );
}
