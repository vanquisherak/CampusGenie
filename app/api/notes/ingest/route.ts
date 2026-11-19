import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { splitTextIntoChunks, type NoteChunk, type StudyNote } from "@/lib/rag/retriever";
import { sanitizeDocId } from "@/lib/firebase";

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let course = "General";
    let fileName = "pasted-notes.md";
    let chunks: NoteChunk[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      title = String(formData.get("title") || "").trim();
      course = String(formData.get("course") || "General").trim() || "General";

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      fileName = file.name || "uploaded-notes";
      if (!title) {
        title = fileName.replace(/\.(pdf|md|txt)$/i, "").replace(/[_-]+/g, " ");
      }

      const isPdf =
        file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        if (file.size > MAX_PDF_BYTES) {
          return NextResponse.json(
            { error: "PDF file exceeds 8 MB limit. Upload a smaller chapter or extract text." },
            { status: 400 }
          );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "GEMINI_API_KEY is required on the server to index PDF documents." },
            { status: 500 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-4-hydrogen",
          contents: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            `Extract and index the academic content from this lecture note PDF ("${fileName}") into up to 20 structured, retrieval-ready study chunks for RAG Q&A. Preserve key equations, definitions, theorems, and examples faithfully.`,
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedTitle: { type: Type.STRING },
                chunks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      content: { type: Type.STRING },
                      keywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ["heading", "content", "keywords"],
                  },
                },
              },
              required: ["chunks"],
            },
          },
        });

        const rawJson = response.text?.trim() || "{}";
        const parsed = JSON.parse(rawJson) as {
          detectedTitle?: string;
          chunks?: Array<{ heading: string; content: string; keywords: string[] }>;
        };

        if (parsed.detectedTitle && !formData.get("title")) {
          title = parsed.detectedTitle.slice(0, 140);
        }

        chunks = (parsed.chunks || []).slice(0, 25).map((c, idx) => ({
          id: `chunk-${idx + 1}`,
          heading: String(c.heading || title).slice(0, 100),
          content: String(c.content || "").slice(0, 880),
          keywords: Array.isArray(c.keywords)
            ? c.keywords.slice(0, 8).map((k) => String(k).slice(0, 40))
            : [],
        }));
      } else {
        const text = await file.text();
        if (!text.trim()) {
          return NextResponse.json({ error: "Uploaded text file is empty." }, { status: 400 });
        }
        chunks = splitTextIntoChunks(text, title || fileName, 25);
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        title?: string;
        course?: string;
        text?: string;
        fileName?: string;
      };
      const rawText = (body.text || "").trim();
      if (!rawText) {
        return NextResponse.json({ error: "Note content is required." }, { status: 400 });
      }
      title = (body.title || "Lecture Note Excerpt").trim().slice(0, 150);
      course = (body.course || "General").trim().slice(0, 90);
      fileName = (body.fileName || "pasted-notes.md").trim().slice(0, 150);
      chunks = splitTextIntoChunks(rawText, title, 25);
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Could not extract study chunks from this document." },
        { status: 422 }
      );
    }

    const note: StudyNote = {
      id: sanitizeDocId(`note_${Date.now()}`),
      title: (title || fileName).slice(0, 150),
      fileName: fileName.slice(0, 150),
      course: course.slice(0, 90),
      chunkCount: chunks.length,
      chunks,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to index study notes";
    console.error("Notes Ingest Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
