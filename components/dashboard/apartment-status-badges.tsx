import { Badge } from "@/components/ui/badge";
import { managementStatusLabels, publicStatusLabels, contractStatusLabels } from "@/lib/data/apartments";

export function ApartmentStatusBadges({
  managementStatus,
  publicStatus,
  contractStatus,
}: {
  managementStatus?: string | null;
  publicStatus?: string | null;
  contractStatus?: string | null;
}) {
  const publicTone = publicStatus === "published" ? "success" : publicStatus === "ready" ? "warning" : publicStatus === "paused" ? "info" : "muted";
  const managementTone = managementStatus === "active_management" || managementStatus === "published" ? "success" : managementStatus === "contract_pending" ? "warning" : "default";
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={managementTone}>{managementStatusLabels[managementStatus ?? ""] ?? managementStatus ?? "Gestion non definie"}</Badge>
      <Badge tone={publicTone}>{publicStatusLabels[publicStatus ?? "draft"] ?? publicStatus}</Badge>
      {contractStatus && <Badge tone={contractStatus === "signed" ? "success" : contractStatus === "missing" ? "warning" : "default"}>{contractStatusLabels[contractStatus] ?? contractStatus}</Badge>}
    </div>
  );
}
