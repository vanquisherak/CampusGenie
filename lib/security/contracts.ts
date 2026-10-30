export type UserRole = "student" | "faculty" | "administrator";

export type Permission = {
  role: UserRole;
  action: "read" | "write" | "grade" | "recommend";
  resource: string;
};

export type ConsentRecord = {
  learnerId: string;
  purpose: "personalization" | "evaluation" | "institutional-action";
  granted: boolean;
  recordedAt: string;
  expiresAt?: string;
};

export type AgentTrace = {
  traceId: string;
  learnerId: string;
  requestId: string;
  agent: string;
  event: "planned" | "retrieved" | "generated" | "verified" | "tool-called" | "completed";
  metadata: Record<string, string | number | boolean>;
  timestamp: string;
};