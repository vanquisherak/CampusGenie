export type EvaluationDimension = "accuracy" | "satisfaction" | "task-completion" | "latency" | "learning-gain";

export type EvaluationRecord = {
  requestId: string;
  learnerId: string;
  dimension: EvaluationDimension;
  score: number;
  baseline?: "search" | "generic-chatbot" | "rag-only" | "agentic-assistant";
  evidence: string[];
  recordedAt: string;
};

export type EvaluationSummary = {
  accuracy: number;
  satisfaction: number;
  taskCompletion: number;
  medianLatencyMs: number;
  learningGain?: number;
};