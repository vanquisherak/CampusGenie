import { demoEvidence } from "@/lib/demo-data";
import { curriculumGraph } from "@/lib/graph/curriculum";

export interface NoteChunk {
  id: string;
  heading: string;
  content: string;
  keywords: string[];
}

export interface StudyNote {
  id: string;
  title: string;
  fileName: string;
  course: string;
  chunkCount: number;
  chunks: NoteChunk[];
  createdAt: string;
}

export interface RetrievedSource {
  id: string;
  kind: "note" | "curriculum";
  title: string;
  sourceLabel: string;
  excerpt: string;
  score: number;
  keywords: string[];
}

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were", "what",
  "when", "where", "which", "how", "why", "into", "about", "your", "you", "can",
  "could", "would", "should", "have", "has", "had", "not", "but", "they", "their",
  "explain", "show", "give", "make", "tell", "using", "between", "over", "than",
]);

export function tokenizeForRag(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Splits plain text / Markdown lecture notes into compact, overlapping semantic chunks
 * constrained to maxChunks (default 25 to fit safely within Firestore StudyNote schema).
 */
export function splitTextIntoChunks(
  rawText: string,
  fallbackTitle: string,
  maxChunks = 25
): NoteChunk[] {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split first by markdown headings or double newlines
  const sections = normalized
    .split(/\n(?=#{1,3}\s)|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  const chunks: NoteChunk[] = [];
  let currentHeading = fallbackTitle;

  for (const section of sections) {
    if (chunks.length >= maxChunks) break;

    const lines = section.split("\n");
    const firstLine = lines[0]?.trim() || "";
    let body = section;

    if (firstLine.startsWith("#")) {
      currentHeading = firstLine.replace(/^#+\s*/, "").slice(0, 80) || fallbackTitle;
      body = lines.slice(1).join("\n").trim() || currentHeading;
    } else if (firstLine.length > 0 && firstLine.length <= 70 && lines.length > 1) {
      currentHeading = firstLine;
    }

    // Slice oversized sections cleanly at ~750 chars
    let cursor = 0;
    while (cursor < body.length && chunks.length < maxChunks) {
      const slice = body.slice(cursor, cursor + 750).trim();
      if (slice.length >= 15) {
        const keywords = Array.from(new Set(tokenizeForRag(`${currentHeading} ${slice}`))).slice(0, 8);
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          heading: currentHeading.slice(0, 80),
          content: slice,
          keywords,
        });
      }
      cursor += 650;
    }
  }

  // Edge case: short single-paragraph note
  if (chunks.length === 0) {
    const snippet = normalized.slice(0, 750);
    chunks.push({
      id: "chunk-1",
      heading: fallbackTitle.slice(0, 80),
      content: snippet,
      keywords: Array.from(new Set(tokenizeForRag(`${fallbackTitle} ${snippet}`))).slice(0, 8),
    });
  }

  return chunks.slice(0, maxChunks);
}

/**
 * Hybrid keyword + phrase + curriculum node ranker across uploaded user PDF/text StudyNotes
 * and verified curriculum evidence.
 */
export function retrieveHybridSources(
  query: string,
  notes: StudyNote[] = [],
  topicIds: string[] = [],
  topK = 6
): RetrievedSource[] {
  const queryTokens = tokenizeForRag(query);
  const queryLower = query.toLowerCase();
  const results: RetrievedSource[] = [];

  // 1. Score User Uploaded StudyNote Chunks (Higher priority when directly matching uploaded notes)
  for (const note of notes) {
    for (const chunk of note.chunks || []) {
      const haystack = `${note.title} ${note.course} ${chunk.heading} ${chunk.content} ${(chunk.keywords || []).join(" ")}`.toLowerCase();
      let score = 0;

      for (const token of queryTokens) {
        if (chunk.heading.toLowerCase().includes(token)) score += 3.2;
        if (note.title.toLowerCase().includes(token) || note.course.toLowerCase().includes(token)) score += 2.0;
        if ((chunk.keywords || []).some((kw) => kw.toLowerCase().includes(token))) score += 2.5;
        if (haystack.includes(token)) score += 1.4;
      }

      if (queryLower.length > 6 && haystack.includes(queryLower.slice(0, 24))) {
        score += 4;
      }

      // If user asks explicitly about their uploaded notes/PDF, boost all note chunks slightly
      if (
        (queryLower.includes("note") || queryLower.includes("pdf") || queryLower.includes("lecture") || queryLower.includes("uploaded")) &&
        score === 0
      ) {
        score = 1.1;
      }

      if (score > 0) {
        results.push({
          id: `${note.id}-${chunk.id}`,
          kind: "note",
          title: `${note.title} — ${chunk.heading}`,
          sourceLabel: `${note.fileName} (${note.course})`,
          excerpt: chunk.content.slice(0, 420),
          score: Number(score.toFixed(2)),
          keywords: chunk.keywords || [],
        });
      }
    }
  }

  // 2. Score Verified Curriculum Evidence
  for (const ev of demoEvidence) {
    const haystack = `${ev.title} ${ev.source} ${ev.excerpt} ${ev.topicIds.join(" ")}`.toLowerCase();
    let score = ev.topicIds.some((tid) => topicIds.includes(tid)) ? 2.2 : 0;

    for (const token of queryTokens) {
      if (ev.title.toLowerCase().includes(token)) score += 2.5;
      if (haystack.includes(token)) score += 1.2;
    }

    if (score > 0 || results.length < 2) {
      results.push({
        id: ev.id,
        kind: "curriculum",
        title: ev.title,
        sourceLabel: `${ev.source} (${ev.authority})`,
        excerpt: ev.excerpt,
        score: Number((score > 0 ? score : 0.4).toFixed(2)),
        keywords: ev.topicIds,
      });
    }
  }

  // 3. Score Curriculum Graph Nodes for Concept Dependency Context
  for (const node of curriculumGraph) {
    if (topicIds.includes(node.id) || queryTokens.some((t) => node.label.toLowerCase().includes(t))) {
      results.push({
        id: `graph-${node.id}`,
        kind: "curriculum",
        title: `Curriculum Node: ${node.label}`,
        sourceLabel: `Prerequisites: ${node.prerequisites.join(", ") || "None"}`,
        excerpt: `${node.label} (${node.type}) depends on: ${node.prerequisites.join(", ") || "Foundational axioms"}. Linked outcomes: ${node.outcomeIds.join(", ") || "Core curriculum"}.`,
        score: 1.5,
        keywords: [node.id, ...node.prerequisites],
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
