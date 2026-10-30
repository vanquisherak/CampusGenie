import type { EvaluationRecord, EvaluationSummary } from "@/lib/evaluation/contracts";

export function summarizeEvaluation(records: EvaluationRecord[]): EvaluationSummary {
  const average = (dimension: EvaluationRecord["dimension"]) => {
    const matches = records.filter((record) => record.dimension === dimension);
    return matches.length ? matches.reduce((total, record) => total + record.score, 0) / matches.length : 0;
  };
  const latencies = records.filter((record) => record.dimension === "latency").map((record) => record.score).sort((a, b) => a - b);
  return {
    accuracy: average("accuracy"),
    satisfaction: average("satisfaction"),
    taskCompletion: average("task-completion"),
    medianLatencyMs: latencies[Math.floor(latencies.length / 2)] ?? 0,
    learningGain: records.some((record) => record.dimension === "learning-gain") ? average("learning-gain") : undefined,
  };
}