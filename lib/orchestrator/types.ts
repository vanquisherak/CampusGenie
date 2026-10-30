export type RequestIntent = "explain" | "quiz" | "study-plan" | "remediate" | "project" | "institutional-resource";

export type OrchestrationStep = {
  agent: string;
  purpose: string;
  status: "planned" | "complete";
};

export type AcademicRequestPlan = {
  requestId: string;
  intent: RequestIntent;
  risk: "low" | "medium" | "high";
  topicIds: string[];
  steps: OrchestrationStep[];
  requiresConfirmation: boolean;
};