"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  X,
  Sparkles,
  Mic,
  Radio,
  BookOpen,
  CheckCircle2,
  Coffee,
  Brain,
  GraduationCap,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";

export type PeerStatus = "available" | "focus" | "voice" | "seeking" | "break";

export interface ClassmatePeer {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  branch: string;
  workspace: string;
  currentTask: string;
  status: PeerStatus;
  statusText: string;
  focusMinutes: number;
  strengthBadge?: string;
  statMeta?: string;
  suggestedPrompt: string;
}

export interface StudyPod {
  id: string;
  title: string;
  workspace: string;
  membersCount: number;
  topic: string;
  voiceActive: boolean;
  prompt: string;
}

interface PeerStudyStatusSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: string;
  onSelectPrompt: (prompt: string) => void;
  onOpenVoiceTutor?: (topicName: string) => void;
}

// Mock Peer Data Indexed by Workspace
const PEERS_DATABASE: Record<string, ClassmatePeer[]> = {
  "CUIMS Student Hub": [
    {
      id: "peer-cu-1",
      name: "Rohan Sharma",
      initials: "RS",
      avatarBg: "bg-blue-600",
      branch: "B.Tech CSE · Sec 402",
      workspace: "CUIMS Student Hub",
      currentTask: "Solving Operating Systems MST-2 PYQs on CPU Scheduling",
      status: "available",
      statusText: "Available to Pair",
      focusMinutes: 24,
      strengthBadge: "MST-1: 19/20",
      statMeta: "Attendance: 86.4% · 4 bunks safe",
      suggestedPrompt:
        "Pair study with Rohan on CUIMS Operating Systems: Walk me through Round Robin vs SRTF CPU scheduling algorithms with a Gantt chart example and calculate average turnaround time.",
    },
    {
      id: "peer-cu-2",
      name: "Simran Kaur",
      initials: "SK",
      avatarBg: "bg-purple-600",
      branch: "CSE (AI & ML) · Sec 201",
      workspace: "CUIMS Student Hub",
      currentTask: "Calculating 75% Attendance Margin & Duty Leave submissions",
      status: "focus",
      statusText: "In Deep Focus (Pomodoro)",
      focusMinutes: 45,
      strengthBadge: "75% Recovery Pro",
      statMeta: "Duty Leave approved",
      suggestedPrompt:
        "Review CUIMS official attendance formula C = 3D - 4A: Explain how duty leaves affect total delivery days and calculate minimum consecutive attendance needed.",
    },
    {
      id: "peer-cu-3",
      name: "Aarav Patel",
      initials: "AP",
      avatarBg: "bg-teal-600",
      branch: "Cloud Computing · Sec 104",
      workspace: "CUIMS Student Hub",
      currentTask: "Reviewing Deadlock Prevention & Banker's Safety Algorithm",
      status: "seeking",
      statusText: "Looking for Study Buddy",
      focusMinutes: 15,
      strengthBadge: "Needs review partner",
      statMeta: "Aiming for 20/20 in MST-2",
      suggestedPrompt:
        "Let's practice the Banker's Algorithm with Aarav: Given Allocation, Max, and Available matrices, determine if the system is in a safe state and output the safe sequence.",
    },
    {
      id: "peer-cu-4",
      name: "Tanya Sen",
      initials: "TS",
      avatarBg: "bg-rose-600",
      branch: "Data Science · Sec 301",
      workspace: "CUIMS Student Hub",
      currentTask: "In Study Pod: CU-LMS syllabus cross-checking for Database Systems",
      status: "voice",
      statusText: "In Voice Study Pod #2",
      focusMinutes: 38,
      strengthBadge: "Voice Pod Host",
      statMeta: "Active in Voice Room",
      suggestedPrompt:
        "Join Tanya's CUIMS database review: Explain B+ Tree indexing vs Hash indexing trade-offs for high-volume student portal queries.",
    },
  ],

  "Study Studio": [
    {
      id: "peer-ss-1",
      name: "Ananya Iyer",
      initials: "AI",
      avatarBg: "bg-emerald-600",
      branch: "AI & Robotics · 4th Sem",
      workspace: "Study Studio",
      currentTask: "Synthesizing 5-stage blueprint on Transformer Attention Mechanisms",
      status: "available",
      statusText: "Available to Pair",
      focusMinutes: 32,
      strengthBadge: "Blueprint Creator",
      statMeta: "4 study sprints logged today",
      suggestedPrompt:
        "Co-study with Ananya: Generate a 5-step learning blueprint for Transformer Self-Attention, including scaled dot-product math, matrix shapes, and recommended visual lectures.",
    },
    {
      id: "peer-ss-2",
      name: "Kabir Mehta",
      initials: "KM",
      avatarBg: "bg-amber-600",
      branch: "CSE · Sec 408",
      workspace: "Study Studio",
      currentTask: "Sprint 3/4: Dynamic Programming DAG Longest Path state formulation",
      status: "focus",
      statusText: "Deep Focus (Sprint 3)",
      focusMinutes: 52,
      strengthBadge: "Focus Streak 6 Days",
      statMeta: "98% completion rate",
      suggestedPrompt:
        "Review Dynamic Programming with Kabir: Derive the DAG topological ordering DP recurrence relation and explain why greedy choices fail.",
    },
    {
      id: "peer-ss-3",
      name: "Priya Verma",
      initials: "PV",
      avatarBg: "bg-indigo-600",
      branch: "Cybersecurity · Sec 112",
      workspace: "Study Studio",
      currentTask: "Structuring blueprint for Asymmetric Cryptography & RSA proofs",
      status: "seeking",
      statusText: "Looking for Study Buddy",
      focusMinutes: 18,
      strengthBadge: "Math derivations",
      statMeta: "Seeking proof review",
      suggestedPrompt:
        "Study partner session with Priya: Step through the RSA key generation proof using Euler's Totient theorem and solve a numerical key-pair calculation.",
    },
    {
      id: "peer-ss-4",
      name: "Devansh Joshi",
      initials: "DJ",
      avatarBg: "bg-rose-600",
      branch: "B.Tech IT · Sec 302",
      workspace: "Study Studio",
      currentTask: "Working through 3-step Bridge Plan on Bayesian Inference",
      status: "available",
      statusText: "Available to Pair",
      focusMinutes: 20,
      strengthBadge: "Bridge Builder",
      statMeta: "Mastery +15% recorded",
      suggestedPrompt:
        "Work with Devansh on the Bayesian Bridge-Building Plan: Explain how the 100,000 contingency grid resolves the prior vs likelihood misconception.",
    },
  ],

  "Quiz Lab": [
    {
      id: "peer-ql-1",
      name: "Vikram Singhania",
      initials: "VS",
      avatarBg: "bg-blue-600",
      branch: "CSE Core · Sec 205",
      workspace: "Quiz Lab",
      currentTask: "Scored 5/5 on Bayes Diagnostic! Reviewing false positive rate proofs",
      status: "available",
      statusText: "Available to Pair",
      focusMinutes: 28,
      strengthBadge: "Quiz Lab Rank #3",
      statMeta: "100% Diagnostic Accuracy",
      suggestedPrompt:
        "Challenge test with Vikram: Create a 3-question diagnostic on medical test screening with base rate 0.05% and test sensitivity 99%. Calculate P(Disease|Positive).",
    },
    {
      id: "peer-ql-2",
      name: "Ritika Das",
      initials: "RD",
      avatarBg: "bg-teal-600",
      branch: "Computer Engineering · Sec 309",
      workspace: "Quiz Lab",
      currentTask: "Speed Run: 10 timed questions on Cache Invalidation & Write-Through",
      status: "focus",
      statusText: "In Timed Quiz (2:15 left)",
      focusMinutes: 14,
      strengthBadge: "Daily Quiz Streak",
      statMeta: "Leaderboard Top 5%",
      suggestedPrompt:
        "Quiz preparation with Ritika: Generate 3 speed-drill questions comparing write-through, write-back, and write-around cache policies with memory access latencies.",
    },
    {
      id: "peer-ql-3",
      name: "Arjun Nair",
      initials: "AN",
      avatarBg: "bg-violet-600",
      branch: "Software Engineering · Sec 101",
      workspace: "Quiz Lab",
      currentTask: "Deconstructing L1 Lasso sharp corner geometry vs L2 Ridge sphere",
      status: "seeking",
      statusText: "Looking for Quiz Partner",
      focusMinutes: 19,
      strengthBadge: "Regularization Focus",
      statMeta: "Mastery +12% today",
      suggestedPrompt:
        "Quiz me with Arjun: Explain geometrically why L1 regularization generates exact zero feature weights while L2 only shrinks them asymptotically.",
    },
    {
      id: "peer-ql-4",
      name: "Sanya Kapoor",
      initials: "SK",
      avatarBg: "bg-rose-600",
      branch: "AI Specialization · Sec 404",
      workspace: "Quiz Lab",
      currentTask: "Live Voice Face-Off on Probability Foundations & Axioms",
      status: "voice",
      statusText: "Voice Quiz Arena",
      focusMinutes: 35,
      strengthBadge: "Voice Arena Host",
      statMeta: "Score: 92/100",
      suggestedPrompt:
        "Join Sanya's voice quiz challenge: Ask me 3 progressive difficulty questions about the Law of Total Probability and conditional independence.",
    },
  ],

  "Project Radar": [
    {
      id: "peer-pr-1",
      name: "Karan Gill",
      initials: "KG",
      avatarBg: "bg-slate-800",
      branch: "Systems & Architecture",
      workspace: "Project Radar",
      currentTask: "Building Distributed Raft Consensus leader election in Go",
      status: "available",
      statusText: "Open for Code Review",
      focusMinutes: 65,
      strengthBadge: "Go / Protobuf",
      statMeta: "14 commits · Docker up",
      suggestedPrompt:
        "Pair on Karan's distributed system project: Review the Raft heartbeat interval timer and explain how split votes are avoided using randomized election timeouts.",
    },
    {
      id: "peer-pr-2",
      name: "Neha Rao",
      initials: "NR",
      avatarBg: "bg-teal-700",
      branch: "Data Science & ML · Sec 202",
      workspace: "Project Radar",
      currentTask: "Optimizing Multi-Head Attention forward pass CUDA tensors",
      status: "focus",
      statusText: "CUDA Debugging Mode",
      focusMinutes: 78,
      strengthBadge: "PyTorch Pro",
      statMeta: "Loss reduced to 0.21",
      suggestedPrompt:
        "Code review with Neha: Walk through PyTorch FlashAttention v2 memory efficiency principles and how tile-based softmax eliminates O(N^2) memory bottlenecks.",
    },
    {
      id: "peer-pr-3",
      name: "Harshvardhan",
      initials: "HP",
      avatarBg: "bg-amber-700",
      branch: "Cloud Computing · Sec 405",
      workspace: "Project Radar",
      currentTask: "Designing Redis cache invalidation lease tokens for 10k RPS microservices",
      status: "seeking",
      statusText: "Looking for Architecture Partner",
      focusMinutes: 30,
      strengthBadge: "High Concurrency",
      statMeta: "Target: Zero stale reads",
      suggestedPrompt:
        "Architecture review with Harshvardhan: Design an idempotent cache invalidation protocol using Redis Redlock and version tokens to prevent stale read races.",
    },
  ],

  "Bioscience Studio": [
    {
      id: "peer-bio-1",
      name: "Dr. Meera Nambiar",
      initials: "MN",
      avatarBg: "bg-emerald-700",
      branch: "Bioinformatics Research",
      workspace: "Bioscience Studio",
      currentTask: "Visualizing AlphaFold PDB-7K8M active pocket docking geometry",
      status: "available",
      statusText: "Available for Consultation",
      focusMinutes: 50,
      strengthBadge: "Structural Bio",
      statMeta: "RMSD: 0.82Å · 4 papers",
      suggestedPrompt:
        "Consultation with Dr. Meera: Explain how AlphaFold2 translates pairwise residue distances (distograms) into 3D Cartesian coordinates with invariant point attention.",
    },
    {
      id: "peer-bio-2",
      name: "Siddharth Roy",
      initials: "SR",
      avatarBg: "bg-cyan-700",
      branch: "Biomedical Eng · 3rd Year",
      workspace: "Bioscience Studio",
      currentTask: "CRISPR-Cas9 sgRNA off-target cleavage scoring algorithm",
      status: "focus",
      statusText: "Deep Computation Run",
      focusMinutes: 40,
      strengthBadge: "CFD Scoring",
      statMeta: "99.4% specificity target",
      suggestedPrompt:
        "Explore CRISPR guide design with Siddharth: How does the Cutting Frequency Determination (CFD) matrix penalize PAM-distal vs PAM-proximal mismatches?",
    },
    {
      id: "peer-bio-3",
      name: "Pooja Malhotra",
      initials: "PM",
      avatarBg: "bg-rose-700",
      branch: "Genomics · Sec 102",
      workspace: "Bioscience Studio",
      currentTask: "Running BLAST sequence alignments on influenza hemagglutinin variants",
      status: "seeking",
      statusText: "Looking for Analysis Partner",
      focusMinutes: 22,
      strengthBadge: "BLAST / Clustal Omega",
      statMeta: "3 FASTA datasets loaded",
      suggestedPrompt:
        "Partner with Pooja: Interpret BLAST E-value thresholds and bit scores when analyzing antigenic drift mutations in viral envelope proteins.",
    },
  ],
};

// Mock Active Study Pods per workspace
const STUDY_PODS: Record<string, StudyPod[]> = {
  "CUIMS Student Hub": [
    {
      id: "pod-1",
      title: "MST-2 Operating Systems Cram Room",
      workspace: "CUIMS Student Hub",
      membersCount: 4,
      topic: "CPU Scheduling & Banker's Algorithm",
      voiceActive: true,
      prompt: "Join MST-2 Operating Systems Cram Room: Review all high-yield exam questions for CPU scheduling and memory pagination.",
    },
    {
      id: "pod-2",
      title: "CUIMS Attendance & Bunk Recovery Club",
      workspace: "CUIMS Student Hub",
      membersCount: 3,
      topic: "75% Official Rule Strategy",
      voiceActive: false,
      prompt: "Calculate my 75% attendance recovery plan and list actionable steps to handle medical certificates on CUIMS.",
    },
  ],
  "Study Studio": [
    {
      id: "pod-3",
      title: "Deep Work Sprint: Transformers & LLMs",
      workspace: "Study Studio",
      membersCount: 5,
      topic: "Self-Attention Blueprinting",
      voiceActive: true,
      prompt: "Join the Deep Work Sprint: Guide me through Transformer self-attention, multi-head projections, and positional encodings.",
    },
  ],
  "Quiz Lab": [
    {
      id: "pod-4",
      title: "Bayesian Reasoning Battle Arena",
      workspace: "Quiz Lab",
      membersCount: 3,
      topic: "Prior vs Likelihood Diagnostics",
      voiceActive: true,
      prompt: "Start the Bayesian Reasoning Battle: Quiz me with 4 rapid-fire diagnostic problems that test base-rate neglect.",
    },
  ],
  "Project Radar": [
    {
      id: "pod-5",
      title: "Distributed Systems Architecture Pod",
      workspace: "Project Radar",
      membersCount: 3,
      topic: "Raft Consensus & Cache Invalidation",
      voiceActive: true,
      prompt: "Join the Distributed Architecture Pod: Help me trace a concurrent Raft leader election failure scenario.",
    },
  ],
  "Bioscience Studio": [
    {
      id: "pod-6",
      title: "AlphaFold & Protein Docking Lab Pod",
      workspace: "Bioscience Studio",
      membersCount: 2,
      topic: "Residue Binding Analysis",
      voiceActive: false,
      prompt: "Walk me through AlphaFold PDB structure interpretation and pocket binding energy calculations.",
    },
  ],
};

export function PeerStudyStatusSidebar({
  isOpen,
  onClose,
  currentWorkspace,
  onSelectPrompt,
  onOpenVoiceTutor,
}: PeerStudyStatusSidebarProps) {
  // Map navigation labels to workspace keys
  const resolvedWorkspaceKey = useMemo(() => {
    if (currentWorkspace.includes("CUIMS")) return "CUIMS Student Hub";
    if (currentWorkspace.includes("Study")) return "Study Studio";
    if (currentWorkspace.includes("Quiz")) return "Quiz Lab";
    if (currentWorkspace.includes("Project")) return "Project Radar";
    if (currentWorkspace.includes("Bioscience")) return "Bioscience Studio";
    return "CUIMS Student Hub";
  }, [currentWorkspace]);

  const classmates = useMemo(
    () => PEERS_DATABASE[resolvedWorkspaceKey] || PEERS_DATABASE["CUIMS Student Hub"],
    [resolvedWorkspaceKey]
  );

  const activePods = useMemo(
    () => STUDY_PODS[resolvedWorkspaceKey] || [],
    [resolvedWorkspaceKey]
  );

  // User's own broadcasting study status
  const [myStatus, setMyStatus] = useState<PeerStatus>("available");
  const [myFocusTask, setMyFocusTask] = useState<string>(
    `Studying ${resolvedWorkspaceKey} curriculum`
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PeerStatus>("all");
  const [waveFeedback, setWaveFeedback] = useState<string | null>(null);

  // Soft Ambient Study Tone using Web Audio API (zero external assets)
  const [ambientAudioOn, setAmbientAudioOn] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    setMyFocusTask(`Studying ${resolvedWorkspaceKey} modules`);
  }, [resolvedWorkspaceKey]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (osc1Ref.current) {
        try {
          osc1Ref.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  function toggleAmbientSound() {
    if (ambientAudioOn) {
      if (osc1Ref.current) {
        try {
          osc1Ref.current.stop();
        } catch {
          // ignore
        }
        osc1Ref.current = null;
      }
      setAmbientAudioOn(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
        gainNode.connect(ctx.destination);
        gainNodeRef.current = gainNode;

        // Gentle 432Hz focus harmonic chime
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        osc.connect(gainNode);
        osc.start();
        osc1Ref.current = osc;

        setAmbientAudioOn(true);
      } catch (e) {
        console.warn("Web Audio not supported or blocked by browser policy", e);
      }
    }
  }

  function handleSendWave(peerName: string) {
    setWaveFeedback(`👋 Sent study wave to ${peerName}! They received your ping.`);
    setTimeout(() => {
      setWaveFeedback(null);
    }, 3500);
  }

  const filteredPeers = useMemo(() => {
    return classmates.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.currentTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.branch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [classmates, searchQuery, statusFilter]);

  const availableCount = classmates.filter((p) => p.status === "available").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-xs lg:hidden"
          />

          {/* Peer Study Status Sidebar Drawer */}
          <motion.aside
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] bg-white/95 backdrop-blur-xl border-l border-stone-200/90 shadow-2xl flex flex-col overflow-hidden text-slate-800"
          >
            {/* Sidebar Top Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-gradient-to-r from-stone-50 via-teal-50/20 to-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Users size={17} className="text-teal-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-base font-bold text-slate-950">
                      Peer Study Status
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {availableCount} Available
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                    <span>Synchronized with:</span>
                    <span className="text-teal-700 font-semibold">{resolvedWorkspaceKey}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Ambient Study Tone Switch */}
                <button
                  onClick={toggleAmbientSound}
                  className={`p-1.5 rounded-xl border text-xs transition flex items-center gap-1 ${
                    ambientAudioOn
                      ? "bg-teal-50 text-teal-800 border-teal-300 font-semibold shadow-2xs"
                      : "bg-white text-stone-500 border-stone-200 hover:text-slate-800"
                  }`}
                  title={ambientAudioOn ? "Mute 432Hz focus chime" : "Play subtle 432Hz focus study chime"}
                >
                  {ambientAudioOn ? <Volume2 size={14} className="text-teal-600 animate-pulse" /> : <VolumeX size={14} />}
                </button>

                {/* Close Drawer */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-400 hover:text-slate-700 border border-stone-200 transition"
                  aria-label="Close peer sidebar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification Toast for Wave / Study Invite */}
            {waveFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-between shadow-xs"
              >
                <span>{waveFeedback}</span>
                <button onClick={() => setWaveFeedback(null)} className="text-white/80 hover:text-white">
                  ✕
                </button>
              </motion.div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* My Broadcasting Study Status Widget */}
              <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/80 p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-teal-600" />
                    My Community Presence
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Live Broadcast
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { id: "available", label: "Available to Pair", icon: CheckCircle2, color: "text-emerald-600" },
                    { id: "focus", label: "In Deep Focus", icon: Brain, color: "text-purple-600" },
                    { id: "seeking", label: "Seeking Buddy", icon: Users, color: "text-teal-600" },
                    { id: "break", label: "On 5m Break", icon: Coffee, color: "text-amber-600" },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = myStatus === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setMyStatus(s.id as PeerStatus)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                          isActive
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <Icon size={11} className={isActive ? "text-teal-300" : s.color} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={myFocusTask}
                    onChange={(e) => setMyFocusTask(e.target.value)}
                    placeholder="Broadcast your active focus topic..."
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:border-teal-600"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-mono">
                    Visible to cohort
                  </span>
                </div>
              </div>

              {/* Active Study Pods in this Workspace */}
              {activePods.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                      <Radio size={13} className="text-rose-500 animate-pulse" />
                      Live Study Pods in {resolvedWorkspaceKey}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {activePods.length} room{activePods.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activePods.map((pod) => (
                      <div
                        key={pod.id}
                        className="rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50/60 to-white p-3 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-950 text-xs">
                                {pod.title}
                              </span>
                              {pod.voiceActive && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold flex items-center gap-1">
                                  <Mic size={9} /> Voice Open
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 mt-0.5">
                              Focus: <span className="font-medium text-slate-900">{pod.topic}</span>
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-stone-500 shrink-0 bg-white px-2 py-0.5 rounded border border-stone-200 font-semibold">
                            👥 {pod.membersCount} Peers
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-rose-100">
                          <button
                            onClick={() => {
                              onSelectPrompt(pod.prompt);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Sparkles size={11} className="text-teal-400" />
                            <span>Join Pod Discussion</span>
                          </button>

                          {onOpenVoiceTutor && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenVoiceTutor(pod.topic);
                              }}
                              className="py-1.5 px-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                              title="Join voice study room"
                            >
                              <Mic size={12} />
                              <span>Audio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Classmate Availability Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <GraduationCap size={14} className="text-[var(--cobalt)]" />
                    Classmates Active in {resolvedWorkspaceKey} ({filteredPeers.length})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Pulse
                  </span>
                </div>

                {/* Filter and Search Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search classmates by name, task, or branch..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold">
                    {[
                      { id: "all", label: "All Classmates" },
                      { id: "available", label: "🟢 Available" },
                      { id: "focus", label: "🟣 Deep Focus" },
                      { id: "seeking", label: "🤝 Seeking Buddy" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id as "all" | PeerStatus)}
                        className={`px-2 py-0.5 rounded-lg border transition whitespace-nowrap ${
                          statusFilter === f.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Classmate Cards List */}
                <div className="space-y-2.5">
                  {filteredPeers.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500">
                      No classmates match the filter in this workspace. Try clearing your search.
                    </div>
                  ) : (
                    filteredPeers.map((peer) => {
                      const isAvailable = peer.status === "available";
                      const isFocus = peer.status === "focus";
                      const isVoice = peer.status === "voice";

                      return (
                        <div
                          key={peer.id}
                          className="rounded-2xl border border-stone-200/90 bg-white p-3.5 space-y-2.5 shadow-2xs transition hover:shadow-xs hover:border-stone-300"
                        >
                          {/* Peer Header Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <div
                                  className={`h-9 w-9 rounded-xl ${peer.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                                >
                                  {peer.initials}
                                </div>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                                    isAvailable
                                      ? "bg-emerald-500"
                                      : isFocus
                                      ? "bg-purple-600"
                                      : isVoice
                                      ? "bg-rose-500"
                                      : "bg-teal-500"
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-slate-900 text-xs">
                                    {peer.name}
                                  </h4>
                                  {peer.strengthBadge && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                                      {peer.strengthBadge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-400 font-mono">
                                  {peer.branch} · {peer.focusMinutes}m active
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isFocus
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : isVoice
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-teal-50 text-teal-700 border border-teal-200"
                              }`}
                            >
                              {peer.statusText}
                            </span>
                          </div>

                          {/* Current Study Task Box */}
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-150 text-xs text-slate-700 space-y-1">
                            <div className="text-[10px] uppercase font-mono text-stone-400 font-bold flex items-center gap-1">
                              <BookOpen size={10} className="text-teal-600" />
                              Working On:
                            </div>
                            <p className="text-[11px] leading-snug text-slate-800 font-medium">
                              {peer.currentTask}
                            </p>
                            {peer.statMeta && (
                              <p className="text-[10px] text-stone-500 font-mono">
                                📌 {peer.statMeta}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: Study Together & Wave */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              onClick={() => {
                                onSelectPrompt(peer.suggestedPrompt);
                                onClose();
                              }}
                              className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                              title="Ask CampusGenie to pair study on this topic"
                            >
                              <Sparkles size={11} className="text-teal-400" />
                              <span>Pair in CampusGenie</span>
                            </button>

                            <button
                              onClick={() => handleSendWave(peer.name)}
                              className="py-1.5 px-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-[11px] font-semibold transition flex items-center gap-1"
                              title="Send friendly study nudge"
                            >
                              <span>👋 Wave</span>
                            </button>

                            {onOpenVoiceTutor && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenVoiceTutor(peer.currentTask);
                                }}
                                className="py-1.5 px-2 bg-stone-50 hover:bg-teal-50 text-teal-700 border border-stone-200 hover:border-teal-300 rounded-xl text-[11px] font-semibold transition flex items-center"
                                title="Open Voice Tutor with peer topic"
                              >
                                <Mic size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Sticky Bottom Summary */}
            <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] text-stone-600 font-medium">
                  {classmates.length} classmates in <span className="text-slate-900 font-bold">{resolvedWorkspaceKey}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  onSelectPrompt(
                    `Summarize community study trends across ${resolvedWorkspaceKey}: What are the most frequent exam questions classmates are practicing right now?`
                  );
                  onClose();
                }}
                className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Cohort Trends</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
