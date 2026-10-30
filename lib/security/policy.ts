import type { Permission, UserRole } from "@/lib/security/contracts";

const rolePermissions: Record<UserRole, Permission["action"][]> = {
  student: ["read", "recommend"],
  faculty: ["read", "recommend", "grade"],
  administrator: ["read", "write", "recommend"],
};

export function can(role: UserRole, action: Permission["action"]): boolean {
  return rolePermissions[role].includes(action);
}

export function redactSensitiveInput(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [/token|secret|password|cookie|session/i.test(key) ? [key, "[REDACTED]"] : [key, value]]));
}