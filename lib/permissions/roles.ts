import type { UserRole } from "@/types/auth";
import { userRoles } from "@/types/auth";

export { userRoles };

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function canManageDashboard(role: UserRole) {
  return role === "admin" || role === "manager" || role === "staff";
}

export function canManageSettings(role: UserRole) {
  return role === "admin";
}

export function canPublishContent(role: UserRole) {
  return role === "admin" || role === "manager";
}
