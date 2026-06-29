export const userRoles = ["admin", "manager", "staff"] as const;

export type UserRole = (typeof userRoles)[number];
