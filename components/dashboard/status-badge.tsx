import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("actif") || normalized.includes("publie") || normalized.includes("paye") || normalized.includes("confirme")
    ? "gold"
    : normalized.includes("perdu") || normalized.includes("annule")
      ? "ruby"
      : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}
