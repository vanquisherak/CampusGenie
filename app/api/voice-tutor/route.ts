import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface HistoryMessage {
  role: string;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, history, topic } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          spokenResponse: "I am ready to help, but the Gemini API key is missing on the server. Please verify your environment configuration.",
          transcript,
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const rawHistory = (Array.isArray(history) ? history : []) as HistoryMessage[];
    const conversationContext = rawHistory
      .slice(-4)
      .map((h) => `${h.role === "user" ? "Student" : "CampusGenie"}: ${h.text}`)
      .join("\n");

    const prompt = `You are CampusGenie Live Voice Tutor.
You are speaking aloud directly to the student through their audio speaker.
Rules for your response:
1. Speak in a warm, encouraging, conversational academic tutoring tone.
2. Keep your answer concise (2-4 sentences max), easy to listen to without bullet points, markdown bolding, or raw mathematical LaTeX codes.
3. Pronounce concepts naturally (e.g. say "P-value" or "probability", not "$P(X)$").
4. Finish with a quick conversational check-in question to keep the student engaged.

Current Topic Focus: ${topic || "General Academic / CS / Statistics / Science"}
Recent Conversation:
${conversationContext}

Student says: "${transcript}"`;

    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let spokenText = "";

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text) {
          spokenText = response.text.trim();
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying next...`, err);
      }
    }

    if (!spokenText) {
      spokenText = `I heard you ask about ${transcript}. That's an insightful question. Let's break it down one step at a time. What part of the concept feels trickiest right now?`;
    }

    return NextResponse.json({
      spokenResponse: spokenText,
      modelUsed: "gemini-3.8-flash",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Voice Tutor encounter an error";
    console.error("Voice Tutor Error:", errorMsg);
    return NextResponse.json(
      {
        spokenResponse: "I had a momentary glitch connecting to the voice tutor engine. Could you please repeat that?",
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
