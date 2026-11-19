import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { demoLearner } from "@/lib/demo-data";
import { planAcademicRequest } from "@/lib/orchestrator/plan";
import { retrieveHybridSources, type StudyNote } from "@/lib/rag/retriever";
import type { LearningState } from "@/lib/curriculum/types";
import type { AssistantIntent } from "@/lib/ai/contracts";

interface ChatTurnInput {
  role: "user" | "model";
  text: string;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function encodeSse(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      history?: ChatTurnInput[];
      learner?: LearningState;
      notes?: StudyNote[];
      intent?: AssistantIntent;
      roomContext?: string;
    };

    const message = (body.message || "").trim();
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message prompt is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const learner = body.learner ?? demoLearner;
    const notes = Array.isArray(body.notes) ? body.notes : [];
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const plan = planAcademicRequest(message, learner);
    const intent = body.intent ?? plan.intent;
    const sources = retrieveHybridSources(message, notes, plan.topicIds, 6);
    const agentsUsed = Array.from(
      new Set([
        ...plan.steps.map((s) => s.agent),
        notes.length > 0 ? "notes-rag-retriever" : "evidence-ledger",
      ])
    );

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encodeSse("meta", {
              intent,
              agentsUsed,
              confidence: sources.some((s) => s.kind === "note") ? 0.95 : 0.93,
              sources,
              model: process.env.GEMINI_MODEL || "gemini-4-hydrogen",
            })
          );

          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });

          const systemInstruction = [
            "You are CampusGenie, a rigorous, curriculum-aware academic co-pilot.",
            "Ground your explanations in the retrieved student lecture notes and verified curriculum evidence supplied below.",
            "When citing a retrieved note or curriculum source, reference its title inline in square brackets like [Lecture 4 — Bayes Rule].",
            "Format clearly with Markdown headings or bullet points and mathematical equations where appropriate.",
            "Personalize guidance to the learner's mastery levels and active misconceptions, and end with one concrete next learning action.",
            body.roomContext ? `Active Peer Study Room Context: ${body.roomContext}` : "",
          ]
            .filter(Boolean)
            .join("\n");

          const geminiHistory = history
            .filter((t) => t.text && t.text.trim().length > 0)
            .map((t) => ({
              role: t.role,
              parts: [{ text: t.text }],
            }));

          const modelName = process.env.GEMINI_MODEL || "gemini-4-hydrogen";
          const chat = ai.chats.create({
            model: modelName,
            history: geminiHistory,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });

          const groundedTurnPrompt = `Student Query: ${message}

Learner Mastery Profile:
${learner.topics
  .map(
    (t) =>
      `- ${t.topic} (${t.mastery}%, band: ${t.band}${t.misconception ? `, active misconception: ${t.misconception}` : ""})`
  )
  .join("\n")}

Retrieved Grounding Context (${sources.length} sources):
${sources
  .map(
    (s, i) =>
      `[${i + 1}] (${s.kind.toUpperCase()}) ${s.title} | Source: ${s.sourceLabel}\nExcerpt: ${s.excerpt}`
  )
  .join("\n\n")}`;

          const responseStream = await chat.sendMessageStream({
            message: groundedTurnPrompt,
          });

          for await (const chunk of responseStream) {
            const delta = chunk.text;
            if (delta) {
              controller.enqueue(encodeSse("token", { delta }));
            }
          }

          controller.enqueue(encodeSse("done", { ok: true }));
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Streaming generation failed";
          controller.enqueue(encodeSse("error", { error: msg }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stream setup error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
