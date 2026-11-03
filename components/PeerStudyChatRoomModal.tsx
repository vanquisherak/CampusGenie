"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
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
} from "lucide-react";

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
}

export function PeerStudyChatRoomModal({
  roomData,
  isOpen,
  onClose,
  onOpenVoiceTutor,
}: PeerStudyChatRoomModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [activePeerTyping, setActivePeerTyping] = useState<string | null>(null);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [challengeAnswered, setChallengeAnswered] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; count: number }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize messages whenever roomData changes
  useEffect(() => {
    if (roomData) {
      setMessages(roomData.initialMessages);
      setChallengeAnswered(null);
      setChallengeFeedback(null);
      setReactions([
        { id: "r1", emoji: "💡", count: 3 },
        { id: "r2", emoji: "🔥", count: 2 },
        { id: "r3", emoji: "🤝", count: 4 },
      ]);
    }
  }, [roomData]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding, activePeerTyping]);

  if (!isOpen || !roomData) return null;

  // Ask CampusGenie helper inside peer room
  async function requestAiAssistant(prompt: string, contextNote?: string) {
    if (!roomData) return;
    setIsAiResponding(true);

    try {
      const peersList = roomData.peers || [];
      const fullPrompt = `You are CampusGenie, participating directly inside a live student peer study room with ${peersList.map((p) => p.name).join(", ")} discussing "${roomData.topic}" in ${roomData.workspace}.
Context: ${contextNote || "A student peer study group is asking for your clarification."}
User Query: "${prompt}"

Provide a concise, highly engaging, pedagogical reply (2-3 paragraphs max) with clear mathematical formulation or architectural logic, addressing both the user and classmates naturally.`;

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullPrompt }),
      });

      let answer = "";
      if (res.ok) {
        const data = await res.json();
        answer = data.answer || "";
      }

      if (!answer) {
        answer = `💡 **CampusGenie Co-Pilot**: Regarding **${roomData.topic}**, here is the core takeaway for the group:\n\n1. **Core Principle**: In ${roomData.workspace}, the main misconception stems from confounding the baseline prior or boundary constraints.\n2. **Group Action**: Work through the numerical breakdown step-by-step. Verify your assumptions against the formal syllabus criteria!`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        senderName: "CampusGenie AI",
        content: answer,
        timestamp: "Just now",
        badge: "AI Co-Pilot",
        highlight: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        senderName: "CampusGenie AI",
        content: `💡 **CampusGenie Co-Pilot**: Great discussion on **${roomData.topic}**! Notice how grounding the calculation with concrete numerical bounds avoids edge-case race conditions. Try the group challenge below to verify!`,
        timestamp: "Just now",
        badge: "AI Co-Pilot",
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsAiResponding(false);
    }
  }

  // Handle User Message Submission
  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!roomData) return;
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      senderName: "You (Scholar)",
      content: text,
      timestamp: "Just now",
      badge: "You",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    const isDirectAiQuestion =
      text.toLowerCase().includes("@campusgenie") ||
      text.toLowerCase().includes("@genie") ||
      text.includes("?");

    // 1. If user tagged @CampusGenie or asked a direct question, trigger AI response
    if (isDirectAiQuestion) {
      setTimeout(() => {
        requestAiAssistant(text, "User directly queried CampusGenie inside peer study room.");
      }, 700);
    } else {
      // 2. Otherwise, simulate an organic peer chiming in!
      const peersList = roomData.peers?.length > 0 ? roomData.peers : [
        { name: "Rohan Sharma", initials: "RS", avatarBg: "bg-blue-600", branch: "CSE", status: "Active" }
      ];
      const randomPeer = peersList[Math.floor(Math.random() * peersList.length)];
      setActivePeerTyping(randomPeer.name);

      setTimeout(() => {
        setActivePeerTyping(null);
        const peerResponses = [
          `That's a really solid point! In our lecture last week, the professor highlighted this exact edge case.`,
          `I agree! When I solved the practice problem, keeping track of the denominator made all the difference.`,
          `Wait, let me double-check that with the formula—yes, that directly eliminates the ambiguity!`,
          `Nice intuition! Let's ask @CampusGenie to give us one more test question to lock this in before MSTs.`,
        ];
        const chosenResponse = peerResponses[Math.floor(Math.random() * peerResponses.length)];

        const peerMsg: ChatMessage = {
          id: `peer-${Date.now()}`,
          sender: "peer",
          senderName: randomPeer.name,
          senderInitials: randomPeer.initials,
          avatarBg: randomPeer.avatarBg,
          content: chosenResponse,
          timestamp: "Just now",
        };
        setMessages((prev) => [...prev, peerMsg]);
      }, 1500);
    }
  }

  // Handle Quick Action Prompts
  function triggerFactCheck() {
    if (!roomData) return;
    requestAiAssistant(
      `Fact-check the recent discussion points in this study room regarding "${roomData.topic}". Identify whether the peers' statements are accurate or contain subtle traps.`,
      "Fact-checking group assertions"
    );
  }

  function triggerChallengeRequest() {
    if (!roomData) return;
    requestAiAssistant(
      `Generate 1 hard exam-style multiple-choice challenge question for our study group on "${roomData.topic}". Include 4 options and provide the full derivation in the answer.`,
      "Generating peer group challenge problem"
    );
  }

  function handleAddReaction(emoji: string) {
    setReactions((prev) =>
      prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
    );
  }

  function copySessionSummary() {
    if (!roomData) return;
    const peerNames = roomData.peers?.map((p) => p.name).join(", ") || "Classmates";
    const summary = `CampusGenie Peer Study Session - ${roomData.title}\nTopic: ${roomData.topic} (${roomData.workspace})\nParticipants: ${peerNames}, You, CampusGenie AI\n\nKey Discussion Excerpts:\n` +
      messages
        .slice(-5)
        .map((m) => `[${m.senderName}]: ${m.content}`)
        .join("\n\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-4xl h-[94vh] max-h-[820px] rounded-3xl bg-white shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-slate-800"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">
                  {roomData.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/80 font-bold hidden sm:inline">
                  {roomData.workspace}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-2">
                <span>Focus: <strong className="text-white">{roomData.topic}</strong></span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Room ({roomData.peers.length + 1} Scholars + AI)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Shared Scratchpad */}
            <button
              onClick={() => setShowScratchpad((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                showScratchpad
                  ? "bg-teal-500 text-slate-950 border-teal-400"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Toggle Shared Whiteboard & Formula Scratchpad"
            >
              <Code size={13} />
              <span className="hidden sm:inline">Scratchpad</span>
              {showScratchpad ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Launch Room Voice Tutor */}
            {onOpenVoiceTutor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVoiceTutor(roomData.topic);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Open Voice Tutor with Room Topic"
              >
                <Mic size={13} />
                <span className="hidden sm:inline">Voice Pod</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Shared Scratchpad / Whiteboard Ribbon */}
        {showScratchpad && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-stone-200 p-4 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono text-[11px] tracking-wider">
                <FileText size={13} className="text-teal-600" />
                Shared Group Scratchpad & Essential Formulas
              </span>
              <button
                onClick={copySessionSummary}
                className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 transition"
              >
                {copiedSummary ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                <span>{copiedSummary ? "Copied!" : "Export Room Notes"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(roomData.keyFormulas || [
                {
                  label: "Fundamental Axiom / Theorem",
                  formula: "P(A|B) = [P(B|A) · P(A)] / P(B)",
                  explanation: "Posterior probability scales with Likelihood times Prior, normalized by Marginal Evidence.",
                },
                {
                  label: "Turnaround Time / Queue Formula",
                  formula: "Turnaround Time = Completion Time - Arrival Time",
                  explanation: "Waiting time = Turnaround Time - Burst Time. Critical for CPU Scheduling exam problems.",
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

        {/* Active Peers Presence Ribbon */}
        <div className="px-4 py-2 bg-stone-50/90 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold shrink-0">
              Cohorts in room:
            </span>
            {roomData.peers.map((peer, idx) => (
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 font-semibold text-[11px] shrink-0">
              <Sparkles size={11} className="text-teal-600" />
              <span>@CampusGenie AI</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">Room Reacts:</span>
            {reactions.map((r) => (
              <button
                key={r.id}
                onClick={() => handleAddReaction(r.emoji)}
                className="px-2 py-0.5 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] flex items-center gap-1 transition"
              >
                <span>{r.emoji}</span>
                <span className="font-mono text-[10px] font-bold text-stone-600">{r.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/40">
          {/* Welcome Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-white to-blue-50/60 border border-teal-200 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="p-1.5 rounded-xl bg-teal-600 text-white mt-0.5 shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                You are live in the {roomData.title} discussion!
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Peers are actively debating questions on <strong>{roomData.topic}</strong>. Mention{" "}
                <span className="font-mono font-bold text-teal-800">@CampusGenie</span> in any message or click the helper chips below for instantaneous conceptual breakdown.
              </p>
            </div>
          </div>

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isAi = msg.sender === "ai";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
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

                {/* Message Body */}
                <div className="space-y-1">
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
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {msg.formulaSnippet && (
                      <div className="mt-2 font-mono text-[11px] p-2 bg-slate-100 text-teal-950 rounded-lg border border-slate-200">
                        {msg.formulaSnippet}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active Peer Typing Indicator */}
          {activePeerTyping && (
            <div className="flex items-center gap-2 text-xs text-stone-500 pl-2 italic animate-pulse">
              <span className="font-bold text-slate-700">{activePeerTyping}</span> is typing a response...
            </div>
          )}

          {/* AI Thinking Indicator */}
          {isAiResponding && (
            <div className="flex items-center gap-2 text-xs text-teal-800 pl-2 font-medium animate-pulse">
              <Sparkles size={13} className="text-teal-600 animate-spin" />
              <span>CampusGenie is analyzing group discussion & formulating response...</span>
            </div>
          )}

          {/* Group Challenge Card in Stream if present */}
          {roomData.groupChallenge && (() => {
            const challenge = roomData.groupChallenge;
            return (
              <div className="my-3 p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 to-white text-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase font-mono text-[11px] tracking-wider">
                    <HelpCircle size={13} className="text-amber-700" />
                    Live Group Challenge for Cohort
                  </span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                    Exam Readiness Drill
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
                        if (i === challenge.correctIndex) {
                          setChallengeFeedback(`🎉 Correct! ${challenge.explanation}`);
                        } else {
                          setChallengeFeedback(`Incorrect. ${challenge.explanation}`);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                        challengeAnswered === i
                          ? i === challenge.correctIndex
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                            : "bg-rose-600 text-white border-rose-700 shadow-xs"
                          : "bg-white hover:bg-stone-50 border-stone-200 text-slate-800"
                      }`}
                    >
                      <span className="font-bold mr-1.5">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>

                {challengeFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in ${
                      challengeFeedback.startsWith("🎉")
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-rose-50 text-rose-900 border border-rose-200"
                    }`}
                  >
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{challengeFeedback}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Helper Prompts Ribbon */}
        <div className="px-4 py-2 bg-stone-100/70 border-t border-stone-200 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-bold shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-teal-600" /> Genie Co-Pilot:
          </span>
          <button
            onClick={triggerFactCheck}
            disabled={isAiResponding}
            className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-stone-200 hover:border-teal-300 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
          >
            🔍 Fact-Check Group Claims
          </button>
          <button
            onClick={triggerChallengeRequest}
            disabled={isAiResponding}
            className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-stone-200 hover:border-teal-300 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
          >
            ⚡ Quiz Us on This
          </button>
          <button
            onClick={() => {
              setInputText("@CampusGenie explain the step-by-step derivation with an analogy");
            }}
            className="px-2.5 py-1 bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 rounded-lg text-[11px] font-medium transition"
          >
            💡 Ask for Analogy
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
            placeholder={`Message ${roomData.peers.map((p) => p.name.split(" ")[0]).join(", ")} or type @CampusGenie...`}
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
