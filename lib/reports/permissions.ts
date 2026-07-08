import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALL_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "reports.executive.view",
    "reports.sales.view",
    "reports.accommodation.view",
    "reports.owners.view",
    "reports.finance.view",
    "reports.operations.view",
    "reports.transport.view",
    "reports.fleet.view",
    "reports.packages.view",
    "reports.clients.view",
    "reports.compliance.view",
    "reports.data_quality.view",
    "reports.export",
    "reports.schedule",
  ],
  manager: [
    "reports.executive.view",
    "reports.sales.view",
    "reports.accommodation.view",
    "reports.owners.view",
    "reports.finance.view",
    "reports.operations.view",
    "reports.transport.view",
    "reports.fleet.view",
    "reports.packages.view",
    "reports.clients.view",
    "reports.compliance.view",
    "reports.data_quality.view",
    "reports.export",
  ],
  staff: [
    "reports.accommodation.view",
    "reports.transport.view",
    "reports.operations.view",
    "reports.export",
  ],
};

export async function getUserPermissions(): Promise<string[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile) return [];
    return ALL_PERMISSIONS[profile.role as keyof typeof ALL_PERMISSIONS] ?? [];
  } catch {
    return [];
  }
}

export async function canViewReport(permission: string): Promise<boolean> {
  const perms = await getUserPermissions();
  return perms.includes(permission);
}

export function canViewReportSync(permission: string, userPermissions: string[]): boolean {
  return userPermissions.includes(permission);
}
