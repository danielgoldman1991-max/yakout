"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PackageItem } from "@/types/business";

type DraftItem = {
  item_type: string;
  item_id?: string;
  item_slug?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_label?: string;
  price_amount: number;
  cost_amount: number;
  is_optional: boolean;
};

const emptyItem: DraftItem = {
  item_type: "custom",
  title: "",
  quantity: 1,
  price_amount: 0,
  cost_amount: 0,
  is_optional: false,
};

export function PackageItemsBuilder({ items = [] }: { items?: PackageItem[] }) {
  const initial = useMemo<DraftItem[]>(() => items.length
    ? items.map((item) => ({
      item_type: item.item_type,
      item_id: item.item_id,
      item_slug: item.item_slug,
      title: item.title,
      description: item.description,
      quantity: Number(item.quantity ?? 1),
      unit_label: item.unit_label,
      price_amount: Number(item.price_amount ?? 0),
      cost_amount: Number(item.cost_amount ?? 0),
      is_optional: Boolean(item.is_optional),
    }))
    : [{ ...emptyItem }],
  [items]);
  const [drafts, setDrafts] = useState(initial);
  const required = drafts.filter((item) => !item.is_optional);
  const total = required.reduce((sum, item) => sum + Number(item.price_amount || 0), 0);
  const cost = required.reduce((sum, item) => sum + Number(item.cost_amount || 0), 0);

  function update(index: number, patch: Partial<DraftItem>) {
    setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  return (
    <div className="space-y-4 rounded-sm border border-border/60 bg-surface/40 p-4">
      <input type="hidden" name="items_json" value={JSON.stringify(drafts.map((item, index) => ({ ...item, sort_order: index })))} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">Items du pack</p>
          <p className="mt-1 text-xs text-muted-foreground">Appartement, vehicule, transfert, circuit, service ou element personnalise.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground sm:min-w-80">
          <span>Total: {total.toLocaleString("fr-MA")} DH</span>
          <span>Cout: {cost.toLocaleString("fr-MA")} DH</span>
          <span>Marge: {(total - cost).toLocaleString("fr-MA")} DH</span>
        </div>
      </div>

      <div className="space-y-3">
        {drafts.map((item, index) => (
          <div key={index} className="rounded-sm border border-border bg-card p-3">
            <div className="grid gap-3 md:grid-cols-[150px_1fr_110px_110px_44px]">
              <select
                value={item.item_type}
                onChange={(event) => update(index, { item_type: event.target.value })}
                className="rounded-sm border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="apartment">Appartement</option>
                <option value="vehicle">Vehicule</option>
                <option value="transfer">Transfert</option>
                <option value="trip">Circuit</option>
                <option value="service">Service</option>
                <option value="guide">Guide</option>
                <option value="restaurant">Restaurant</option>
                <option value="custom">Custom</option>
              </select>
              <Input value={item.title} onChange={(event) => update(index, { title: event.target.value })} placeholder="Titre de l'element" />
              <Input value={item.price_amount} onChange={(event) => update(index, { price_amount: Number(event.target.value) })} type="number" min="0" placeholder="Prix" />
              <Input value={item.cost_amount} onChange={(event) => update(index, { cost_amount: Number(event.target.value) })} type="number" min="0" placeholder="Cout" />
              <Button type="button" variant="ghost" className="h-10 px-2 text-destructive" onClick={() => setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_150px]">
              <Textarea value={item.description ?? ""} onChange={(event) => update(index, { description: event.target.value })} placeholder="Description courte" rows={2} />
              <Input value={item.quantity} onChange={(event) => update(index, { quantity: Number(event.target.value) })} type="number" min="0" step="0.5" placeholder="Quantite" />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={item.is_optional} onChange={(event) => update(index, { is_optional: event.target.checked })} />
                Optionnel
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={() => setDrafts((current) => [...current, { ...emptyItem }])}>
        <Plus className="h-4 w-4" />
        Ajouter un item
      </Button>
    </div>
  );
}
