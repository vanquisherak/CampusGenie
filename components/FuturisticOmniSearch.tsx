"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  CircleHelp,
  Youtube,
  GraduationCap,
  X,
  ChevronRight,
  Zap,
  Flame,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface SearchRecommendation {
  id: string;
  title: string;
  category: "Concepts" | "Exam Questions" | "Blueprints" | "CUIMS Portal" | "Videos";
  subtitle: string;
  actionText: string;
  actionType: "ask" | "navigate_quiz" | "navigate_blueprint" | "navigate_cuims" | "external_video";
  topicId?: string;
  videoUrl?: string;
  tags: string[];
  matchScore?: number;
}

const SEARCH_DATABASE: SearchRecommendation[] = [
  // Concepts & Misconceptions
  {
    id: "rec-bayes-prior",
    title: "Bayesian Inference: Prior Probability vs Likelihood",
    category: "Concepts",
    subtitle: "Resolve the base-rate fallacy with step-by-step conditional probability derivations.",
    actionText: "Ask AI Tutor",
    actionType: "ask",
    topicId: "stats-bayes",
    tags: ["bayes", "probability", "statistics", "prior", "likelihood", "misconception", "math"],
  },
  {
    id: "rec-l1-l2-reg",
    title: "L1 Lasso vs L2 Ridge Regularization",
    category: "Concepts",
    subtitle: "Geometric intuition for why L1 leads to sparse weights while L2 shrinks coefficients.",
    actionText: "Ask AI Tutor",
    actionType: "ask",
    topicId: "ml-reg",
    tags: ["regularization", "lasso", "ridge", "machine learning", "weights", "overfitting"],
  },
  {
    id: "rec-dp-dag",
    title: "Dynamic Programming on DAGs & Memoization",
    category: "Concepts",
    subtitle: "Overlapping subproblems, state transitions, and topological ordering.",
    actionText: "Ask AI Tutor",
    actionType: "ask",
    topicId: "algo-dp",
    tags: ["dynamic programming", "dp", "algorithms", "dag", "memoization", "recursion"],
  },
  {
    id: "rec-crispr-cas9",
    title: "CRISPR-Cas9 Mechanism & Guide RNA Targeting",
    category: "Concepts",
    subtitle: "Protospacer adjacent motif (PAM) recognition and double-strand break repair.",
    actionText: "Ask AI Tutor",
    actionType: "ask",
    topicId: "bio-crispr",
    tags: ["crispr", "cas9", "biology", "genetics", "rna", "dna", "bioscience"],
  },

  // Exam & MST Questions
  {
    id: "rec-mst-bayes-prob",
    title: "Solve MST-1 Bayesian Disease Testing Problem",
    category: "Exam Questions",
    subtitle: "P(Disease)=0.01, Sensitivity=0.95, False Positive=0.05. Calculate P(Disease|Positive).",
    actionText: "Solve Step-by-Step",
    actionType: "ask",
    tags: ["mst", "exam", "bayes", "problem", "solution", "calculation", "disease testing"],
  },
  {
    id: "rec-mst-bellman-ford",
    title: "Derive Bellman-Ford Shortest Path with Negative Cycles",
    category: "Exam Questions",
    subtitle: "Relaxation steps on |V|-1 iterations and cycle detection condition.",
    actionText: "Generate Exam Answer",
    actionType: "ask",
    tags: ["bellman ford", "graphs", "algorithms", "mst", "exam", "negative cycles"],
  },
  {
    id: "rec-mst-neural-backprop",
    title: "Compute Backprop Partial Derivatives for 2-Layer MLP",
    category: "Exam Questions",
    subtitle: "Chain rule expansion for cross-entropy loss with softmax output.",
    actionText: "Derive Equations",
    actionType: "ask",
    tags: ["backpropagation", "neural networks", "derivatives", "chain rule", "deep learning"],
  },

  // Study Blueprints
  {
    id: "rec-bp-ml-nn",
    title: "21CSH-301: Machine Learning & Neural Networks Blueprint",
    category: "Blueprints",
    subtitle: "5-stage master roadmap with micro-goals, code implementations, and practice sets.",
    actionText: "Open Blueprint",
    actionType: "navigate_blueprint",
    tags: ["blueprint", "machine learning", "neural networks", "21csh-301", "study plan", "cu"],
  },
  {
    id: "rec-bp-cloud-devops",
    title: "21CSH-302: Cloud Architecture & DevOps Blueprint",
    category: "Blueprints",
    subtitle: "Microservices, Docker containerization, Kubernetes pods, and CI/CD pipelines.",
    actionText: "Open Blueprint",
    actionType: "navigate_blueprint",
    tags: ["blueprint", "cloud", "devops", "docker", "kubernetes", "21csh-302", "cu"],
  },
  {
    id: "rec-bp-algo-analysis",
    title: "21CSH-308: Design & Analysis of Algorithms Roadmap",
    category: "Blueprints",
    subtitle: "Divide and conquer, greedy proofs, dynamic programming, and NP-completeness.",
    actionText: "Open Blueprint",
    actionType: "navigate_blueprint",
    tags: ["blueprint", "algorithms", "daa", "21csh-308", "asymptotic notation", "cu"],
  },

  // CUIMS Portal & Attendance
  {
    id: "rec-cu-attendance-75",
    title: "Calculate 75% Safe Bunks & Recovery Lectures (CUIMS)",
    category: "CUIMS Portal",
    subtitle: "Instant attendance simulator: calculate exactly how many classes you can miss or must attend.",
    actionText: "Open 75% Predictor",
    actionType: "navigate_cuims",
    tags: ["attendance", "75", "safe bunk", "bunk", "cuims", "defaulter", "chandigarh university"],
  },
  {
    id: "rec-cu-today-schedule",
    title: "Today's Class Timetable & Lecture Hall Locator",
    category: "CUIMS Portal",
    subtitle: "View room numbers (Block B1, LC-4), assigned professors, and period timeline.",
    actionText: "View Daily Schedule",
    actionType: "navigate_cuims",
    tags: ["timetable", "schedule", "classes", "room", "venue", "block", "cuims", "today"],
  },
  {
    id: "rec-cu-mst-score",
    title: "MST Marks & End-Term Exam (ETE) Grade Forecaster",
    category: "CUIMS Portal",
    subtitle: "Calculate required marks in 60-mark external exam to achieve an O / A+ grade.",
    actionText: "Calculate Target Grade",
    actionType: "navigate_cuims",
    tags: ["mst", "marks", "grade", "cgpa", "ete", "end term", "cuims", "internal"],
  },
  {
    id: "rec-cu-outing-pass",
    title: "Hostel Outing E-Pass & Biometric Gate QR",
    category: "CUIMS Portal",
    subtitle: "Warden approval status and turnstile entry QR for Chandigarh University gates.",
    actionText: "Open Gate Pass",
    actionType: "navigate_cuims",
    tags: ["hostel", "outing", "gate pass", "qr", "gate", "warden", "cuims"],
  },

  // Curated Video Lessons
  {
    id: "rec-vid-bayes-3b1b",
    title: "Bayes Theorem Essence & Visual Derivation",
    category: "Videos",
    subtitle: "By 3Blue1Brown · 15 min visual explanation of priors, likelihood, and evidence.",
    actionText: "Watch on YouTube",
    actionType: "external_video",
    videoUrl: "https://www.youtube.com/watch?v=HZGCoVF3YvM",
    tags: ["youtube", "video", "3blue1brown", "bayes", "visual", "math"],
  },
  {
    id: "rec-vid-statquest-ridge",
    title: "Ridge Regression (L2) Clearly Explained",
    category: "Videos",
    subtitle: "By StatQuest · 12 min intuition on bias-variance trade-off and lambda penalty.",
    actionText: "Watch on YouTube",
    actionType: "external_video",
    videoUrl: "https://www.youtube.com/watch?v=Q81RR3yKn30",
    tags: ["youtube", "video", "statquest", "ridge", "regularization", "l2"],
  },
  {
    id: "rec-vid-mit-dp",
    title: "Dynamic Programming: Memoization & Subproblems",
    category: "Videos",
    subtitle: "MIT OpenCourseWare (6.006) · 45 min master lecture on recursive algorithms.",
    actionText: "Watch on YouTube",
    actionType: "external_video",
    videoUrl: "https://www.youtube.com/watch?v=OQ5jsbhAv_M",
    tags: ["youtube", "video", "mit", "algorithms", "dynamic programming", "lecture"],
  },
];

export function FuturisticOmniSearch({
  onSelectPrompt,
  onNavigateWorkspace,
  onOpenVoiceTutor,
}: {
  onSelectPrompt: (prompt: string) => void;
  onNavigateWorkspace: (workspace: string) => void;
  onOpenVoiceTutor?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter recommendations based on query and category
  const filteredRecommendations = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    let list = SEARCH_DATABASE;

    if (trimmed) {
      list = SEARCH_DATABASE.map((item) => {
        let score = 0;
        if (item.title.toLowerCase().includes(trimmed)) score += 10;
        if (item.subtitle.toLowerCase().includes(trimmed)) score += 5;
        if (item.tags.some((tag) => tag.toLowerCase().includes(trimmed))) score += 7;
        return { ...item, matchScore: score };
      })
        .filter((item) => (item.matchScore ?? 0) > 0)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }

    if (activeCategory !== "All") {
      list = list.filter((item) => item.category === activeCategory);
    }

    return list.slice(0, 7);
  }, [query, activeCategory]);

  function handleSelect(item: SearchRecommendation) {
    setIsOpen(false);
    setQuery("");

    if (item.actionType === "ask") {
      onSelectPrompt(
        item.category === "Exam Questions"
          ? `Provide a rigorous, step-by-step exam solution for this question: "${item.title}". Detail the equations, boundary conditions, and common grading rubrics.`
          : `Explain ${item.title} with intuitive analogies, core mathematical definitions, and practical code or diagrams. Address common student misconceptions.`
      );
    } else if (item.actionType === "navigate_quiz") {
      onNavigateWorkspace("Quiz Lab");
    } else if (item.actionType === "navigate_blueprint") {
      onNavigateWorkspace("Study Studio");
    } else if (item.actionType === "navigate_cuims") {
      onNavigateWorkspace("CUIMS Student Hub");
    } else if (item.actionType === "external_video" && item.videoUrl) {
      window.open(item.videoUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredRecommendations.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredRecommendations.length) % Math.max(1, filteredRecommendations.length));
    } else if (e.key === "Enter" && filteredRecommendations[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredRecommendations[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={searchContainerRef} className="relative w-full z-40">
      {/* Futuristic Ambient Glow & Border */}
      <motion.div
        className="relative group rounded-2xl p-[1px] transition-all duration-300"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, rgba(20, 184, 166, 0.8), rgba(99, 102, 241, 0.6), rgba(244, 63, 94, 0.6))"
            : "linear-gradient(135deg, rgba(226, 232, 240, 0.9), rgba(203, 213, 225, 0.7))",
          boxShadow: isOpen
            ? "0 0 25px -5px rgba(20, 184, 166, 0.35), 0 10px 20px -5px rgba(15, 23, 42, 0.08)"
            : "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
        }}
        animate={{ scale: isOpen ? 1.005 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-[15px] px-4 py-3 sm:py-3.5 transition-all">
          <div className="flex items-center gap-2.5 mr-3 text-teal-600">
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <Search size={18} className="text-teal-600 shrink-0" />
            </motion.div>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search any concept, exam question, CUIMS attendance rule, or blueprint..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-stone-400 outline-none font-medium"
          />

          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                }}
                className="text-stone-400 hover:text-slate-700 p-1 rounded-md transition"
              >
                <X size={15} />
              </button>
            )}

            {/* Futuristic Live AI Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-[11px] font-mono text-teal-800 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
              Smart Radar
            </span>
          </div>
        </div>
      </motion.div>

      {/* Floating Holographic Recommendation Matrix Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-2xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden z-50 divide-y divide-stone-100"
          >
            {/* Category Filter Deck */}
            <div className="px-4 py-2.5 bg-stone-50/80 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-stone-400 mr-1 flex items-center gap-1">
                  <Layers size={11} /> Filters:
                </span>
                {["All", "Concepts", "Exam Questions", "Blueprints", "CUIMS Portal", "Videos"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      activeCategory === cat
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-stone-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-[10px] font-mono text-stone-400 shrink-0 hidden md:inline">
                Use ↑ ↓ arrows & [Enter]
              </span>
            </div>

            {/* Recommendation Items List */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group cursor-pointer rounded-xl p-3 transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-teal-50/70 border border-teal-200/90 shadow-xs"
                          : "hover:bg-stone-50 border border-transparent"
                      }`}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-xl p-2 shrink-0 ${
                            item.category === "Concepts"
                              ? "bg-indigo-50 text-indigo-600"
                              : item.category === "Exam Questions"
                              ? "bg-amber-50 text-amber-700"
                              : item.category === "Blueprints"
                              ? "bg-teal-50 text-teal-700"
                              : item.category === "CUIMS Portal"
                              ? "bg-red-50 text-red-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {item.category === "Concepts" && <Sparkles size={16} />}
                          {item.category === "Exam Questions" && <Flame size={16} />}
                          {item.category === "Blueprints" && <BookOpen size={16} />}
                          {item.category === "CUIMS Portal" && <GraduationCap size={16} />}
                          {item.category === "Videos" && <Youtube size={16} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-semibold text-slate-900 group-hover:text-teal-900 transition">
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                                item.category === "CUIMS Portal"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5 leading-snug max-w-xl">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        <span className="text-xs font-semibold text-teal-700 hidden sm:inline group-hover:underline">
                          {item.actionText}
                        </span>
                        <ChevronRight
                          size={15}
                          className="text-stone-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <CircleHelp size={28} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">No pre-indexed matches for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                    Press [Enter] to submit directly to CampusGenie AI with real-time curriculum search.
                  </p>
                  <button
                    onClick={() => {
                      onSelectPrompt(query);
                      setIsOpen(false);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                  >
                    <span>Ask Gemini about &ldquo;{query}&rdquo;</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Suggestions Footer */}
            <div className="px-4 py-2.5 bg-stone-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" />
                <span className="font-semibold text-stone-700">Quick Searches:</span>
                {[
                  "Bayes Likelihood",
                  "CUIMS 75% Rule",
                  "L1 vs L2",
                  "MST Questions",
                  "Cloud DevOps",
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setQuery(tag);
                      setIsOpen(true);
                    }}
                    className="hover:text-slate-900 hover:underline transition"
                  >
                    {tag} ·
                  </button>
                ))}
              </div>

              {onOpenVoiceTutor && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenVoiceTutor();
                  }}
                  className="flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 transition"
                >
                  <span>Launch Live Voice Tutor</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
