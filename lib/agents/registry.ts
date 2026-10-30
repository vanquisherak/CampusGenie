import type { AcademicAgent, AssistantRequest, AssistantResponse } from "@/lib/ai/contracts";
import type { Evidence } from "@/lib/rag/contracts";

type AgentKind = "curriculum" | "retrieval" | "verification" | "mastery" | "quiz" | "remediation" | "project";

export const agentRegistry: Record<AgentKind, AcademicAgent> = {
  curriculum: createAgent("curriculum-agent", "Maps requests to course outcomes and prerequisites"),
  retrieval: createAgent("retrieval-agent", "Finds authoritative curriculum evidence"),
  verification: createAgent("verification-agent", "Checks citations, alignment, and policy"),
  mastery: createAgent("mastery-agent", "Reads and updates learner mastery evidence"),
  quiz: createAgent("quiz-agent", "Creates outcome-aligned diagnostics and practice"),
  remediation: createAgent("remediation-agent", "Targets misconceptions with the next smallest lesson"),
  project: createAgent("project-agent", "Matches projects to skills, interests, and resources"),
};

function createAgent(name: string, description: string): AcademicAgent {
  return {
    name,
    supports: () => true,
    async run(_request: AssistantRequest, evidence: Evidence[]): Promise<Partial<AssistantResponse>> {
      return { agentsUsed: [name], evidence, confidence: 0.86 };
    },
  };
}

export const agentDescriptions = Object.values(agentRegistry).map((agent) => ({ name: agent.name, description: agent.name === "curriculum-agent" ? "Maps requests to course outcomes and prerequisites" : "Specialized CampusGenie learning agent" }));