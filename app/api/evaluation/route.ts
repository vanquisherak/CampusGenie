import { NextResponse } from "next/server";
import { summarizeEvaluation } from "@/lib/evaluation/metrics";
import type { EvaluationRecord } from "@/lib/evaluation/contracts";

export async function POST(request: Request) {
  const records = (await request.json().catch(() => [])) as EvaluationRecord[];
  return NextResponse.json({ summary: summarizeEvaluation(records), dimensions: ["accuracy", "satisfaction", "task-completion", "latency", "learning-gain"] });
}