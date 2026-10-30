import { demoEvidence } from "@/lib/demo-data";
import { GoogleGenAI } from "@google/genai";
import { planAcademicRequest } from "@/lib/orchestrator/plan";
import { prerequisiteIds } from "@/lib/graph/curriculum";
import type { AssistantResponse } from "@/lib/ai/contracts";
import type { LearningState } from "@/lib/curriculum/types";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export async function runAgenticAssistant(message: string, learner: LearningState): Promise<AssistantResponse> {
  const plan = planAcademicRequest(message, learner);
  const evidence = demoEvidence.filter((item) => item.topicIds.some((topicId) => plan.topicIds.includes(topicId) || topicId === "stats-bayes"));
  const topicContext = [...plan.topicIds, ...prerequisiteIds(plan.topicIds)];
  const modelResult = await generateWithConfiguredModel(message, learner, plan.intent, evidence);
  const answer = verifyAnswer(modelResult.answer ?? fallbackAnswer(plan.intent), evidence);

  return {
    answer,
    intent: plan.intent,
    confidence: modelResult.answer ? 0.93 : 0.86,
    curriculumTopics: topicContext,
    evidence,
    nextAction: learner.topics.find((topic) => plan.topicIds.includes(topic.topicId))?.nextAction ?? "Take the adaptive diagnostic",
    agentsUsed: [...plan.steps.map((step) => step.agent), "evidence-ledger"],
    provider: modelResult.answer ? "configured-model" : "mock-fallback",
    providerMessage: modelResult.message,
  };
}

async function generateWithConfiguredModel(message: string, learner: LearningState, intent: string, evidence: typeof demoEvidence): Promise<{ answer: string | null; message?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  if (geminiKey) return generateWithGemini(geminiKey, geminiModel, message, learner, intent, evidence);

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) return { answer: null, message: "AI_API_BASE_URL, AI_API_KEY, and AI_MODEL are required; using the local learning fallback." };

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are CampusGenie, a curriculum-aware academic assistant. Answer only from the supplied evidence, be concise, and finish with one concrete learning action." },
          { role: "user", content: JSON.stringify({ intent, question: message, learnerTopics: learner.topics, evidence }) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { answer: null, message: `Provider returned HTTP ${response.status}; check AI_API_BASE_URL, AI_MODEL, and key permissions.` };
    const payload = (await response.json()) as ChatCompletionResponse;
    const answer = payload.choices?.[0]?.message?.content?.trim() || null;
    return answer ? { answer } : { answer: null, message: "Provider returned no assistant content; using the local learning fallback." };
  } catch {
    return { answer: null, message: "Provider request failed or timed out; using the local learning fallback." };
  }
}

function verifyAnswer(answer: string, evidence: typeof demoEvidence): string {
  if (!answer || evidence.length === 0) return "I could not find enough curriculum evidence to answer safely. Try asking about one of your active topics.";
  return answer;
}

function fallbackAnswer(intent: string): string {
  if (intent === "quiz") return "I prepared an adaptive diagnostic around Bayesian inference. Start with the distinction between a prior and a likelihood, then use your answer to update the next question.";
  if (intent === "project") return "I matched project ideas to your current skills and learning gaps. Start with the campus energy forecasting project because it strengthens statistics while using your Python experience.";
  if (intent === "study-plan") return "Your next study block should target Bayesian inference, followed by a short diagnostic and a worked example. This sequence addresses the active misconception before the next module.";
  return "A prior is your starting belief before seeing new evidence. The likelihood describes how compatible the observed evidence is with a hypothesis. CampusGenie will use your next diagnostic answers to choose the next example.";
}

async function generateWithGemini(apiKey: string, model: string, message: string, learner: LearningState, intent: string, evidence: typeof demoEvidence): Promise<{ answer: string | null; message?: string }> {
  try {
    const client = new GoogleGenAI({ apiKey });
    const interaction = await Promise.race([
      client.interactions.create({
        model,
        input: JSON.stringify({
          request: message,
          intent,
          learnerTopics: learner.topics,
          curriculumEvidence: evidence,
        }),
        system_instruction: "You are CampusGenie, a curriculum-aware academic agent. Use only the supplied curriculum evidence. Personalize the response to the learner topics, explain clearly, and end with one concrete next learning action. Never invent institutional facts or claim an action was completed.",
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini request timed out after 15 seconds")), 15000)),
    ]);
    const answer = interaction.output_text?.trim() || null;
    return answer ? { answer } : { answer: null, message: "Gemini returned no assistant text; using the local learning fallback." };
  } catch {
    return { answer: null, message: "Gemini request failed or timed out; check GEMINI_API_KEY, GEMINI_MODEL, and API access." };
  }
}