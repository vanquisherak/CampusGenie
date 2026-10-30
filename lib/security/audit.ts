import type { AgentTrace } from "@/lib/security/contracts";

export type AuditEvent = AgentTrace & { outcome: "allowed" | "blocked" | "completed" };

export function createAuditEvent(trace: AgentTrace, outcome: AuditEvent["outcome"]): AuditEvent {
  return { ...trace, outcome };
}