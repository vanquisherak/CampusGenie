"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import {
  Users,
  X,
  Sparkles,
  Send,
  Mic,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Code,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Database,
  LogIn,
} from "lucide-react";
import type { User } from "firebase/auth";
import {
  ensurePeerRoom,
  subscribeToRoomMessages,
  subscribeToRoomPresence,
  sendRoomMessage,
  updateRoomPresence,
  removeRoomPresence,
  type FirestoreRoomPresence,
} from "@/lib/firebase";
import type { StudyNote } from "@/lib/rag/retriever";

export interface RoomPeer {
  name: string;
  initials: string;
  avatarBg: string;
  branch: string;
  status: string;
  isTyping?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "peer" | "ai";
  senderName: string;
  senderUid?: string;
  senderInitials?: string;
  avatarBg?: string;
  content: string;
  timestamp: string;
  badge?: string;
  highlight?: boolean;
  formulaSnippet?: string;
}

export interface PeerChatRoomData {
  id: string;
  title: string;
  workspace: string;
  topic: string;
  peers: RoomPeer[];
  initialMessages: ChatMessage[];
  keyFormulas?: { label: string; formula: string; explanation: string }[];
  groupChallenge?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface PeerStudyChatRoomModalProps {
  roomData: PeerChatRoomData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceTutor?: (topicName: string) => void;
  user?: User | null;
  onSignIn?: () => void;
  notes?: StudyNote[];
  onSaveSummaryNote?: (title: string, course: string, content: string) => Promise<void> | void;
}

function formatIsoTime(iso?: string): string {
  if (!iso) return "Just now";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Just now";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Just now";
  }
}

export function PeerStudyChatRoomModal({
  roomData,
  isOpen,
  onClose,
  onOpenVoiceTutor,
  user,
  onSignIn,
  notes = [],
  onSaveSummaryNote,
}: PeerStudyChatRoomModalProps) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[] | null>(null);
  const [livePresence, setLivePresence] = useState<FirestoreRoomPresence[]>([]);
  const [streamingAiText, setStreamingAiText] = useState("");
  const [inputText, setInputText] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [roomSyncReady, setRoomSyncReady] = useState(false);
  const [roomSyncError, setRoomSyncError] = useState<string | null>(null);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [challengeAnswered, setChallengeAnswered] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isLiveVerified = Boolean(user?.uid && user.emailVerified);
  const displayedMessages =
    isLiveVerified && liveMessages !== null
      ? liveMessages.length > 0
        ? liveMessages
        : localMessages
      : localMessages;

  // Initialize local seed messages and reset transient state when roomData changes
  useEffect(() => {
    if (!roomData) return;
    setLocalMessages(roomData.initialMessages);
    setLiveMessages(null);
    setLivePresence([]);
    setStreamingAiText("");
    setChallengeAnswered(null);
    setChallengeFeedback(null);
    setRoomSyncReady(false);
    setRoomSyncError(null);
  }, [roomData]);

  // Real-time Firestore sync for messages & presence when authenticated and modal open
  useEffect(() => {
    if (!isOpen || !roomData || !isLiveVerified || !user) return;

    let cancelled = false;
    let unsubMessages: (() => void) | null = null;
    let unsubPresence: (() => void) | null = null;

    async function connectRoom() {
      if (!roomData || !user) return;
      try {
        const roomId = await ensurePeerRoom(
          {
            roomId: roomData.id,
            title: roomData.title,
            workspace: roomData.workspace,
            topic: roomData.topic,
          },
          user.uid
        );
        if (cancelled) return;

        await updateRoomPresence(roomId, {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "Scholar",
          status: "Active in room",
        });

        unsubMessages = subscribeToRoomMessages(roomId, (docs) => {
          const mapped: ChatMessage[] = docs.map((d) => {
            const isSelf = d.sender === "user" && d.senderUid === user.uid;
            return {
              id: d.id,
              sender: d.sender === "ai" ? "ai" : isSelf ? "user" : "peer",
              senderUid: d.senderUid,
              senderName: isSelf ? `${d.senderName} (You)` : d.senderName,
              senderInitials: d.senderInitials,
              avatarBg: d.avatarBg,
              content: d.content,
              timestamp: formatIsoTime(d.createdAt),
              badge: d.badge || (d.sender === "ai" ? "AI Co-Pilot" : isSelf ? "You" : "Peer"),
            };
          });
          setLiveMessages(mapped);
        });

        unsubPresence = subscribeToRoomPresence(roomId, (members) => {
          setLivePresence(members);
        });

        setRoomSyncReady(true);
      } catch (err: unknown) {
        if (!cancelled) {
          setRoomSyncError(err instanceof Error ? err.message : "Failed to connect live room");
        }
      }
    }

    void connectRoom();

    return () => {
      cancelled = true;
      unsubMessages?.();
      unsubPresence?.();
      if (roomData && user) {
        void removeRoomPresence(roomData.id, user.uid);
      }
    };
  }, [isOpen, roomData, isLiveVerified, user]);

  // Auto-scroll on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages, streamingAiText, isAiResponding]);

  if (!isOpen || !roomData) return null;

  // Stream CampusGenie AI Co-Pilot response grounded in room transcript & uploaded PDF notes
  async function requestAiAssistant(prompt: string, contextNote?: string) {
    if (!roomData) return;
    setIsAiResponding(true);
    setStreamingAiText("");

    try {
      const history = displayedMessages.slice(-8).map((m) => ({
        role: m.sender === "ai" ? ("model" as const) : ("user" as const),
        text: `[${m.senderName}]: ${m.content}`,
      }));

      const res = await fetch("/api/assistant/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history,
          notes,
          roomContext: `${roomData.title} | Topic: ${roomData.topic} | Workspace: ${roomData.workspace} | ${contextNote || "Collaborative study group"}`,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Stream failed (HTTP ${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (const frame of frames) {
          const lines = frame.split("\n");
          let eventType = "message";
          let dataRaw = "";
          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
          }
          if (!dataRaw) continue;
          const payload = JSON.parse(dataRaw);
          if (eventType === "token" && payload.delta) {
            accumulated += payload.delta;
            setStreamingAiText(accumulated);
          } else if (eventType === "error") {
            throw new Error(payload.error || "Gemini streaming error");
          }
        }
      }

      const finalAnswer = accumulated.trim();
      if (!finalAnswer) {
        throw new Error("CampusGenie returned an empty stream.");
      }

      if (isLiveVerified && user && roomSyncReady) {
        await sendRoomMessage(roomData.id, user.uid, {
          sender: "ai",
          senderName: "CampusGenie AI",
          senderInitials: "CG",
          avatarBg: "bg-slate-900",
          content: finalAnswer,
          badge: "AI Co-Pilot",
        });
      } else {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            senderName: "CampusGenie AI",
            content: finalAnswer,
            timestamp: "Just now",
            badge: "AI Co-Pilot",
            highlight: true,
          },
        ]);
      }
    } catch (err: unknown) {
      const errText =
        err instanceof Error
          ? `CampusGenie Co-Pilot error: ${err.message}`
          : "CampusGenie Co-Pilot could not respond right now.";
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          senderName: "CampusGenie AI",
          content: errText,
          timestamp: "Just now",
          badge: "Error",
        },
      ]);
    } finally {
      setStreamingAiText("");
      setIsAiResponding(false);
    }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!roomData) return;
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    const displayName = user?.displayName || user?.email?.split("@")[0] || "You (Scholar)";
    const initials =
      displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || "")
        .join("") || "SC";

    if (isLiveVerified && user && roomSyncReady) {
      await sendRoomMessage(roomData.id, user.uid, {
        sender: "user",
        senderName: displayName,
        senderInitials: initials,
        avatarBg: "bg-slate-900",
        content: text,
        badge: "Scholar",
      });
    } else {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: "user",
          senderName: "You (Scholar)",
          content: text,
          timestamp: "Just now",
          badge: "Local Draft",
        },
      ]);
    }

    const asksAi =
      text.toLowerCase().includes("@campusgenie") ||
      text.toLowerCase().includes("@genie");

    if (asksAi) {
      await requestAiAssistant(text, "Participant explicitly mentioned @CampusGenie in the room.");
    }
  }

  function triggerFactCheck() {
    if (!roomData) return;
    void requestAiAssistant(
      `Fact-check the recent discussion points in this study room regarding "${roomData.topic}". Highlight any subtle traps or missing assumptions.`,
      "Fact-checking group claims"
    );
  }

  function triggerChallengeRequest() {
    if (!roomData) return;
    void requestAiAssistant(
      `Generate 1 challenging exam-style question on "${roomData.topic}" for our study room, including 4 options and a concise hint (wait before spoiling the derivation unless requested).`,
      "Generating group challenge question"
    );
  }

  function copySessionSummary() {
    if (!roomData) return;
    const summary =
      `CampusGenie Peer Study Session - ${roomData.title}\nTopic: ${roomData.topic} (${roomData.workspace})\n\nKey Discussion Excerpts:\n` +
      displayedMessages
        .slice(-8)
        .map((m) => `[${m.senderName}]: ${m.content}`)
        .join("\n\n");

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  }

  async function handleSaveSummaryNote() {
    if (!roomData || !onSaveSummaryNote) return;
    const summaryBody = displayedMessages
      .slice(-10)
      .map((m) => `### ${m.senderName} (${m.timestamp})\n${m.content}`)
      .join("\n\n");
    await onSaveSummaryNote(
      `Room Takeaways: ${roomData.title}`,
      roomData.workspace,
      `# ${roomData.title}\nTopic: ${roomData.topic}\n\n${summaryBody}`
    );
    setSavedToNotes(true);
    setTimeout(() => setSavedToNotes(false), 3000);
  }

  const activeParticipantCount =
    livePresence.length > 0 ? livePresence.length : roomData.peers.length + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-4xl h-[94vh] max-h-[820px] rounded-3xl bg-white shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-slate-800"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <span
                className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
                  roomSyncReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-white truncate max-w-[260px] sm:max-w-md">
                  {roomData.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800/80 font-bold hidden sm:inline">
                  {roomData.workspace}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-2 truncate">
                <span className="truncate">
                  Focus: <strong className="text-white">{roomData.topic}</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span
                  className={`flex items-center gap-1 font-mono text-[10px] ${
                    roomSyncReady ? "text-emerald-400" : "text-amber-300"
                  }`}
                >
                  <Database size={10} />
                  {roomSyncReady
                    ? `Firestore Live (${activeParticipantCount} active)`
                    : "Sign in for Live Sync"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowScratchpad((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                showScratchpad
                  ? "bg-teal-500 text-slate-950 border-teal-400"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <Code size={13} />
              <span className="hidden sm:inline">Scratchpad</span>
              {showScratchpad ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {onOpenVoiceTutor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVoiceTutor(roomData.topic);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Mic size={13} />
                <span className="hidden sm:inline">Voice Pod</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Shared Scratchpad Ribbon */}
        {showScratchpad && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-slate-50 border-b border-stone-200 p-4 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono text-[11px] tracking-wider">
                <FileText size={13} className="text-teal-600" />
                Shared Reference & Takeaways
              </span>
              <div className="flex items-center gap-2">
                {onSaveSummaryNote && (
                  <button
                    onClick={handleSaveSummaryNote}
                    className="text-[11px] font-semibold text-white bg-slate-900 hover:bg-[var(--cobalt)] flex items-center gap-1 px-2.5 py-1 rounded-lg transition"
                  >
                    <BookmarkPlus size={11} />
                    <span>{savedToNotes ? "Saved to Notes RAG!" : "Save Summary to Notes"}</span>
                  </button>
                )}
                <button
                  onClick={copySessionSummary}
                  className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 transition"
                >
                  {copiedSummary ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedSummary ? "Copied!" : "Copy Summary"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(roomData.keyFormulas || [
                {
                  label: "Fundamental Bayes Expansion",
                  formula: "P(A|B) = [P(B|A) · P(A)] / P(B)",
                  explanation: "Posterior scales with Likelihood times Prior normalized by Marginal Evidence.",
                },
              ]).map((f, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                  <div className="font-bold text-slate-900 text-xs">{f.label}</div>
                  <div className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                    {f.formula}
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug">{f.explanation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Live Presence Ribbon */}
        <div className="px-4 py-2 bg-stone-50/90 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold shrink-0">
              {livePresence.length > 0 ? "Live in Firestore Room:" : "Room Context:"}
            </span>

            {livePresence.length > 0
              ? livePresence.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-stone-200 shadow-2xs shrink-0"
                  >
                    <div className="h-4 w-4 rounded-full bg-[var(--cobalt)] text-white flex items-center justify-center font-bold text-[9px]">
                      {member.initials}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">
                      {member.displayName}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ))
              : roomData.peers.map((peer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-stone-200 shadow-2xs shrink-0"
                  >
                    <div
                      className={`h-4 w-4 rounded-full ${peer.avatarBg} text-white flex items-center justify-center font-bold text-[9px]`}
                    >
                      {peer.initials}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">{peer.name}</span>
                  </div>
                ))}

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 font-semibold text-[11px] shrink-0">
              <Sparkles size={11} className="text-teal-600" />
              <span>@CampusGenie AI</span>
            </div>
          </div>

          {!isLiveVerified && onSignIn && (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--cobalt)] text-white text-[11px] font-semibold hover:opacity-90 transition"
            >
              <LogIn size={11} />
              <span>Sign In to Sync Live</span>
            </button>
          )}
        </div>

        {roomSyncError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900">
            Live Firestore sync notice: {roomSyncError}
          </div>
        )}

        {/* Main Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/40">
          {displayedMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const isAi = msg.sender === "ai";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
              >
                {!isUser && (
                  <div className="shrink-0 mt-0.5">
                    {isAi ? (
                      <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-400 shadow-xs">
                        <Sparkles size={14} className="text-teal-400" />
                      </div>
                    ) : (
                      <div
                        className={`h-8 w-8 rounded-xl ${msg.avatarBg || "bg-blue-600"} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                      >
                        {msg.senderInitials || msg.senderName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center gap-2 text-[11px] ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="font-bold text-slate-900">{msg.senderName}</span>
                    {msg.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          isAi
                            ? "bg-teal-100 text-teal-900 border border-teal-300"
                            : isUser
                            ? "bg-slate-200 text-slate-800"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {msg.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400 font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-xs shadow-xs"
                        : isAi
                        ? "bg-gradient-to-br from-white to-teal-50/40 text-slate-800 border-2 border-teal-300 rounded-tl-xs shadow-xs"
                        : "bg-white text-slate-800 border border-stone-200/90 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none text-inherit prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live Streaming AI Bubble */}
          {isAiResponding && (
            <div className="flex gap-3 max-w-[88%]">
              <div className="shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-400 shadow-xs">
                  <Sparkles size={14} className="text-teal-400 animate-spin" />
                </div>
              </div>
              <div className="rounded-2xl p-3.5 text-xs leading-relaxed bg-gradient-to-br from-white to-teal-50/40 text-slate-800 border-2 border-teal-300 rounded-tl-xs shadow-xs">
                {streamingAiText ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1">
                    <Markdown>{streamingAiText}</Markdown>
                  </div>
                ) : (
                  <span className="text-teal-800 font-medium animate-pulse">
                    CampusGenie is streaming a grounded response...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Optional Group Challenge Drill */}
          {roomData.groupChallenge && (() => {
            const challenge = roomData.groupChallenge;
            return (
              <div className="my-3 p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 to-white text-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase font-mono text-[11px] tracking-wider">
                    <HelpCircle size={13} className="text-amber-700" />
                    Cohort Concept Check
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                  {challenge.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {challenge.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChallengeAnswered(i);
                        setChallengeFeedback(
                          i === challenge.correctIndex
                            ? `Correct! ${challenge.explanation}`
                            : `Incorrect. ${challenge.explanation}`
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                        challengeAnswered === i
                          ? i === challenge.correctIndex
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                            : "bg-rose-600 text-white border-rose-700 shadow-xs"
                          : "bg-white hover:bg-stone-50 border-stone-200 text-slate-800"
                      }`}
                    >
                      <span className="font-bold mr-1.5">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
                {challengeFeedback && (
                  <div className="p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 bg-white border border-stone-200 text-slate-800">
                    <CheckCircle2 size={13} className="shrink-0 text-teal-600" />
                    <span>{challengeFeedback}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div ref={messagesEndRef} />
        </div>

        {/* Genie Co-Pilot Quick Actions */}
        <div className="px-4 py-2 bg-stone-100/70 border-t border-stone-200 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-bold shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-teal-600" /> Genie Co-Pilot:
          </span>
          <button
            onClick={triggerFactCheck}
            disabled={isAiResponding}
            className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-stone-200 hover:border-teal-300 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
          >
            Fact-Check Claims
          </button>
          <button
            onClick={triggerChallengeRequest}
            disabled={isAiResponding}
            className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-stone-200 hover:border-teal-300 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
          >
            Quiz Us on This
          </button>
          <button
            onClick={() =>
              void requestAiAssistant(
                `Explain "${roomData.topic}" step-by-step using a clear real-world analogy and equations.`
              )
            }
            disabled={isAiResponding}
            className="px-2.5 py-1 bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
          >
            Ask for Analogy
          </button>
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isLiveVerified
                ? "Message the live Firestore room or mention @CampusGenie..."
                : "Message the room (local preview) or mention @CampusGenie..."
            }
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 placeholder:text-stone-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
