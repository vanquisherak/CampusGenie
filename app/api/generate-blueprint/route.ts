import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topic, course } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
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

    const prompt = `You are CampusGenie Academic Curriculum Architect.
Generate a comprehensive, structured learning blueprint for the subject: "${topic}" in course "${course || "Computer Science / STEM"}".
The user wants "small steps to achieve the bigger goal that is learning small things in that project to make me efficient".

Respond in JSON adhering to this schema:
- overview: A detailed 2-3 paragraph academic text explanation of the subject, its importance, and core principles.
- biggerGoal: One clear sentence stating the overarching high-level capability or project output.
- videoLinks: An array of 2-3 curated, real YouTube educational recommendations (e.g., 3Blue1Brown, StatQuest, MIT OpenCourseWare, Andrej Karpathy, Computerphile, freeCodeCamp) with title, channel, search/watch query url (use https://www.youtube.com/results?search_query=... or valid educational URL), and duration.
- microSteps: An array of 3-5 bite-sized small steps (10-20 min each) to achieve the bigger goal efficiently. Each step must have:
  - stepNumber: number (1, 2, 3...)
  - title: short punchy micro-skill
  - explanation: concise textual explanation of this specific micro-concept
  - task: hands-on micro-exercise or check
  - estimatedMinutes: number (10-20)
  - youtubeTitle: video title
  - youtubeUrl: YouTube search/watch link`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            biggerGoal: { type: Type.STRING },
            videoLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  channel: { type: Type.STRING },
                  url: { type: Type.STRING },
                  duration: { type: Type.STRING },
                },
                required: ["title", "channel", "url", "duration"],
              },
            },
            microSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  task: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  youtubeTitle: { type: Type.STRING },
                  youtubeUrl: { type: Type.STRING },
                },
                required: ["stepNumber", "title", "explanation", "task", "estimatedMinutes", "youtubeTitle", "youtubeUrl"],
              },
            },
          },
          required: ["overview", "biggerGoal", "videoLinks", "microSteps"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({ blueprint: parsed });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate blueprint";
    console.error("Blueprint generation error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
