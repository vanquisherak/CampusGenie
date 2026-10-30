import type { AcademicAgent, AssistantRequest, AssistantResponse } from "@/lib/ai/contracts";
import type { Evidence } from "@/lib/rag/contracts";

type AgentKind = "curriculum" | "retrieval" | "verification" | "mastery" | "quiz" | "remediation" | "project";

export const agentRegistry: Record<AgentKind, AcademicAgent> = {
  curriculum: createAgent("curriculum-agent"),
  retrieval: createAgent("retrieval-agent"),
  verification: createAgent("verification-agent"),
  mastery: createAgent("mastery-agent"),
  quiz: createAgent("quiz-agent"),
  remediation: createAgent("remediation-agent"),
  project: createAgent("project-agent"),
};

function createAgent(name: string): AcademicAgent {
  return {
    name,
    supports: () => true,
    async run(_request: AssistantRequest, evidence: Evidence[]): Promise<Partial<AssistantResponse>> {
      return { agentsUsed: [name], evidence, confidence: 0.86 };
    },
  };
}

export const agentDescriptions = Object.values(agentRegistry).map((agent) => ({ name: agent.name, description: agent.name === "curriculum-agent" ? "Maps requests to course outcomes and prerequisites" : "Specialized CampusGenie learning agent" }));