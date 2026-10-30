import { NextResponse } from "next/server";
import { demoLearner } from "@/lib/demo-data";
import type { AssistantRequest } from "@/lib/ai/contracts";
import { runAgenticAssistant } from "@/lib/ai/agentic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<AssistantRequest>;
  const learner = body.learner ?? demoLearner;
  return NextResponse.json(await runAgenticAssistant(body.message ?? "", learner, body.intent));
}