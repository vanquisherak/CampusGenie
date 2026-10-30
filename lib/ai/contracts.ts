import type { Evidence } from "@/lib/rag/contracts";
import type { LearningState } from "@/lib/curriculum/types";

export type AssistantIntent = "explain" | "study-plan" | "quiz" | "project" | "institutional-resource" | "remediate";

export type AssistantRequest = {
  message: string;
  intent?: AssistantIntent;
  learner: LearningState;
};

export type AssistantResponse = {
  answer: string;
  intent: AssistantIntent;
  confidence: number;
  curriculumTopics: string[];
  evidence: Evidence[];
  nextAction: string;
  agentsUsed: string[];
  provider: "configured-model" | "mock-fallback";
  providerMessage?: string;
};

export interface AcademicAgent {
  name: string;
  supports(intent: AssistantIntent): boolean;
  run(request: AssistantRequest, evidence: Evidence[]): Promise<Partial<AssistantResponse>>;
}