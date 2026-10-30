"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Database,
  Dna,
  ExternalLink,
  FlaskConical,
  Globe,
  Library,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  Network,
  Sparkles,
  Target,
  Users,
  X,
  GraduationCap,
} from "lucide-react";
import { motion } from "motion/react";
import {
  demoEvidence,
  demoLearner,
  demoTermOutcomes,
} from "@/lib/demo-data";
import { curriculumGraph } from "@/lib/graph/curriculum";
import { AcademicWorkspaces, type Workspace } from "@/components/AcademicWorkspaces";
import { VoiceTutorModal } from "@/components/VoiceTutorModal";
import { InteractiveLearningGraph } from "@/components/InteractiveLearningGraph";
import { FuturisticOmniSearch } from "@/components/FuturisticOmniSearch";
import { FuturisticCommandDeck } from "@/components/FuturisticCommandDeck";
import { PeerStudyStatusSidebar } from "@/components/PeerStudyStatusSidebar";
import { auth, signInWithGoogle, logOut, testConnection } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { Evidence } from "@/lib/rag/contracts";
import type { LearningState } from "@/lib/curriculum/types";

const navigation = [
  { label: "Overview", icon: Compass },
  { label: "CUIMS Student Hub", icon: GraduationCap },
  { label: "Study Studio", icon: BookOpen },
  { label: "Quiz Lab", icon: CircleHelp },
  { label: "Project Radar", icon: FlaskConical },
  { label: "Bioscience Studio", icon: Dna },
  { label: "Institutional Tools", icon: Library },
];

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
  color: string;
  details?: string;
};

const initialActivity: ActivityItem[] = [
  { id: "act-1", title: "Bayesian inference diagnostic", meta: "12 min ago", status: "3/5 correct", color: "bg-[var(--coral)]", details: "Tested prior vs likelihood distinction. Flagged base-rate fallacy." },
  { id: "act-2", title: "Regularization study note", meta: "Yesterday", status: "Mastery +8%", color: "bg-[var(--cobalt)]", details: "Analyzed L1 Lasso sparsity vs L2 Ridge weight shrinkage." },
  { id: "act-3", title: "Library guide connected", meta: "Oct 27", status: "12 sources", color: "bg-[var(--mint)]", details: "Retrieved 12 peer-reviewed IEEE citations via MCP gateway." },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [assistantReply, setAssistantReply] = useState("");
  const [agentTrace, setAgentTrace] = useState<string[]>([]);
  const [assistantConfidence, setAssistantConfidence] = useState<number | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // Firebase Auth & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Gemini Live Voice Tutor
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Peer Study Status Sidebar
  const [peerSidebarOpen, setPeerSidebarOpen] = useState(false);

  // Google Search Grounding with gemini-3.8-flash
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [groundedCitations, setGroundedCitations] = useState<{ title: string; uri: string }[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    testConnection().then((connected) => {
      setDbConnected(connected);
    });
    return () => unsub();
  }, []);

  async function handleGoogleSignIn() {
    setAuthLoading(true);
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await logOut();
      setUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }

  // Dynamic Learner State
  const [learner, setLearner] = useState<LearningState>(demoLearner);
  const [misconceptionAlert, setMisconceptionAlert] = useState<string>(
    "One misconception detected: prior probability vs likelihood."
  );
  const [activityList, setActivityList] = useState<ActivityItem[]>(initialActivity);

  // Modals
  const [showOutcomesModal, setShowOutcomesModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showLearnerSignalModal, setShowLearnerSignalModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Dynamic Search Recommendations for Prompt Console
  const promptSuggestions = useMemo(() => {
    const text = message.toLowerCase().trim();
    if (!text) {
      return [
        { label: "Bayes Prior vs Likelihood", prompt: "Explain with a concrete numerical example why ignoring the prior leads to the base-rate fallacy in Bayesian inference." },
        { label: "L1 vs L2 Regularization", prompt: "Compare L1 Lasso and L2 Ridge regularization with contour diagrams and weight sparsity math." },
        { label: "CUIMS 75% Safe-Bunks", prompt: "Calculate how many safe bunks I have for 21CSH-308 DAA and suggest a 2-week attendance recovery schedule." },
        { label: "Backpropagation Equations", prompt: "Derive the backpropagation chain rule gradient step for cross-entropy loss in a multi-layer perceptron." },
      ];
    }
    if (text.includes("bayes") || text.includes("prior") || text.includes("prob")) {
      return [
        { label: "Disease Testing Problem", prompt: "Solve step-by-step: P(Disease)=0.01, Sensitivity=0.95, False Pos=0.05. Find P(Disease|Positive)." },
        { label: "Conjugate Priors", prompt: "Derive the posterior distribution for a Beta prior and Binomial likelihood step-by-step." },
        { label: "Bayes Micro-Quiz", prompt: "Test my understanding of Bayesian inference with 3 quick diagnostic questions." },
      ];
    }
    if (text.includes("reg") || text.includes("lasso") || text.includes("ridge") || text.includes("overfit")) {
      return [
        { label: "L1 Sparsity Geometry", prompt: "Why does L1 norm have sharp corners that hit zero weights while L2 only shrinks them asymptotically?" },
        { label: "ElasticNet Penalty", prompt: "When should I combine L1 and L2 penalties using ElasticNet in high-dimensional feature spaces?" },
      ];
    }
    if (text.includes("attend") || text.includes("bunk") || text.includes("cuims") || text.includes("mst")) {
      return [
        { label: "CUIMS 75% Recovery Formula", prompt: "Explain the official CUIMS 75% formula C = 3D - 4A and calculate my exact recovery requirements." },
        { label: "MST-2 Exam Strategy", prompt: "Generate a 5-day study blueprint to score 18+/20 in upcoming MST-2 exams for Computer Science." },
      ];
    }
    if (text.includes("algo") || text.includes("dp") || text.includes("graph")) {
      return [
        { label: "Bellman-Ford Negative Cycles", prompt: "Derive Bellman-Ford shortest paths algorithm and prove why |V|-1 iterations suffice." },
        { label: "Dynamic Programming DAGs", prompt: "Walk me through DAG longest path state formulation with topological sorting." },
      ];
    }
    return [
      { label: `Deep Dive on "${text.slice(0, 22)}..."`, prompt: `Explain ${text} with intuitive real-world analogies, step-by-step math derivations, and exam rubrics.` },
      { label: "Generate Study Blueprint", prompt: `Create a 5-stage learning blueprint for ${text} with micro-steps and recommended video lectures.` },
    ];
  }, [message]);

  const workspaceTarget: Workspace =
    activeNav === "Project Radar"
      ? "Project Explorer"
      : activeNav === "Study Studio"
      ? "Study Planner"
      : activeNav === "Bioscience Studio"
      ? "Bioscience Studio"
      : activeNav === "CUIMS Student Hub"
      ? "CUIMS Student Hub"
      : (activeNav as Workspace);

  function selectNavigation(label: string) {
    setActiveNav(label);
    setSidebarOpen(false);
    window.requestAnimationFrame(() =>
      document.getElementById("workspaces")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function handleLogActivity(title: string, meta: string, status: string, color: string) {
    const newItem: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      meta,
      status,
      color,
      details: "Recorded from active workspace session.",
    };
    setActivityList((prev) => [newItem, ...prev]);
  }

  function handleMasteryChange(topicId: string, gain: number) {
    setLearner((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.topicId === topicId
          ? {
              ...t,
              mastery: Math.min(100, t.mastery + gain),
              band: t.mastery + gain >= 80 ? "ready" : "developing",
            }
          : t
      ),
    }));
  }

  function handleMisconceptionResolved() {
    setLearner((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.topicId === "stats-bayes" ? { ...t, misconception: undefined } : t
      ),
    }));
    setMisconceptionAlert("Misconception resolved: Prior probability vs Likelihood verified.");
  }

  function executePrompt(promptText: string) {
    if (!promptText.trim()) return;
    setMessage(promptText);
    setSent(true);
    setIsAsking(true);
    setAssistantReply("");
    setAgentTrace([]);
    setAssistantConfidence(null);
    setGroundedCitations([]);
    setSearchQueries([]);

    // Automatically redirect/scroll to Ask CampusGenie where results are displayed
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (useSearchGrounding) {
      void fetch("/api/grounded-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: promptText, topic: learner.topics[0]?.topic }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Grounded search failed");
          setAssistantReply(result.answer || "No synthesis available.");
          setGroundedCitations(result.citations || []);
          setSearchQueries(result.searchQueries || []);
          setAgentTrace(["google-search-grounding", "gemini-3.8-flash"]);
          setAssistantConfidence(0.96);
        })
        .catch((error: Error) => {
          setAssistantReply(`Google Search Grounding error: ${error.message}`);
        })
        .finally(() => setIsAsking(false));
      return;
    }

    void fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: promptText, learner }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(result.error ?? `Assistant request failed with HTTP ${response.status}`);
        return result as {
          answer?: string;
          agentsUsed?: string[];
          confidence?: number;
          provider?: string;
          providerMessage?: string;
        };
      })
      .then((result) => {
        setAssistantReply(result.answer ?? "Your request was processed by CampusGenie.");
        setAgentTrace(result.agentsUsed ?? []);
        setAssistantConfidence(result.confidence ?? null);
        if (result.providerMessage)
          setAssistantReply((current) => `${current}\n\n${result.providerMessage}`);
      })
      .catch((error: Error) =>
        setAssistantReply(`CampusGenie could not complete the request: ${error.message}`)
      )
      .finally(() => setIsAsking(false));
  }

  function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    executePrompt(message);
    setMessage("");
  }

  // Calculate overall term progress
  const bayesTopic = learner.topics.find((t) => t.topicId === "stats-bayes");
  const currentBayesMastery = bayesTopic?.mastery ?? 61;
  const overallMastery = Math.round(
    learner.topics.reduce((acc, t) => acc + t.mastery, 0) / learner.topics.length
  );

  return (
    <main className="min-h-screen lg:flex">
      <div className="noise" />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[280px] overflow-y-auto border-r border-[var(--line)] bg-[var(--paper)] px-6 py-7 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-[var(--paper)] shadow-xs ring-1 ring-black/5">
              <Network size={18} />
            </div>
            <div>
              <span className="font-display text-xl font-medium tracking-tight text-[var(--ink)]">
                CampusGenie
              </span>
            </div>
          </div>
          <button
            aria-label="Close navigation"
            className="lg:hidden text-slate-500 hover:text-slate-900 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-12">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
            Academic Workspaces
          </p>
          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => {
              const active = activeNav === label;
              return (
                <button
                  key={label}
                  onClick={() => selectNavigation(label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-200 ${
                    active
                      ? "bg-slate-900 text-white font-medium shadow-xs"
                      : "text-slate-600 hover:bg-black/[0.035] hover:text-slate-900"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.7} className={active ? "text-teal-400" : "text-slate-400"} />
                  <span className="truncate">{label}</span>
                  {label === "Institutional Tools" && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Term Progress Card (Interactive Modal Trigger) */}
        <div
          onClick={() => setShowOutcomesModal(true)}
          className="mt-10 cursor-pointer rounded-2xl bg-white/80 border border-stone-200/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:border-stone-300"
          role="button"
          tabIndex={0}
          aria-label="View term outcomes breakdown"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 font-medium">
              Term Mastery
            </span>
            <Target size={14} className="text-[var(--cobalt)]" />
          </div>
          <div className="mb-2.5 flex items-end justify-between">
            <span className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">
              {overallMastery}%
            </span>
            <span className="text-xs text-stone-500">4 of 6 outcomes</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--cobalt)] to-teal-500 transition-all duration-500"
              style={{ width: `${overallMastery}%` }}
            />
          </div>
          <p className="mt-3.5 text-xs text-stone-500 flex items-center justify-between font-medium">
            <span>Inspect outcomes</span>
            <ChevronRight size={13} className="text-[var(--cobalt)]" />
          </p>
        </div>

        {/* CUIMS Attendance Radar Card */}
        <div
          onClick={() => selectNavigation("CUIMS Student Hub")}
          className="mt-3 cursor-pointer rounded-2xl bg-white/80 border border-stone-200/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:border-red-300"
          role="button"
          tabIndex={0}
          aria-label="View CUIMS student portal details"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-600 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              CUIMS Radar
            </span>
            <GraduationCap size={14} className="text-red-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-slate-900">83.4%</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              75% Safe
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>2 bunks available</span>
            <ChevronRight size={12} className="text-stone-400" />
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-8 relative">
        {/* Subtle atmospheric ambient glow in hero */}
        <div className="pointer-events-none absolute -top-16 right-10 w-[550px] h-[550px] bg-gradient-to-bl from-teal-500/[0.04] via-blue-500/[0.03] to-transparent rounded-full blur-3xl" />

        <header className="sticky top-0 z-20 backdrop-blur-md bg-[var(--paper)]/85 border-b border-[var(--line)]/50 py-3.5 mb-8 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 flex items-center justify-between gap-4 transition-all">
          <button
            aria-label="Open navigation"
            className="lg:hidden text-slate-700 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden items-center gap-2 text-xs text-stone-500 sm:flex font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Atlas workspace</span>
            <span className="text-stone-300">/</span>
            <span className="text-slate-900 font-semibold">{activeNav}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Peer Study Status Sidebar Trigger */}
            <button
              onClick={() => setPeerSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold border border-stone-200 shadow-2xs transition hover:border-teal-400 group"
              title="Open Peer Study Status & Classmate Availability"
            >
              <Users size={13} className="text-teal-600 group-hover:scale-110 transition" />
              <span className="hidden md:inline">Peer Study</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </button>

            {/* Live Voice Tutor Button */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs ring-1 ring-white/10"
              title="Launch Gemini Live Voice Tutor"
            >
              <Mic size={13} className="text-teal-400" />
              <span className="hidden sm:inline">Voice Tutor</span>
              <span className="text-[10px] text-teal-300 font-mono px-1 rounded bg-teal-950/80">Live</span>
            </button>

            {/* Firebase Auth & Profile State */}
            {user ? (
              <div className="flex items-center gap-2 bg-white/80 border border-stone-200/80 rounded-full pl-2 pr-3 py-1 shadow-xs">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[var(--cobalt)] text-white text-[10px] font-bold grid place-items-center">
                    {user.displayName?.[0] || user.email?.[0] || "U"}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold max-w-[100px] truncate leading-tight text-slate-800">
                    {user.displayName || "Scholar"}
                  </span>
                  <span className={`text-[9px] font-mono flex items-center gap-1 leading-tight ${dbConnected ? "text-emerald-700 font-medium" : "text-amber-700"}`}>
                    <Database size={8} /> {dbConnected ? "Firestore Synced" : "Local Mode"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out of Firebase"
                  className="ml-1 text-slate-400 hover:text-slate-700 transition"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-slate-700 text-xs font-semibold hover:bg-stone-50 transition shadow-xs disabled:opacity-50"
              >
                <LogIn size={13} className="text-[var(--cobalt)]" />
                <span>{authLoading ? "Signing in..." : "Google Sign-In"}</span>
              </button>
            )}

            <div
              onClick={() => setShowLearnerSignalModal(true)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[var(--coral)] font-display text-xs text-white cursor-pointer hover:opacity-90 shrink-0 ring-2 ring-white shadow-xs"
              title="Aria Sharma - Student Profile"
            >
              AS
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px]">
          {/* Futuristic Omni-Search with Real-Time AI Recommendations HUD */}
          <div className="mt-6 mb-2">
            <FuturisticOmniSearch
              onSelectPrompt={(p) => executePrompt(p)}
              onNavigateWorkspace={(ws) => selectNavigation(ws)}
              onOpenVoiceTutor={() => setVoiceModalOpen(true)}
            />
          </div>

          {/* Hero Section */}
          <div className="reveal mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--cobalt)] font-semibold">
                Active Study Mission · Term 04
              </p>
              <h1
                className="max-w-[680px] font-display text-5xl leading-[1.02] tracking-[-0.035em] sm:text-6xl text-[var(--ink)]"
                style={{ textWrap: "balance" }}
              >
                Make the difficult
                <br />
                <em className="font-normal italic text-[var(--coral)]">part</em> visible.
              </h1>
            </div>
            <div className="max-w-[280px] text-xs leading-5 text-stone-500">
              CampusGenie shapes your learning path by what you understand, grounded directly in verified curriculum evidence.
            </div>
          </div>

          {/* Interactive Mission Control Command Deck */}
          <FuturisticCommandDeck
            onSelectPortal={(portalId) => {
              if (portalId === "portal-ask") {
                document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "center" });
              } else if (portalId === "portal-quiz") {
                selectNavigation("Quiz Lab");
              } else if (portalId === "portal-cuims") {
                selectNavigation("CUIMS Student Hub");
              } else if (portalId === "portal-voice") {
                setVoiceModalOpen(true);
              }
            }}
          />

          {/* Study Mission & Learner Signal Cards */}
          <div className="mt-10 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            {/* Current Study Mission Card */}
            <section className="reveal delay-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#101722] via-[#141f2d] to-[#0d141e] p-7 text-white sm:p-9 shadow-lg border border-white/[0.08] relative">
              <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl" />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--mint)] font-semibold">
                    Current Study Mission
                  </p>
                  <h2 className="mt-4 max-w-[460px] font-display text-3xl leading-tight sm:text-4xl font-normal">
                    Untangle Bayesian inference before Friday.
                  </h2>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Sparkles className="text-[var(--coral)]" size={18} />
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-between gap-6 border-t border-white/10 pt-5 sm:flex-row sm:items-end relative z-10">
                <div>
                  <p className="text-xs text-white/50 font-medium">Recommended because</p>
                  <p className="mt-1 text-sm text-white/90">
                    {bayesTopic?.misconception
                      ? "Active misconception: Prior probability vs Likelihood."
                      : "Diagnostic verified! Ready to compare with Regularization."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    executePrompt(
                      "Run an adaptive diagnostic review on Bayesian inference: evaluate my active misconception regarding prior probability versus likelihood, show the calculation, and recommend concrete next steps."
                    );
                  }}
                  className="flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-stone-100 shadow-sm"
                >
                  Start diagnostic & review <ArrowUpRight size={15} />
                </button>
              </div>
            </section>

            {/* Learner Signal Card (Interactive Modal Trigger) */}
            <section
              onClick={() => setShowLearnerSignalModal(true)}
              className="reveal delay-2 cursor-pointer rounded-2xl border border-stone-200/80 bg-white/80 backdrop-blur-md p-7 sm:p-9 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:border-stone-300"
              role="button"
              tabIndex={0}
              aria-label="View learner signals breakdown"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                  Learner Signal
                </p>
                <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--cobalt)]">
                  <BrainCircuit size={17} />
                </div>
              </div>
              <div className="mt-6 flex items-end gap-3">
                <span className="font-display text-6xl tracking-tight text-[var(--ink)]">
                  {currentBayesMastery}
                </span>
                <span className="mb-2 text-xs text-stone-500 leading-tight">
                  / 100
                  <br />
                  Bayes mastery
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--coral)] to-rose-600 transition-all duration-500"
                  style={{ width: `${currentBayesMastery}%` }}
                />
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-stone-600">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    bayesTopic?.misconception ? "bg-[var(--coral)]" : "bg-emerald-500"
                  }`}
                />
                <span className="line-clamp-2">{misconceptionAlert}</span>
              </div>
            </section>
          </div>

          {/* Learning Graph & Ask CampusGenie Grid */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* The Learning Graph Column */}
            <section className="reveal delay-2">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                    The Learning Graph
                  </p>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
                    Curriculum Dependencies
                  </h2>
                </div>
                <button
                  onClick={() => setShowGraphModal(true)}
                  className="text-xs font-semibold text-[var(--cobalt)] hover:underline flex items-center gap-1 transition"
                >
                  View hierarchy <ArrowUpRight size={14} />
                </button>
              </div>

              <InteractiveLearningGraph
                learner={learner}
                onSelectTopicPrompt={(prompt) => executePrompt(prompt)}
                onStartQuizTopic={() => {
                  selectNavigation("Quiz Lab");
                }}
                onOpenVoiceTutor={() => {
                  setVoiceModalOpen(true);
                }}
              />
            </section>

            {/* Ask CampusGenie Column */}
            <section id="ask-campusgenie" className="reveal delay-3 scroll-mt-8 flex flex-col justify-between">
              <div>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                      Ask CampusGenie
                    </p>
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
                      What are you working through?
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Gemini 3.8 Flash
                    </span>
                  </div>
                </div>

                {/* Mode Selection Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 ${
                      useSearchGrounding
                        ? "bg-teal-50 text-teal-900 border-teal-300 font-semibold shadow-xs"
                        : "bg-white/80 text-stone-600 border-stone-200 hover:bg-white hover:text-stone-900"
                    }`}
                  >
                    <Globe size={13} className={useSearchGrounding ? "text-teal-600" : "text-stone-400"} />
                    <span>Google Search Grounding (Live Citations)</span>
                    {useSearchGrounding && <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceModalOpen(true)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-700 transition flex items-center gap-1.5 border border-stone-200 shadow-xs"
                  >
                    <Mic size={13} className="text-teal-600" />
                    <span>Voice Tutor Mode</span>
                  </button>
                </div>

                {/* Studio Prompt Card */}
                <form
                  onSubmit={submitPrompt}
                  className="relative rounded-2xl border border-stone-200/90 bg-white/80 backdrop-blur-md transition-all duration-200 focus-within:border-[var(--cobalt)] focus-within:ring-2 focus-within:ring-[var(--cobalt)]/15 shadow-xs"
                >
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      useSearchGrounding
                        ? "Search recent academic research, syllabus updates, or peer-reviewed literature..."
                        : "e.g. Show me why the prior matters in this Bayesian inference problem..."
                    }
                    className="h-32 w-full resize-none rounded-2xl bg-transparent p-4 sm:p-5 text-sm leading-6 outline-none transition placeholder:text-stone-400"
                  />
                  <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5">
                    <span className="font-mono text-[10px] text-stone-400 hidden sm:inline">
                      Curriculum Evidence Grounded
                    </span>
                    <button
                      aria-label="Send question"
                      disabled={isAsking || !message.trim()}
                      className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-[var(--cobalt)] disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
                    >
                      {isAsking ? (
                        <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                      ) : (
                        <ArrowUpRight size={15} />
                      )}
                    </button>
                  </div>
                </form>

                {/* Dynamic AI Prompt Recommendations Bar */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-stone-400 font-semibold flex items-center gap-1">
                    <Sparkles size={11} className="text-teal-600" />
                    <span>Recommended based on search:</span>
                  </span>
                  {promptSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executePrompt(sug.prompt)}
                      className="group flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-teal-800 bg-white/70 hover:bg-teal-50/80 border border-stone-200/80 hover:border-teal-300 rounded-lg px-2.5 py-1 transition-all duration-150 shadow-2xs"
                    >
                      <span>{sug.label}</span>
                      <ArrowRight size={10} className="text-stone-400 group-hover:text-teal-600 transition" />
                    </button>
                  ))}
                </div>

                {isAsking && (
                  <div className="mt-3 text-xs text-[var(--cobalt)] animate-pulse flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cobalt)] animate-ping" />
                    <span>
                      {useSearchGrounding
                        ? "Grounding query against live Google Search results with gemini-3.8-flash..."
                        : "CampusGenie is mapping your question to curriculum evidence with Gemini..."}
                    </span>
                  </div>
                )}

                {sent && !isAsking && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Check size={14} /> Processed through {useSearchGrounding ? "grounded search pipeline" : "curriculum agent pipeline"}.
                  </div>
                )}

                {/* Assistant Output Container */}
                {/* Assistant Output Container */}
                {assistantReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 whitespace-pre-line rounded-2xl bg-white/95 backdrop-blur-md p-5 sm:p-6 text-sm leading-relaxed border border-teal-500/30 shadow-[0_4px_25px_-5px_rgba(20,184,166,0.15)] transition-all"
                  >
                    <div className="prose prose-stone max-w-none text-slate-800 text-[13px] sm:text-sm">
                      {assistantReply}
                    </div>

                    {/* Grounded Web Citations */}
                    {groundedCitations.length > 0 && (
                      <div className="mt-4 border-t border-stone-100 pt-3.5 space-y-2">
                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Globe size={13} className="text-teal-600" />
                          Live Grounded Citations ({groundedCitations.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groundedCitations.map((citation, idx) => (
                            <a
                              key={idx}
                              href={citation.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-stone-50 hover:bg-teal-50 border border-stone-200 hover:border-teal-300 rounded-lg text-[11px] text-teal-800 flex items-center gap-1 transition"
                            >
                              <span className="truncate max-w-[220px] font-medium">{citation.title}</span>
                              <ExternalLink size={10} className="shrink-0 text-stone-400" />
                            </a>
                          ))}
                        </div>
                        {searchQueries.length > 0 && (
                          <div className="text-[10px] text-stone-400 font-mono pt-1">
                            Grounding queries: {searchQueries.join(", ")}
                          </div>
                        )}
                      </div>
                    )}

                    {agentTrace.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                          Agent Trace
                        </span>
                        {agentTrace.map((agent) => (
                          <span
                            key={agent}
                            className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-stone-200"
                          >
                            {agent}
                          </span>
                        ))}
                        {assistantConfidence !== null && (
                          <span className="ml-auto font-mono text-[10px] text-stone-400">
                            confidence {Math.round(assistantConfidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Interactive Follow-Up Recommendations */}
                    <div className="mt-4 border-t border-stone-100 pt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-teal-700 font-semibold flex items-center gap-1">
                        <Sparkles size={11} /> Next Actions:
                      </span>
                      <button
                        onClick={() => executePrompt(`Give me 2 practice test questions to verify if I truly understood this: ${assistantReply.slice(0, 100)}`)}
                        className="text-[11px] font-semibold text-slate-700 hover:text-teal-800 bg-stone-50 hover:bg-teal-50 border border-stone-200 px-2.5 py-1 rounded-lg transition"
                      >
                        Quiz Me on This
                      </button>
                      <button
                        onClick={() => selectNavigation("Study Studio")}
                        className="text-[11px] font-semibold text-slate-700 hover:text-teal-800 bg-stone-50 hover:bg-teal-50 border border-stone-200 px-2.5 py-1 rounded-lg transition"
                      >
                        Add to Study Blueprint
                      </button>
                      <button
                        onClick={() => setVoiceModalOpen(true)}
                        className="text-[11px] font-semibold text-slate-700 hover:text-teal-800 bg-stone-50 hover:bg-teal-50 border border-stone-200 px-2.5 py-1 rounded-lg transition"
                      >
                        Discuss in Voice Tutor
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Starter Prompt Chips */}
              <div className="mt-5 flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => executePrompt("Explain prior probability with a visual analogy")}
                  className="rounded-xl border border-stone-200/90 bg-white/70 px-3.5 py-1.5 text-xs text-stone-600 transition-all hover:border-slate-900 hover:bg-white hover:text-slate-900"
                >
                  Explain with an analogy
                </button>
                <button
                  onClick={() => executePrompt("Create a 5-question diagnostic for Bayesian inference")}
                  className="rounded-xl border border-stone-200/90 bg-white/70 px-3.5 py-1.5 text-xs text-stone-600 transition-all hover:border-slate-900 hover:bg-white hover:text-slate-900"
                >
                  Make a diagnostic
                </button>
                <button
                  onClick={() => executePrompt("Why does L1 regularization create sparse weights while L2 shrinks them?")}
                  className="rounded-xl border border-stone-200/90 bg-white/70 px-3.5 py-1.5 text-xs text-stone-600 transition-all hover:border-slate-900 hover:bg-white hover:text-slate-900"
                >
                  L1 vs L2 geometry
                </button>
              </div>
            </section>
          </div>

          {/* Recent Activity & Evidence Trail */}
          <div className="mt-14 grid gap-6 border-t border-[var(--line)] pt-8 md:grid-cols-[0.85fr_1.15fr]">
            {/* Recent Activity List (Interactive) */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-[var(--cobalt)]" />
                  <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--ink)]">
                    Recent Activity
                  </h2>
                </div>
                <span className="text-xs text-stone-400 font-mono">{activityList.length} logged</span>
              </div>
              <div className="space-y-1 rounded-2xl border border-stone-200/80 bg-white/60 p-2">
                {activityList.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedActivity(item)}
                    className="flex cursor-pointer items-center gap-3 py-2.5 px-3 transition-colors hover:bg-white rounded-xl"
                  >
                    <span className={`h-2 w-2 rounded-full ${item.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-stone-400">{item.meta}</p>
                    </div>
                    <span className="font-mono text-[10px] text-stone-500 shrink-0 font-medium">{item.status}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Evidence Trail Cards (Interactive) */}
            <section className="rounded-2xl bg-white/70 border border-stone-200/80 p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                    Evidence Trail
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--ink)]">
                    Verified Curriculum Citations
                  </h2>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--cobalt)]">
                  <Library size={16} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {demoEvidence.slice(0, 3).map((evidence) => (
                  <div
                    key={evidence.id}
                    onClick={() => setSelectedEvidence(evidence)}
                    className="cursor-pointer rounded-xl bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs border border-stone-200/70"
                  >
                    <p className="text-xs font-semibold leading-snug text-slate-900">{evidence.title}</p>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                      {evidence.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-[var(--cobalt)] font-medium">
                      Inspect citation <ArrowRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Institutional Connection Bar */}
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/75 backdrop-blur-md p-6 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Library size={17} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                  Institutional Integration
                </p>
                <h2 className="mt-0.5 font-display text-xl font-medium text-[var(--ink)]">CU-LMS / CUIMS Verified Context</h2>
                <p className="mt-1 max-w-[580px] text-xs leading-5 text-stone-500">
                  Course syllabi and identity context connect via Institutional SSO. CampusGenie never stores portal session keys in the application.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={() => selectNavigation("Institutional Tools")}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Open MCP Sandbox
              </button>
              <a
                href="https://lms.cuchd.in/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:border-slate-400 transition"
              >
                Open CU-LMS <ArrowUpRight size={13} />
              </a>
            </div>
          </section>

          {/* Deep Workspaces Component */}
          <AcademicWorkspaces
            requestedWorkspace={workspaceTarget as Workspace}
            onStatus={setAssistantReply}
            onAskQuestion={executePrompt}
            onMasteryChange={handleMasteryChange}
            onMisconceptionResolved={handleMisconceptionResolved}
            onActivityLog={handleLogActivity}
            currentLearner={learner}
          />
        </div>
      </section>

      {/* =========================================================================
          MODALS & DRAWERS FOR DEV ELEMENTS
          ========================================================================= */}

      {/* 1. Term Outcomes Modal */}
      {showOutcomesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-xs text-[var(--cobalt)] font-medium">Academic Term 4</span>
                <h3 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">Course Learning Outcomes</h3>
              </div>
              <button
                onClick={() => setShowOutcomesModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-3.5">
              {demoTermOutcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 transition-all hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-stone-500 font-medium">
                        {outcome.code} · {outcome.course} ({outcome.credits} credits)
                      </span>
                      <h4 className="mt-1 font-semibold text-sm text-slate-900">{outcome.title}</h4>
                    </div>
                    <span
                      className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        outcome.status === "mastered"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-stone-200/60 text-slate-700"
                      }`}
                    >
                      {outcome.mastery}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                    {outcome.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 border-t border-stone-200/60 pt-2.5 text-xs">
                    <button
                      onClick={() => {
                        setShowOutcomesModal(false);
                        selectNavigation("Quiz Lab");
                      }}
                      className="font-semibold text-[var(--cobalt)] hover:underline"
                    >
                      Test outcome in Quiz Lab
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      onClick={() => {
                        setShowOutcomesModal(false);
                        executePrompt(`Explain the key principles of "${outcome.title}" in ${outcome.course}`);
                      }}
                      className="text-stone-600 hover:text-slate-900 font-medium"
                    >
                      Ask CampusGenie
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end border-t border-stone-100 pt-4">
              <button
                onClick={() => setShowOutcomesModal(false)}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Curriculum Graph Visualizer Modal */}
      {showGraphModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-xs text-[var(--cobalt)] font-medium">Curriculum Hierarchy</span>
                <h3 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">Prerequisites & Progression</h3>
              </div>
              <button
                onClick={() => setShowGraphModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                CampusGenie sequences concepts strictly according to dependency theory: foundational axioms must reach minimum confidence before advanced regularization and systems optimization are recommended.
              </p>

              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 space-y-3">
                {curriculumGraph.map((node, i) => (
                  <div
                    key={node.id}
                    className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between border border-stone-200/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--cobalt)]">
                          0{i + 1}.
                        </span>
                        <h4 className="font-semibold text-sm text-slate-900">{node.label}</h4>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500">
                        {node.prerequisites.length > 0
                          ? `Prerequisites: ${node.prerequisites.join(", ")}`
                          : "Foundational Topic (No prerequisite required)"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowGraphModal(false);
                        executePrompt(`Provide a dependency walkthrough for ${node.label}`);
                      }}
                      className="rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-900 hover:text-white transition"
                    >
                      Inspect Node
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-stone-100 pt-4">
              <button
                onClick={() => setShowGraphModal(false)}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close Graph
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Learner Signal Diagnostics Drawer */}
      {showLearnerSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8 border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-xs text-[var(--cobalt)] font-medium">Cognitive State Model</span>
                <h3 className="font-display text-2xl font-medium tracking-tight text-[var(--ink)]">Learner Signal Profile</h3>
              </div>
              <button
                onClick={() => setShowLearnerSignalModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs leading-relaxed">
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200/70">
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Student Identity</span>
                <p className="mt-1 font-semibold text-sm text-slate-900">Aria Sharma (BSc Computer Science)</p>
                <p className="text-[11px] text-stone-500">Learner ID: learner-aria-01 · Active in 3 courses</p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Active Misconception Status</span>
                <div className="mt-1.5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-950">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <p className="font-semibold text-rose-900">{misconceptionAlert}</p>
                    <p className="mt-1 text-[11px] text-rose-800/90 leading-relaxed">
                      When evaluating Bayes theorem, students frequently substitute the likelihood P(D|H) directly for the prior P(H) before observing new diagnostic test findings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3">
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Actionable Next Step</span>
                <p className="mt-1 font-semibold text-slate-900">
                  Complete the 5-question Bayes diagnostic in Quiz Lab to clear the misconception flag and verify posterior calculation.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={() => {
                  setShowLearnerSignalModal(false);
                  selectNavigation("Quiz Lab");
                }}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Launch Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Evidence Inspection Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8 border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-xs text-[var(--cobalt)] font-medium">
                  Authority Tier: {selectedEvidence.authority} · Version {selectedEvidence.version}
                </span>
                <h3 className="font-display text-2xl font-medium tracking-tight text-[var(--ink)]">{selectedEvidence.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Source Origin</span>
                <p className="mt-1 font-semibold text-sm text-slate-900">{selectedEvidence.source}</p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Verified Excerpt</span>
                <blockquote className="mt-1.5 rounded-2xl bg-stone-50 border border-stone-200/80 p-4 text-xs italic leading-relaxed text-slate-800">
                  &ldquo;{selectedEvidence.excerpt}&rdquo;
                </blockquote>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Linked Topics</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {selectedEvidence.topicIds.map((tid) => (
                    <span key={tid} className="rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-slate-700">
                      {tid}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={() => {
                  const ev = selectedEvidence;
                  setSelectedEvidence(null);
                  executePrompt(`Explain this verified curriculum citation from ${ev.source}: "${ev.excerpt}"`);
                }}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Ask CampusGenie About Citation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display text-xl font-medium tracking-tight text-[var(--ink)]">Activity Receipt</h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Title</span>
                <p className="font-semibold text-sm text-slate-900">{selectedActivity.title}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Recorded Timestamp</span>
                <p className="text-stone-500">{selectedActivity.meta}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Status / Score</span>
                <p className="font-mono font-semibold text-[var(--cobalt)]">{selectedActivity.status}</p>
              </div>
              {selectedActivity.details && (
                <div>
                  <span className="font-mono text-[10px] uppercase text-stone-500 font-medium">Session Details</span>
                  <p className="mt-1 rounded-xl bg-stone-50 border border-stone-200/70 p-3 text-[11px] leading-5 text-slate-700">
                    {selectedActivity.details}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Gemini Live Voice Tutor Modal */}
      <VoiceTutorModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        activeTopic={bayesTopic?.topic}
      />

      {/* 7. Floating Right-Edge Peer Study Dock Trigger */}
      <button
        onClick={() => setPeerSidebarOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-900 text-white pl-2.5 pr-1.5 py-3 rounded-l-2xl shadow-xl backdrop-blur-md border border-r-0 border-teal-500/30 transition-all hover:pl-3.5 group select-none cursor-pointer"
        title="Open Peer Study Status (Community Active)"
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <Users size={14} className="text-teal-400 group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse ring-1 ring-slate-900" />
          </div>
          <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-mono tracking-wider text-stone-200 font-bold uppercase">
            Peer Study
          </span>
        </div>
      </button>

      {/* 8. Peer Study Status Community Sidebar Drawer */}
      <PeerStudyStatusSidebar
        isOpen={peerSidebarOpen}
        onClose={() => setPeerSidebarOpen(false)}
        currentWorkspace={activeNav}
        onSelectPrompt={(prompt) => executePrompt(prompt)}
        onOpenVoiceTutor={() => {
          setVoiceModalOpen(true);
        }}
      />
    </main>
  );
}