import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface GroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query, topic } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const prompt = `You are CampusGenie Academic Research Grounding Engine.
Answer the following student academic/scientific query using live Google Search:
Query: "${query}"
${topic ? `Context Topic: ${topic}` : ""}

Provide a rigorous, clear synthesis with key points, peer-reviewed contexts, or official syllabus standards. Keep it focused and academic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    const rawChunks = (groundingMetadata?.groundingChunks || []) as GroundingChunk[];
    const citations = rawChunks
      .map((chunk) => ({
        title: chunk.web?.title || "Academic Source",
        uri: chunk.web?.uri || "",
      }))
      .filter((c) => Boolean(c.uri));

    const searchQueries = (groundingMetadata?.webSearchQueries || []) as string[];

    return NextResponse.json({
      answer: response.text || "No synthesis could be generated.",
      citations,
      searchQueries,
      model: "gemini-3.8-flash",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to execute grounded search";
    console.error("Grounded Search Error:", errorMsg);
    return NextResponse.json(
      {
        error: errorMsg,
        answer: null,
      },
      { status: 500 }
    );
  }
}
