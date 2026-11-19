"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  BookOpen,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { StudyNote } from "@/lib/rag/retriever";

interface NotesRagPanelProps {
  notes: StudyNote[];
  useNotesInRag: boolean;
  onToggleUseNotes: (next: boolean) => void;
  onNoteAdded: (note: StudyNote) => void;
  onNoteDeleted: (noteId: string) => void;
  onAskAboutNote?: (prompt: string) => void;
  isSignedIn: boolean;
}

export function NotesRagPanel({
  notes,
  useNotesInRag,
  onToggleUseNotes,
  onNoteAdded,
  onNoteDeleted,
  onAskAboutNote,
  isSignedIn,
}: NotesRagPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [course, setCourse] = useState("Applied Statistics");
  const [title, setTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalChunks = notes.reduce((sum, n) => sum + (n.chunkCount || n.chunks?.length || 0), 0);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIndexing(true);
    setStatusMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("course", course);

      const res = await fetch("/api/notes/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to index file");

      onNoteAdded(data.note as StudyNote);
      onToggleUseNotes(true);
      setTitle("");
      setExpanded(true);
      setStatusMsg({
        kind: "ok",
        text: `Indexed "${data.note.title}" (${data.note.chunkCount} semantic chunks)${
          isSignedIn ? " & synced to Firestore" : ""
        }.`,
      });
    } catch (err: unknown) {
      setStatusMsg({
        kind: "err",
        text: err instanceof Error ? err.message : "Could not index file",
      });
    } finally {
      setIsIndexing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setIsIndexing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/notes/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Lecture Notes Excerpt",
          course,
          fileName: "pasted-notes.md",
          text: pasteText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to index pasted notes");

      onNoteAdded(data.note as StudyNote);
      onToggleUseNotes(true);
      setTitle("");
      setPasteText("");
      setShowPasteBox(false);
      setExpanded(true);
      setStatusMsg({
        kind: "ok",
        text: `Indexed "${data.note.title}" (${data.note.chunkCount} chunks).`,
      });
    } catch (err: unknown) {
      setStatusMsg({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to index notes",
      });
    } finally {
      setIsIndexing(false);
    }
  }

  return (
    <div className="mb-3 rounded-2xl border border-stone-200/90 bg-white/80 backdrop-blur-sm p-3.5 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 font-semibold text-slate-900 hover:text-[var(--cobalt)] transition"
          >
            <BookOpen size={14} className="text-[var(--cobalt)]" />
            <span>Notes RAG Library</span>
            <span className="font-mono text-[10px] text-stone-500">
              ({notes.length} {notes.length === 1 ? "doc" : "docs"} · {totalChunks} chunks)
            </span>
          </button>

          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleUseNotes(!useNotesInRag)}
              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border transition ${
                useNotesInRag
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-stone-100 text-stone-500 border-stone-200"
              }`}
            >
              {useNotesInRag ? "RAG Active" : "RAG Paused"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            disabled={isIndexing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-[var(--cobalt)] text-white px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50"
          >
            <Upload size={11} />
            <span>{isIndexing ? "Indexing..." : "Upload PDF / MD"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setShowPasteBox((p) => !p);
            }}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 px-2.5 py-1 text-[11px] font-medium transition"
          >
            <Plus size={11} />
            <span>Paste Notes</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mt-2.5 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] ${
            statusMsg.kind === "ok"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {statusMsg.kind === "ok" ? (
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={13} className="shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-stone-400 hover:text-slate-800"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
          {showPasteBox && (
            <form
              onSubmit={handlePasteSubmit}
              className="rounded-xl bg-stone-50 border border-stone-200 p-3 space-y-2"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title (e.g. Week 5 Bayes Slides)"
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--cobalt)]"
                />
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Course (e.g. STAT-301)"
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--cobalt)]"
                />
              </div>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste markdown lecture notes, formulas, or syllabus excerpts..."
                className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-[var(--cobalt)]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteBox(false)}
                  className="px-3 py-1 rounded-lg text-[11px] text-stone-600 hover:bg-stone-200/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIndexing || !pasteText.trim()}
                  className="px-3.5 py-1 rounded-lg bg-[var(--cobalt)] text-white text-[11px] font-semibold disabled:opacity-50"
                >
                  {isIndexing ? "Indexing..." : "Index Notes"}
                </button>
              </div>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="text-[11px] text-stone-500">
              Upload any lecture PDF, Markdown, or text file. Gemini extracts structured study chunks and automatically retrieves relevant excerpts into every chat turn.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-stone-50/80 border border-stone-200/80 px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText size={13} className="text-[var(--cobalt)] shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 text-[11px]">
                        {note.title}
                      </p>
                      <p className="text-[10px] font-mono text-stone-500 truncate">
                        {note.course} · {note.chunkCount} chunks · {note.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onAskAboutNote && (
                      <button
                        type="button"
                        onClick={() =>
                          onAskAboutNote(
                            `Summarize the key theorems, formulas, and likely exam traps from my uploaded note "${note.title}".`
                          )
                        }
                        className="flex items-center gap-1 rounded-md bg-white border border-stone-200 hover:border-teal-300 px-2 py-1 text-[10px] font-semibold text-teal-800 transition"
                      >
                        <Sparkles size={10} />
                        <span>Query</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNoteDeleted(note.id)}
                      title="Delete indexed note"
                      className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
