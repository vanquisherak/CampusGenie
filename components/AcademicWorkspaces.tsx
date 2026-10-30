"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  FlaskConical,
  HelpCircle,
  Library,
  Lock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import {
  demoDiagnosticBank,
  demoFacultyRoster,
  demoLearner,
  demoProjects,
  type CapstoneProject,
  type DiagnosticQuestion,
  type FacultyStudentSignal,
} from "@/lib/demo-data";
import { approvedInstitutionalTools } from "@/lib/mcp/catalog";
import { can, redactSensitiveInput } from "@/lib/security/policy";
import type { UserRole } from "@/lib/security/contracts";
import type { LearningState } from "@/lib/curriculum/types";
import type { ToolCallReceipt } from "@/lib/mcp/contracts";

export const workspaces = [
  "Overview",
  "Quiz Lab",
  "Study Planner",
  "Project Explorer",
  "Faculty View",
  "Institutional Tools",
] as const;

export type Workspace = (typeof workspaces)[number];

export type StudySession = {
  id: string;
  day: string;
  title: string;
  course: string;
  durationMinutes: number;
  status: "not-started" | "in-progress" | "completed";
  focusNotes: string;
  color: string;
};

const initialStudySchedule: StudySession[] = [
  { id: "s-1", day: "Thu", title: "Bayes diagnostic & prior formulation", course: "Applied Statistics", durationMinutes: 25, status: "in-progress", focusNotes: "Distinguish between prior probability P(H) and likelihood P(D|H)", color: "bg-[var(--coral)]" },
  { id: "s-2", day: "Fri", title: "Prior vs Likelihood worked examples", course: "Applied Statistics", durationMinutes: 45, status: "not-started", focusNotes: "Solve medical diagnostic base-rate problem and beta-binomial update", color: "bg-[var(--cobalt)]" },
  { id: "s-3", day: "Sat", title: "L1 vs L2 regularization lab", course: "Machine Learning", durationMinutes: 60, status: "not-started", focusNotes: "Plot parameter contour shrinkage on housing dataset", color: "bg-[var(--mint)]" },
  { id: "s-4", day: "Sun", title: "Distributed cache invalidation study", course: "Distributed Systems", durationMinutes: 40, status: "not-started", focusNotes: "Compare write-through vs write-back cache stampede mitigations", color: "bg-[var(--ink)]" },
  { id: "s-5", day: "Mon", title: "Capstone radar scoping", course: "BSc Project", durationMinutes: 50, status: "not-started", focusNotes: "Map required campus datasets from institutional MCP catalog", color: "bg-[var(--cobalt)]" },
];

export function AcademicWorkspaces({
  requestedWorkspace,
  onStatus,
  onAskQuestion,
  onMasteryChange,
  onMisconceptionResolved,
  onActivityLog,
  currentLearner,
}: {
  requestedWorkspace?: Workspace;
  onStatus?: (message: string) => void;
  onAskQuestion?: (prompt: string) => void;
  onMasteryChange?: (topicId: string, newMastery: number) => void;
  onMisconceptionResolved?: () => void;
  onActivityLog?: (title: string, meta: string, status: string, color: string) => void;
  currentLearner?: LearningState;
}) {
  const [workspace, setWorkspace] = useState<Workspace>(requestedWorkspace ?? "Overview");
  const [notice, setNotice] = useState("Choose a workspace to begin your active session.");
  const [activeSessionTopic, setActiveSessionTopic] = useState<string>("stats-bayes");

  useEffect(() => {
    if (requestedWorkspace) setWorkspace(requestedWorkspace);
  }, [requestedWorkspace]);

  function updateNotice(message: string) {
    setNotice(message);
    onStatus?.(message);
  }

  function handleStartDiagnostic(topicId = "stats-bayes") {
    setActiveSessionTopic(topicId);
    setWorkspace("Quiz Lab");
    updateNotice(`Loaded adaptive diagnostic for ${topicId === "stats-bayes" ? "Bayesian inference" : topicId}.`);
  }

  return (
    <section id="workspaces" className="mt-14 scroll-mt-6">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-1">
        <div className="flex gap-1 overflow-x-auto">
          {workspaces.map((item) => {
            const active = workspace === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setWorkspace(item);
                  updateNotice(`Switched to ${item} workspace.`);
                }}
                className={`whitespace-nowrap shrink-0 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  active
                    ? "border-[var(--cobalt)] text-[var(--cobalt)] font-bold"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="my-4 flex items-center justify-between rounded-xl bg-[var(--paper-deep)] px-4 py-3 text-xs text-[var(--muted)]"
        aria-live="polite"
      >
        <span className="truncate pr-4">{notice}</span>
        <span className="font-mono text-[10px] text-[var(--muted)] shrink-0 hidden sm:inline">
          Learner: {currentLearner?.program ?? "BSc Computer Science"}
        </span>
      </div>

      <div className="mt-6">
        {workspace === "Overview" && (
          <OverviewPanel
            onNavigate={(dest, topicId) => {
              if (topicId) handleStartDiagnostic(topicId);
              else setWorkspace(dest);
            }}
            onAskQuestion={onAskQuestion}
            onAction={updateNotice}
          />
        )}
        {workspace === "Quiz Lab" && (
          <QuizLabPanel
            initialTopicId={activeSessionTopic}
            onComplete={(score, total, topicId) => {
              const pct = Math.round((score / total) * 100);
              const masteryGain = Math.round(pct * 0.15);
              onMasteryChange?.(topicId, masteryGain);
              if (topicId === "stats-bayes" && score >= 4) {
                onMisconceptionResolved?.();
              }
              onActivityLog?.(
                `${topicId === "stats-bayes" ? "Bayesian inference" : "Regularization"} diagnostic`,
                "Just now",
                `${score}/${total} correct (${pct}%)`,
                score >= 4 ? "bg-[var(--mint)]" : "bg-[var(--coral)]"
              );
              updateNotice(`Diagnostic complete: scored ${score}/${total} (${pct}%). Mastery updated.`);
            }}
            onAskForHelp={(prompt) => {
              onAskQuestion?.(prompt);
              updateNotice(`Sent diagnostic question to CampusGenie.`);
            }}
          />
        )}
        {workspace === "Study Planner" && (
          <StudyPlannerPanel
            onActivityLog={onActivityLog}
            onAction={updateNotice}
            onAskQuestion={onAskQuestion}
          />
        )}
        {workspace === "Project Explorer" && (
          <ProjectExplorerPanel
            onAction={updateNotice}
            onActivityLog={onActivityLog}
            onAskQuestion={onAskQuestion}
          />
        )}
        {workspace === "Faculty View" && (
          <FacultyViewPanel
            onAction={updateNotice}
            onAskQuestion={onAskQuestion}
          />
        )}
        {workspace === "Institutional Tools" && (
          <InstitutionalToolsPanel
            onAction={updateNotice}
            onActivityLog={onActivityLog}
          />
        )}
      </div>
    </section>
  );
}

/* =========================================================================
   1. OVERVIEW PANEL
   ========================================================================= */
function OverviewPanel({
  onNavigate,
  onAskQuestion,
  onAction,
}: {
  onNavigate: (workspace: Workspace, topicId?: string) => void;
  onAskQuestion?: (prompt: string) => void;
  onAction: (message: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div
          onClick={() => {
            onAction("Loaded Bayesian diagnostic in Quiz Lab.");
            onNavigate("Quiz Lab", "stats-bayes");
          }}
          className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white/60 p-6 transition hover:-translate-y-0.5 hover:border-[var(--cobalt)] shadow-xs"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--paper-deep)] text-[var(--coral)]">
            <Sparkles size={20} />
          </div>
          <h3 className="mt-5 font-display text-2xl">Active Diagnostic</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Target your active misconception: Prior probability vs Likelihood in Bayesian inference.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--cobalt)]">
            Start 5-question check <ArrowRight size={14} />
          </div>
        </div>

        <div
          onClick={() => {
            onAction("Opening Adaptive Study Planner.");
            onNavigate("Study Planner");
          }}
          className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white/60 p-6 transition hover:-translate-y-0.5 hover:border-[var(--cobalt)] shadow-xs"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--paper-deep)] text-[var(--cobalt)]">
            <Clock size={20} />
          </div>
          <h3 className="mt-5 font-display text-2xl">Adaptive Schedule</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            4 scheduled study blocks paced around your lowest confidence outcomes and deadlines.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--cobalt)]">
            View 7-day plan <ArrowRight size={14} />
          </div>
        </div>

        <div
          onClick={() => {
            onAction("Opening Project Explorer.");
            onNavigate("Project Explorer");
          }}
          className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white/60 p-6 transition hover:-translate-y-0.5 hover:border-[var(--cobalt)] shadow-xs"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--paper-deep)] text-[var(--mint)]">
            <FlaskConical size={20} className="text-[var(--ink)]" />
          </div>
          <h3 className="mt-5 font-display text-2xl">Project Radar</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Curated capstone blueprints mapped to your Python and systems strengths.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--cobalt)]">
            Explore blueprints <ArrowRight size={14} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white/50 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Term 4 Curriculum
            </span>
            <h3 className="mt-1 font-display text-2xl">Active Course Learning Signals</h3>
          </div>
          <button
            onClick={() => onNavigate("Institutional Tools")}
            className="flex items-center gap-2 self-start rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--cobalt)]"
          >
            <Library size={14} className="text-[var(--cobalt)]" />
            Inspect MCP connectors
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--line)] bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Applied Statistics</span>
              <span className="font-mono text-xs text-[var(--coral)]">61% mastery</span>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">Focus: Bayesian Parameter Estimation</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onNavigate("Quiz Lab", "stats-bayes")}
                className="rounded-lg bg-[var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--cobalt)]"
              >
                Practice Bayes
              </button>
              <button
                onClick={() => onAskQuestion?.("Explain how prior distribution affects posterior in Bayesian statistics")}
                className="text-[11px] text-[var(--cobalt)] hover:underline"
              >
                Ask Genie
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Machine Learning</span>
              <span className="font-mono text-xs text-[var(--cobalt)]">78% mastery</span>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">Focus: L1/L2 Regularization Tradeoffs</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onNavigate("Quiz Lab", "ml-regularization")}
                className="rounded-lg bg-[var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--cobalt)]"
              >
                Practice ML
              </button>
              <button
                onClick={() => onAskQuestion?.("Why does L1 regularization cause weight sparsity compared to L2?")}
                className="text-[11px] text-[var(--cobalt)] hover:underline"
              >
                Ask Genie
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Distributed Systems</span>
              <span className="font-mono text-xs text-[var(--muted)]">44% mastery</span>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">Focus: Cache Invalidation & Stampedes</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onNavigate("Quiz Lab", "systems-caching")}
                className="rounded-lg bg-[var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--cobalt)]"
              >
                Practice Cache
              </button>
              <button
                onClick={() => onAskQuestion?.("Explain the Cache Stampede problem and how to mitigate it")}
                className="text-[11px] text-[var(--cobalt)] hover:underline"
              >
                Ask Genie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. QUIZ LAB PANEL (Adaptive Diagnostic Engine)
   ========================================================================= */
function QuizLabPanel({
  initialTopicId = "stats-bayes",
  onComplete,
  onAskForHelp,
}: {
  initialTopicId?: string;
  onComplete?: (score: number, total: number, topicId: string) => void;
  onAskForHelp?: (prompt: string) => void;
}) {
  const [topicId, setTopicId] = useState<string>(initialTopicId);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>(
    demoDiagnosticBank[initialTopicId] || demoDiagnosticBank["stats-bayes"]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  useEffect(() => {
    if (initialTopicId && demoDiagnosticBank[initialTopicId]) {
      setTopicId(initialTopicId);
      setQuestions(demoDiagnosticBank[initialTopicId]);
      resetQuiz();
    }
  }, [initialTopicId]);

  function switchTopic(newTopicId: string) {
    setTopicId(newTopicId);
    setQuestions(demoDiagnosticBank[newTopicId] || demoDiagnosticBank["stats-bayes"]);
    resetQuiz();
  }

  function resetQuiz() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
  }

  function submitCurrentAnswer() {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === questions[currentIndex].correctIndex;
    if (isCorrect) setScore((prev) => prev + 1);
  }

  function handleNextQuestion() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      const finalScore = score + (selectedOption === questions[currentIndex].correctIndex ? 1 : 0);
      onComplete?.(finalScore, questions.length, topicId);
    }
  }

  async function generateAiPracticeQuestions() {
    setIsGeneratingAiQuiz(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate 3 multiple-choice diagnostic questions for topic: ${topicId}. Follow academic rigor with clear options and explanation.`,
          intent: "quiz",
          learner: demoLearner,
        }),
      });
      const data = await response.json();
      if (data.answer) {
        // Appends to practice queue or offers immediate insight
        onAskForHelp?.(`Generated custom practice questions from Gemini:\n\n${data.answer}`);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  }

  const currentQ = questions[currentIndex] || questions[0];

  return (
    <div className="space-y-6">
      {/* Topic Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/40 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => switchTopic("stats-bayes")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              topicId === "stats-bayes"
                ? "bg-[var(--ink)] text-white"
                : "bg-white text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Bayesian Inference (Active Misconception)
          </button>
          <button
            onClick={() => switchTopic("ml-regularization")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              topicId === "ml-regularization"
                ? "bg-[var(--ink)] text-white"
                : "bg-white text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Regularization & Loss
          </button>
          <button
            onClick={() => switchTopic("systems-caching")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              topicId === "systems-caching"
                ? "bg-[var(--ink)] text-white"
                : "bg-white text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Distributed Caching
          </button>
        </div>

        <button
          onClick={generateAiPracticeQuestions}
          disabled={isGeneratingAiQuiz}
          className="flex items-center gap-2 rounded-full border border-[var(--cobalt)] px-3 py-1.5 text-xs font-semibold text-[var(--cobalt)] transition hover:bg-[var(--cobalt)] hover:text-white disabled:opacity-50"
        >
          <Sparkles size={14} />
          {isGeneratingAiQuiz ? "Synthesizing with Gemini..." : "Generate AI Practice"}
        </button>
      </div>

      {!isQuizCompleted ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          {/* Active Question Box */}
          <div className="rounded-2xl bg-[var(--ink)] p-6 text-white sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--mint)]">
                Question {currentIndex + 1} of {questions.length} · {currentQ.topicName}
              </span>
              <span className="font-mono text-xs text-white/50">
                Score: {score}/{currentIndex}
              </span>
            </div>

            <h3 className="mt-6 font-display text-2xl leading-snug sm:text-3xl">
              {currentQ.question}
            </h3>

            {/* Answer Options */}
            <div className="mt-8 space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let optionStyle = "border-white/15 hover:border-[var(--mint)]";

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    optionStyle = "border-[var(--mint)] bg-[var(--mint)]/20 text-white font-medium";
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "border-[var(--coral)] bg-[var(--coral)]/20 text-white";
                  } else {
                    optionStyle = "border-white/10 opacity-50";
                  }
                } else if (isSelected) {
                  optionStyle = "border-[var(--mint)] bg-white/10";
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(idx)}
                    className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left text-sm transition ${optionStyle}`}
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit or Next Controls */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
              {!isAnswerSubmitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={submitCurrentAnswer}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mint)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 rounded-full bg-[var(--mint)] px-6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
                >
                  {currentIndex + 1 < questions.length ? "Next Question" : "See Final Score"}
                  <ArrowRight size={16} />
                </button>
              )}

              {isAnswerSubmitted && selectedOption !== currentQ.correctIndex && (
                <button
                  onClick={() =>
                    onAskForHelp?.(
                      `I got this question wrong: "${currentQ.question}". Why is "${
                        currentQ.options[currentQ.correctIndex]
                      }" the correct answer over "${currentQ.options[selectedOption ?? 0]}"?`
                    )
                  }
                  className="text-xs text-[var(--mint)] hover:underline flex items-center gap-1"
                >
                  <HelpCircle size={14} />
                  Ask CampusGenie to explain why
                </button>
              )}
            </div>
          </div>

          {/* Explanation & Evidence Ledger Context */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Curriculum Rationale
              </span>
              <h4 className="mt-2 font-display text-xl">Diagnostic Evidence Trail</h4>

              {isAnswerSubmitted ? (
                <div className="mt-4 space-y-4 text-sm leading-6">
                  <div
                    className={`rounded-xl p-4 ${
                      selectedOption === currentQ.correctIndex
                        ? "bg-[var(--mint)]/20 text-emerald-900 border border-[var(--mint)]/40"
                        : "bg-[var(--coral)]/15 text-rose-950 border border-[var(--coral)]/30"
                    }`}
                  >
                    <p className="font-semibold">
                      {selectedOption === currentQ.correctIndex
                        ? "Correct answer!"
                        : "Not quite."}
                    </p>
                    <p className="mt-2 text-xs leading-5">{currentQ.explanation}</p>
                  </div>

                  {currentQ.misconceptionTarget && (
                    <div className="flex items-start gap-2 text-xs text-[var(--muted)]">
                      <AlertCircle size={15} className="mt-0.5 shrink-0 text-[var(--coral)]" />
                      <span>Addresses misconception: {currentQ.misconceptionTarget}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-xs leading-6 text-[var(--muted)]">
                  <p>
                    Choose an option to evaluate your model. Each diagnostic question evaluates whether
                    your mental model matches curriculum evidence before the upcoming term assessment.
                  </p>
                  <div className="mt-4 border-t border-[var(--line)] pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2 size={14} className="text-[var(--cobalt)]" />
                      Course outcome: STAT-301 · Bayesian Parameter Estimation
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2 size={14} className="text-[var(--cobalt)]" />
                      Authority source: Statistics Lab Workshop 2026.2
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Adaptive Diagnostic Chain */}
            <div className="rounded-2xl border border-[var(--line)] bg-white/40 p-5 text-xs text-[var(--muted)]">
              <span className="font-mono text-[10px] uppercase tracking-wider">Adaptive Chain</span>
              <div className="mt-3 space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      idx === currentIndex
                        ? "bg-[var(--ink)] text-white"
                        : idx < currentIndex
                        ? "bg-[var(--paper-deep)] text-[var(--ink)]"
                        : "opacity-40"
                    }`}
                  >
                    <span className="truncate pr-2">
                      0{idx + 1}. {q.question.slice(0, 36)}...
                    </span>
                    <span className="font-mono text-[10px]">
                      {idx < currentIndex ? "Done" : idx === currentIndex ? "Current" : "Queued"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Complete Screen */
        <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-8 text-center sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--ink)]">
            <Award size={32} />
          </div>
          <span className="mt-5 inline-block font-mono text-xs uppercase tracking-wider text-[var(--cobalt)]">
            Diagnostic Completed
          </span>
          <h3 className="mt-2 font-display text-4xl">
            You scored {score} of {questions.length}
          </h3>
          <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[var(--muted)]">
            {score >= 4
              ? "Great mastery! Your understanding of the prior vs likelihood distinction is verified. Your term mastery signal has been boosted."
              : "Good effort! We pinpointed subtle conceptual areas. CampusGenie has queued worked examples to address the remaining gaps."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 rounded-full border border-[var(--ink)] px-5 py-2.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white"
            >
              <RotateCcw size={14} />
              Retake Diagnostic
            </button>
            <button
              onClick={() =>
                onAskForHelp?.(
                  `I just scored ${score}/${questions.length} on ${currentQ.topicName}. Provide one concrete summary showing what I need to review.`
                )
              }
              className="flex items-center gap-2 rounded-full bg-[var(--cobalt)] px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Sparkles size={14} />
              Review with CampusGenie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. STUDY PLANNER PANEL (Adaptive Schedule & Pomodoro Timer)
   ========================================================================= */
function StudyPlannerPanel({
  onActivityLog,
  onAction,
  onAskQuestion,
}: {
  onActivityLog?: (title: string, meta: string, status: string, color: string) => void;
  onAction: (message: string) => void;
  onAskQuestion?: (prompt: string) => void;
}) {
  const [sessions, setSessions] = useState<StudySession[]>(initialStudySchedule);
  const [activeTimerSession, setActiveTimerSession] = useState<StudySession | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAiGeneratingPlan, setIsAiGeneratingPlan] = useState(false);
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("Applied Statistics");
  const [newDuration, setNewDuration] = useState("30");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  function startTimerForSession(session: StudySession) {
    setActiveTimerSession(session);
    setTimerSecondsLeft(session.durationMinutes * 60);
    setIsTimerRunning(true);
    onAction(`Started study session: ${session.title} (${session.durationMinutes} min).`);
  }

  function completeSession(id: string) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          onActivityLog?.(
            `Study block: ${s.title}`,
            "Just now",
            `${s.durationMinutes} min completed`,
            "bg-[var(--cobalt)]"
          );
          return { ...s, status: "completed" };
        }
        return s;
      })
    );
    onAction("Study session completed and recorded to term log.");
  }

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function generateAiStudyPlan() {
    setIsAiGeneratingPlan(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Generate a targeted 7-day adaptive study block plan for my active courses.",
          intent: "study-plan",
          learner: demoLearner,
        }),
      });
      const data = await response.json();
      if (data.answer) {
        onAskQuestion?.(`Generated Adaptive 7-Day Study Strategy:\n\n${data.answer}`);
        onAction("Adaptive study recommendations injected into Assistant queue.");
      }
    } catch {
      onAction("Could not refresh plan from network.");
    } finally {
      setIsAiGeneratingPlan(false);
    }
  }

  function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newBlock: StudySession = {
      id: `s-custom-${Date.now()}`,
      day: "Today",
      title: newTitle,
      course: newCourse,
      durationMinutes: parseInt(newDuration, 10) || 30,
      status: "not-started",
      focusNotes: "Custom study block created by student.",
      color: "bg-[var(--mint)]",
    };
    setSessions((prev) => [newBlock, ...prev]);
    setNewTitle("");
    setShowAddModal(false);
    onAction(`Added study block: ${newBlock.title}`);
  }

  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const filteredSessions = sessions.filter((s) => {
    if (filter === "completed") return s.status === "completed";
    if (filter === "in-progress") return s.status !== "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/40 p-6 sm:flex-row sm:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Adaptive Schedule
          </span>
          <h3 className="mt-1 font-display text-3xl">Active Study Blocks</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {completedCount} of {sessions.length} study sessions completed this week
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex rounded-lg border border-[var(--line)] bg-white p-1 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "all" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("in-progress")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "in-progress" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "completed" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
          >
            <Plus size={14} /> Add Block
          </button>

          <button
            onClick={generateAiStudyPlan}
            disabled={isAiGeneratingPlan}
            className="flex items-center gap-1.5 rounded-full bg-[var(--cobalt)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isAiGeneratingPlan ? "Optimizing..." : "AI Plan Optimization"}
          </button>
        </div>
      </div>

      {/* Active Focus Timer Bar */}
      {activeTimerSession && (
        <div className="rounded-2xl bg-[var(--ink)] p-5 text-white shadow-md flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--mint)]">
              Focus Timer Active
            </span>
            <h4 className="font-display text-xl">{activeTimerSession.title}</h4>
            <p className="text-xs text-white/60">{activeTimerSession.course}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-3xl font-bold tracking-tight text-[var(--mint)]">
              {formatTime(timerSecondsLeft)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--ink)] hover:bg-[var(--mint)]"
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  completeSession(activeTimerSession.id);
                  setActiveTimerSession(null);
                }}
                className="rounded-full bg-[var(--mint)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
              >
                Mark Done
              </button>
              <button
                onClick={() => setActiveTimerSession(null)}
                className="text-xs text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Study Session Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session) => {
          const isDone = session.status === "completed";
          const isActive = activeTimerSession?.id === session.id;

          return (
            <div
              key={session.id}
              className={`rounded-2xl border p-5 transition ${
                isDone
                  ? "border-[var(--line)] bg-white/30 opacity-75"
                  : isActive
                  ? "border-[var(--cobalt)] bg-white shadow-md ring-2 ring-[var(--cobalt)]/20"
                  : "border-[var(--line)] bg-white/60 hover:-translate-y-0.5 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                  {session.day} · {session.durationMinutes} min
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isDone
                      ? "bg-[var(--mint)] text-emerald-900"
                      : "bg-[var(--paper-deep)] text-[var(--muted)]"
                  }`}
                >
                  {isDone ? "Completed" : "Scheduled"}
                </span>
              </div>

              <h4 className="mt-4 font-display text-lg font-semibold">{session.title}</h4>
              <p className="mt-1 text-xs text-[var(--muted)]">{session.course}</p>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)] line-clamp-2">
                {session.focusNotes}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3">
                {!isDone ? (
                  <button
                    onClick={() => startTimerForSession(session)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cobalt)] hover:underline"
                  >
                    <Play size={13} /> Start Focus Timer
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Check size={14} /> Finished
                  </span>
                )}

                {!isDone && (
                  <button
                    onClick={() => completeSession(session.id)}
                    className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-display text-xl">Schedule Study Block</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSession} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--muted)]">Topic or Focus</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Beta-Binomial conjugate analysis"
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm outline-none focus:border-[var(--cobalt)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--muted)]">Course</label>
                <select
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm outline-none focus:border-[var(--cobalt)]"
                >
                  <option value="Applied Statistics">Applied Statistics (STAT-301)</option>
                  <option value="Machine Learning">Machine Learning (CS-402)</option>
                  <option value="Distributed Systems">Distributed Systems (CS-410)</option>
                  <option value="BSc Capstone">BSc Capstone Project</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--muted)]">Planned Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm outline-none focus:border-[var(--cobalt)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--cobalt)]"
                >
                  Save Study Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. PROJECT EXPLORER PANEL (Capstone Radar & Scoper)
   ========================================================================= */
function ProjectExplorerPanel({
  onAction,
  onActivityLog,
  onAskQuestion,
}: {
  onAction: (message: string) => void;
  onActivityLog?: (title: string, meta: string, status: string, color: string) => void;
  onAskQuestion?: (prompt: string) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedBlueprint, setSelectedBlueprint] = useState<CapstoneProject | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(["proj-energy"]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  function toggleShortlist(proj: CapstoneProject) {
    const isAlready = shortlistedIds.includes(proj.id);
    if (isAlready) {
      setShortlistedIds((prev) => prev.filter((id) => id !== proj.id));
      onAction(`Removed ${proj.title} from shortlist.`);
    } else {
      setShortlistedIds((prev) => [...prev, proj.id]);
      onActivityLog?.(`Shortlisted project: ${proj.title}`, "Just now", `${proj.fitScore}`, "bg-[var(--cobalt)]");
      onAction(`Added ${proj.title} to your capstone radar shortlist.`);
    }
  }

  async function handleSynthesizeCustomCapstone(e: React.FormEvent) {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setIsSynthesizing(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Synthesize a detailed academic project blueprint for this student interest: "${customPrompt}". Align with BSc Computer Science curriculum and active statistical/systems foundations.`,
          intent: "project",
          learner: demoLearner,
        }),
      });
      const data = await response.json();
      if (data.answer) {
        onAskQuestion?.(`Generated Custom Capstone Architecture:\n\n${data.answer}`);
        onAction("Custom capstone blueprint synthesized by Gemini.");
      }
    } catch {
      onAction("Project synthesis request timed out.");
    } finally {
      setIsSynthesizing(false);
      setCustomPrompt("");
    }
  }

  const filteredProjects = demoProjects.filter((p) => {
    if (categoryFilter === "All") return true;
    return p.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Category Filter */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/40 p-6 sm:flex-row sm:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Project Radar
          </span>
          <h3 className="mt-1 font-display text-3xl">Capstone Blueprints</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Mapped directly to your skill graph and institutional datasets
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {["All", "Data & AI", "Systems & Cloud", "Product & HCI"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                categoryFilter === cat
                  ? "bg-[var(--ink)] text-white"
                  : "bg-white text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Custom Capstone Scoper */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
        <form onSubmit={handleSynthesizeCustomCapstone} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Have a custom idea? e.g. An automated EEG sleep stage analyzer with Bayesian priors..."
            className="flex-1 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs outline-none focus:border-[var(--cobalt)]"
          />
          <button
            type="submit"
            disabled={isSynthesizing || !customPrompt.trim()}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--cobalt)] disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isSynthesizing ? "Synthesizing with Gemini..." : "Synthesize Spec"}
          </button>
        </form>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {filteredProjects.map((project) => {
          const isShortlisted = shortlistedIds.includes(project.id);
          return (
            <article
              key={project.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-white/70 p-6 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--cobalt)] font-semibold">
                    {project.fitScore}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {project.difficulty} · {project.estimatedWeeks} weeks
                  </span>
                </div>

                <h4 className="mt-4 font-display text-2xl leading-snug">{project.title}</h4>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{project.reason}</p>

                {/* Tech Stack tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md bg-[var(--paper-deep)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <button
                  onClick={() => setSelectedBlueprint(project)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cobalt)] hover:underline"
                >
                  <FileText size={14} /> View Blueprint
                </button>

                <button
                  onClick={() => toggleShortlist(project)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    isShortlisted
                      ? "bg-[var(--mint)] text-emerald-950"
                      : "bg-[var(--ink)] text-white hover:bg-[var(--cobalt)]"
                  }`}
                >
                  {isShortlisted ? "Shortlisted ✓" : "Shortlist"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Blueprint Detail Modal */}
      {selectedBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/30 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
              <div>
                <span className="font-mono text-xs text-[var(--cobalt)]">
                  {selectedBlueprint.category} · {selectedBlueprint.fitScore}
                </span>
                <h3 className="mt-1 font-display text-2xl sm:text-3xl">
                  {selectedBlueprint.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--paper-deep)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <div>
                <h5 className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider font-mono">
                  Academic Blueprint & Architecture
                </h5>
                <p className="mt-1 leading-6">{selectedBlueprint.detailedBlueprint}</p>
              </div>

              <div>
                <h5 className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider font-mono">
                  Approved Institutional Dataset
                </h5>
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-[var(--paper-deep)] p-3 font-mono text-xs text-[var(--ink)]">
                  <Library size={16} className="text-[var(--cobalt)]" />
                  {selectedBlueprint.mcpDataset}
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider font-mono">
                  Implementation Milestones
                </h5>
                <div className="mt-2 space-y-2">
                  {selectedBlueprint.milestones.map((ms, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs leading-5">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--cobalt)]" />
                      <span>{ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-[var(--line)] pt-4">
              <button
                onClick={() =>
                  onAskQuestion?.(
                    `Let's break down the technical architecture for the capstone project "${selectedBlueprint.title}". How should I structure the code repository and dataset ingestion?`
                  )
                }
                className="flex items-center gap-1.5 rounded-full border border-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                <Sparkles size={14} /> Discuss in Assistant
              </button>
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--cobalt)]"
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. FACULTY VIEW PANEL (Intervention Engine & Course Health)
   ========================================================================= */
function FacultyViewPanel({
  onAction,
  onAskQuestion,
}: {
  onAction: (message: string) => void;
  onAskQuestion?: (prompt: string) => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState("All");
  const studentRoster = demoFacultyRoster;
  const [activeInterventionStudent, setActiveInterventionStudent] = useState<FacultyStudentSignal | null>(null);
  const [draftedEmail, setDraftedEmail] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateIntervention(student: FacultyStudentSignal) {
    setActiveInterventionStudent(student);
    setIsDrafting(true);
    setDraftedEmail("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Draft a supportive faculty intervention email from Professor to student ${student.name} in course ${student.course}. Student has active misconception: "${student.activeMisconception}". Recommend review and offer office hours. Keep it constructive and under 150 words.`,
          intent: "explain",
          learner: demoLearner,
        }),
      });
      const data = await response.json();
      setDraftedEmail(
        data.answer ||
          `Dear ${student.name},\n\nI noticed on your recent diagnostic that you're working through the distinction between prior probability and likelihood in Bayesian inference. This is one of the most common hurdles in statistical reasoning!\n\nI recommend reviewing the worked examples in Week 5 lab and trying the 3-question diagnostic. Let me know if you would like to go over it in office hours on Friday.\n\nBest regards,\nCourse Instructor`
      );
      onAction(`Generated faculty intervention note for ${student.name}.`);
    } catch {
      setDraftedEmail(`Dear ${student.name},\n\nPlease review your recent diagnostic notes before Friday's lab.`);
    } finally {
      setIsDrafting(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(draftedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onAction("Intervention note copied to clipboard.");
  }

  const filteredRoster = studentRoster.filter((s) => {
    if (selectedCourse === "All") return true;
    return s.course.includes(selectedCourse);
  });

  return (
    <div className="space-y-6">
      {/* Faculty Cohort Snapshot Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/40 p-6 sm:flex-row sm:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Instructor Console
          </span>
          <h3 className="mt-1 font-display text-3xl">Cohort Diagnostic Matrix</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Active monitoring across 142 enrolled students in Computer Science
          </p>
        </div>

        <div className="flex gap-2">
          {["All", "STAT-301", "CS-402", "CS-410"].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCourse(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedCourse === c
                  ? "bg-[var(--ink)] text-white"
                  : "bg-white text-[var(--muted)] border border-[var(--line)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs text-[var(--muted)]">Outcome Coverage</p>
          <p className="mt-2 font-display text-4xl">84%</p>
          <p className="mt-1 text-[11px] text-emerald-700">↑ 6% higher than Term 3 baseline</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs text-[var(--muted)]">Diagnostic Activity</p>
          <p className="mt-2 font-display text-4xl">72%</p>
          <p className="mt-1 text-[11px] text-[var(--cobalt)]">102 students completed checks this week</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs text-[var(--muted)]">Intervention Queue</p>
          <p className="mt-2 font-display text-4xl text-[var(--coral)]">2</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Students with active misconceptions</p>
        </div>
      </div>

      {/* Student Intervention Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/70">
        <div className="border-b border-[var(--line)] p-4 sm:px-6">
          <h4 className="font-display text-xl">At-Risk Student Signals</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-[var(--paper-deep)] text-[var(--muted)] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4 sm:px-6">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Mastery</th>
                <th className="p-4">Flagged Signal</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredRoster.map((student) => (
                <tr key={student.id} className="hover:bg-white/60">
                  <td className="p-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--coral)] font-display text-xs text-white">
                        {student.avatar}
                      </div>
                      <span className="font-semibold text-sm">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--muted)]">{student.course}</td>
                  <td className="p-4 font-mono font-semibold">{student.masteryAvg}%</td>
                  <td className="p-4">
                    {student.activeMisconception ? (
                      <span className="text-[var(--coral)] font-medium">
                        {student.activeMisconception}
                      </span>
                    ) : (
                      <span className="text-emerald-700">None detected</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => generateIntervention(student)}
                      className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[var(--cobalt)]"
                    >
                      Draft Intervention
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intervention Email Modal */}
      {activeInterventionStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h4 className="font-display text-xl">Faculty Intervention Email</h4>
                <p className="text-xs text-[var(--muted)]">Recipient: {activeInterventionStudent.name}</p>
              </div>
              <button onClick={() => setActiveInterventionStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              {isDrafting ? (
                <div className="py-12 text-center text-xs text-[var(--cobalt)]">
                  <Sparkles size={20} className="mx-auto animate-pulse" />
                  <p className="mt-2">Synthesizing personalized intervention with Gemini...</p>
                </div>
              ) : (
                <textarea
                  rows={8}
                  value={draftedEmail}
                  onChange={(e) => setDraftedEmail(e.target.value)}
                  className="w-full resize-none rounded-xl border border-[var(--line)] p-4 text-xs leading-relaxed outline-none focus:border-[var(--cobalt)]"
                />
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--line)] pt-3">
              <button
                onClick={() => {
                  const student = activeInterventionStudent;
                  setActiveInterventionStudent(null);
                  onAskQuestion?.(`Help me refine this pedagogical intervention for ${student.name} who is struggling with "${student.activeMisconception}":\n\n${draftedEmail}`);
                }}
                className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
              >
                Refine with Genie
              </button>
              <button
                onClick={copyToClipboard}
                disabled={isDrafting}
                className="flex items-center gap-1.5 rounded-full border border-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Email"}
              </button>
              <button
                onClick={() => {
                  onAction(`Intervention sent to ${activeInterventionStudent.name}'s LMS inbox.`);
                  setActiveInterventionStudent(null);
                }}
                className="rounded-full bg-[var(--cobalt)] px-5 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Send via LMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. INSTITUTIONAL TOOLS PANEL (Live MCP Gateway & Audit Trail)
   ========================================================================= */
function InstitutionalToolsPanel({
  onAction,
  onActivityLog,
}: {
  onAction: (message: string) => void;
  onActivityLog?: (title: string, meta: string, status: string, color: string) => void;
}) {
  const [ssoConnected, setSsoConnected] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [selectedTool, setSelectedTool] = useState(approvedInstitutionalTools[0].name);
  const [toolParamInput, setToolParamInput] = useState('{"studentId": "CU-2026-9104", "term": 4}');
  const [lastReceipt, setLastReceipt] = useState<ToolCallReceipt | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [auditLog, setAuditLog] = useState<ToolCallReceipt[]>([
    {
      tool: "lms.course_context",
      system: "lms",
      authorized: true,
      resultSummary: "Retrieved enrolled modules: STAT-301, CS-402, CS-410",
      timestamp: "Today, 10:42 AM",
    },
    {
      tool: "library.search",
      system: "library",
      authorized: true,
      resultSummary: "Retrieved 12 reading list citations for Bayesian inference",
      timestamp: "Oct 27, 2026",
    },
  ]);

  function executeToolCall() {
    setIsExecuting(true);
    setTimeout(() => {
      let parsedInput: Record<string, unknown> = {};
      try {
        parsedInput = JSON.parse(toolParamInput);
      } catch {
        parsedInput = { raw: toolParamInput };
      }

      // Check permission policy
      const isAllowed = can(userRole, "read");
      const sanitized = redactSensitiveInput(parsedInput);
      const paramKeys = Object.keys(sanitized).join(", ");

      let resultSummary = "";
      if (!ssoConnected) {
        resultSummary = "REJECTED: Institutional SSO session required.";
      } else if (!isAllowed) {
        resultSummary = `FORBIDDEN: Role '${userRole}' lacks permission for tool '${selectedTool}'.`;
      } else {
        if (selectedTool === "lms.course_context") {
          resultSummary = `SUCCESS: Loaded 3 active courses, 6 upcoming deliverables, 2 syllabus revisions (Params: ${paramKeys}).`;
        } else if (selectedTool === "library.search") {
          resultSummary = `SUCCESS: Found 18 peer-reviewed IEEE papers & Bishop Pattern Recognition e-book (Params: ${paramKeys}).`;
        } else if (selectedTool === "timetable.upcoming") {
          resultSummary = `SUCCESS: Scheduled Applied Statistics Lecture Fri 09:00 AM, ML Lab Sat 02:00 PM (Params: ${paramKeys}).`;
        } else if (selectedTool === "assignments.status") {
          resultSummary = `SUCCESS: Lab 5 Bayesian inference due Friday Oct 30; grading rubric loaded (Params: ${paramKeys}).`;
        } else {
          resultSummary = `SUCCESS: Campus smart meter telemetry dataset (82MB parquet) authorized for capstone (Params: ${paramKeys}).`;
        }
      }

      const receipt: ToolCallReceipt = {
        tool: selectedTool,
        system: "lms",
        authorized: ssoConnected && isAllowed,
        resultSummary,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setLastReceipt(receipt);
      setAuditLog((prev) => [receipt, ...prev]);
      onActivityLog?.(
        `MCP tool: ${selectedTool}`,
        receipt.timestamp,
        receipt.authorized ? "Authorized" : "Denied",
        receipt.authorized ? "bg-[var(--mint)]" : "bg-[var(--coral)]"
      );
      onAction(`Tool call executed: ${selectedTool} (${receipt.authorized ? "Authorized" : "Blocked"}).`);
      setIsExecuting(false);
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* SSO Status Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/40 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl text-white ${
              ssoConnected ? "bg-[var(--mint)] text-[var(--ink)]" : "bg-[var(--coral)]"
            }`}
          >
            {ssoConnected ? <Unlock size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h4 className="font-display text-xl">
              {ssoConnected ? "Institutional SSO Authenticated" : "SSO Disconnected"}
            </h4>
            <p className="text-xs text-[var(--muted)]">
              {ssoConnected
                ? "Identity token verified: CU-STUDENT-2026-9104 (Chandigarh University CU-LMS / CUIMS)"
                : "Connect to access institutional gradebooks and private syllabi."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold outline-none"
          >
            <option value="student">Role: Student (Read only)</option>
            <option value="faculty">Role: Faculty (Read + Grade)</option>
            <option value="administrator">Role: Admin (Full access)</option>
          </select>

          <button
            onClick={() => {
              setSsoConnected((prev) => !prev);
              onAction(ssoConnected ? "Disconnected SSO session." : "Reconnected SSO session.");
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              ssoConnected
                ? "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--paper-deep)]"
                : "bg-[var(--ink)] text-white hover:bg-[var(--cobalt)]"
            }`}
          >
            {ssoConnected ? "Disconnect" : "Connect SSO"}
          </button>
        </div>
      </div>

      {/* Tool Runner Sandbox */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            MCP Tool Invocation Sandbox
          </span>
          <h4 className="mt-1 font-display text-2xl">Execute Academic MCP Request</h4>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Target MCP Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-2.5 text-xs font-mono outline-none focus:border-[var(--cobalt)]"
              >
                {approvedInstitutionalTools.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.system})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Parameters (JSON with Sensitive Key Redaction)
              </label>
              <textarea
                rows={4}
                value={toolParamInput}
                onChange={(e) => setToolParamInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 font-mono text-xs outline-none focus:border-[var(--cobalt)]"
              />
            </div>

            <button
              onClick={executeToolCall}
              disabled={isExecuting}
              className="w-full rounded-xl bg-[var(--ink)] py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--cobalt)] disabled:opacity-50"
            >
              {isExecuting ? "Executing with Policy Check..." : "Execute MCP Tool Call"}
            </button>
          </div>

          {lastReceipt && (
            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] p-4 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--ink)]">Receipt: {lastReceipt.tool}</span>
                <span className={lastReceipt.authorized ? "text-emerald-700" : "text-rose-700"}>
                  {lastReceipt.authorized ? "● Authorized" : "▲ Denied"}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5">{lastReceipt.resultSummary}</p>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Security & Audit Ledger
          </span>
          <h4 className="mt-1 font-display text-2xl">Verified Receipts</h4>

          <div className="mt-4 space-y-2">
            {auditLog.map((log, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--line)] bg-white/80 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[var(--ink)]">{log.tool}</span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">{log.timestamp}</span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{log.resultSummary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
