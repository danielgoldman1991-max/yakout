import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status?: string | null }) {
  const label = status ?? "Inconnu";
  const normalized = label.toLowerCase();
  const tone = normalized.includes("actif") || normalized.includes("publie") || normalized.includes("paye") || normalized.includes("confirme")
    ? "gold"
    : normalized.includes("perdu") || normalized.includes("annule")
      ? "ruby"
      : "muted";

  return <Badge tone={tone}>{label}</Badge>;
}
