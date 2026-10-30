import type { LearningState } from "@/lib/curriculum/types";
import type { AcademicRequestPlan, RequestIntent } from "@/lib/orchestrator/types";

const intentMatchers: Array<[RequestIntent, RegExp]> = [
  ["quiz", /quiz|test|practice|diagnostic/i],
  ["study-plan", /study plan|prepare|revision|schedule/i],
  ["remediate", /confused|misconception|wrong|improve|weak/i],
  ["project", /project|capstone|idea|recommend/i],
  ["institutional-resource", /library|deadline|course|lms|resource/i],
];

export function planAcademicRequest(message: string, learner: LearningState): AcademicRequestPlan {
  const intent = intentMatchers.find(([, matcher]) => matcher.test(message))?.[0] ?? "explain";
  const topicIds = learner.topics.filter((topic) => message.toLowerCase().includes(topic.topic.toLowerCase().split(" ")[0])).map((topic) => topic.topicId);
  const selectedTopicIds = topicIds.length > 0 ? topicIds : learner.topics.filter((topic) => topic.band !== "mastered").slice(0, 2).map((topic) => topic.topicId);
  const requiresConfirmation = intent === "institutional-resource";

  return {
    requestId: `req-${Date.now()}`,
    intent,
    risk: requiresConfirmation ? "medium" : "low",
    topicIds: selectedTopicIds,
    requiresConfirmation,
    steps: [
      { agent: "context-resolver", purpose: "Resolve course, learner, and curriculum context", status: "planned" },
      { agent: "curriculum-agent", purpose: "Map request to outcomes and prerequisites", status: "planned" },
      { agent: "retrieval-agent", purpose: "Retrieve authoritative evidence", status: "planned" },
      { agent: intent === "quiz" ? "quiz-agent" : intent === "project" ? "project-agent" : "learning-agent", purpose: "Generate the personalized result", status: "planned" },
      { agent: "verification-agent", purpose: "Check evidence, policy, and curriculum alignment", status: "planned" },
    ],
  };
}