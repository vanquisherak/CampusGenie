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
  Target,
  Unlock,
  X,
  Youtube,
  BookOpen,
  GraduationCap,
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
import { BioscienceStudio } from "@/components/BioscienceStudio";
import { auth, saveDiagnosticAttempt, saveStudyBlock } from "@/lib/firebase";
import {
  INITIAL_STUDY_SESSIONS,
  PRESET_BLUEPRINTS,
  type StudySession,
  type SubjectBlueprint,
} from "@/lib/blueprints-data";
import { SubjectBlueprintModal } from "@/components/SubjectBlueprintModal";
import { CuimsPortalHub } from "@/components/CuimsPortalHub";

export const workspaces = [
  "Overview",
  "CUIMS Student Hub",
  "Quiz Lab",
  "Study Planner",
  "Project Explorer",
  "Bioscience Studio",
  "Faculty View",
  "Institutional Tools",
] as const;

export type Workspace = (typeof workspaces)[number];
export type { StudySession };

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
    <section id="workspaces" className="mt-14 scroll-mt-8">
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
        <div className="flex gap-1.5 overflow-x-auto p-1 bg-stone-100/70 rounded-2xl border border-stone-200/60">
          {workspaces.map((item) => {
            const active = workspace === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setWorkspace(item);
                  updateNotice(`Switched to ${item} workspace.`);
                }}
                className={`whitespace-nowrap shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-white text-slate-900 shadow-xs border border-stone-200/80 font-bold"
                    : "text-stone-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="my-4 flex items-center justify-between rounded-2xl bg-white/70 border border-stone-200/70 px-4 py-3 text-xs text-stone-600 shadow-xs"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 truncate pr-4">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
          <span className="truncate">{notice}</span>
        </div>
        <span className="font-mono text-[10px] text-stone-400 shrink-0 hidden sm:inline">
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
        {workspace === "CUIMS Student Hub" && (
          <CuimsPortalHub
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
              if (auth.currentUser) {
                saveDiagnosticAttempt(auth.currentUser.uid, {
                  topic: topicId,
                  score,
                  total,
                  percentage: pct,
                  misconceptionsCleared: topicId === "stats-bayes" && score >= 4 ? 1 : 0,
                }).catch((err) => console.warn("Firestore sync error:", err));
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
        {workspace === "Bioscience Studio" && (
          <BioscienceStudio />
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
      {/* CUIMS Live Portal Radar Banner */}
      <div className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-500/[0.04] via-stone-50 to-amber-500/[0.06] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-xs">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold text-red-600 tracking-wider">
                  CUIMS Student Home · Live Feed
                </span>
                <span className="text-[10px] text-stone-400 font-mono">UID: 22BCS10482</span>
              </div>
              <h4 className="font-display text-lg text-slate-900 mt-0.5">
                Attendance: 83.4% · Safe to bunk 2 lectures · Next: Cloud Architecture in B2-401
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                1 defaulter alert in DAA (68.8% - attend next 8 classes to clear). MST-2 Date Sheet announced.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onAction("Opened CUIMS Student Hub.");
                onNavigate("CUIMS Student Hub");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <span>Open CUIMS Hub</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

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
      // Automatically redirect to Ask CampusGenie by default where results and remedial small steps are displayed
      onAskForHelp?.(
        `I just completed the ${questions[0]?.topicName || topicId} diagnostic: scored ${finalScore} of ${questions.length}. Provide a complete diagnostic analysis of my understanding, pinpoint active misconceptions, explain the key principles, and map out the small steps needed to achieve full mastery.`
      );
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
  const [sessions, setSessions] = useState<StudySession[]>(INITIAL_STUDY_SESSIONS);
  const [selectedBlueprintSession, setSelectedBlueprintSession] = useState<StudySession | null>(null);
  const [activeTimerSession, setActiveTimerSession] = useState<StudySession | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAiGeneratingPlan, setIsAiGeneratingPlan] = useState(false);
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");

  // Add Block Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"preset" | "ai" | "custom">("preset");
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("bayes-inference");

  // AI Generator state
  const [aiTopic, setAiTopic] = useState("");
  const [aiCourse, setAiCourse] = useState("Machine Learning");
  const [aiDuration, setAiDuration] = useState("45");
  const [isGeneratingAiBlueprint, setIsGeneratingAiBlueprint] = useState(false);
  const [aiGeneratedBlueprint, setAiGeneratedBlueprint] = useState<SubjectBlueprint | null>(null);

  // Custom Form state
  const [customTitle, setCustomTitle] = useState("");
  const [customCourse, setCustomCourse] = useState("Applied Statistics");
  const [customDay, setCustomDay] = useState("Today");
  const [customDuration, setCustomDuration] = useState("35");
  const [customBiggerGoal, setCustomBiggerGoal] = useState("");
  const [customOverview, setCustomOverview] = useState("");
  const [customYtTitle, setCustomYtTitle] = useState("");
  const [customYtChannel, setCustomYtChannel] = useState("");
  const [customYtUrl, setCustomYtUrl] = useState("");
  const [customStepsText, setCustomStepsText] = useState(
    "Step 1: Conceptual derivation & mental model (~15 min)\nStep 2: Hands-on code test or numerical calculation (~15 min)\nStep 3: Boundary test & diagnostic self-assessment (~10 min)"
  );

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

  function handleToggleStep(sessionId: string, stepId: string) {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        if (!session.blueprint) return session;

        const updatedSteps = session.blueprint.microSteps.map((step) =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        );
        const allCompleted = updatedSteps.length > 0 && updatedSteps.every((s) => s.completed);
        const updatedSession: StudySession = {
          ...session,
          status: allCompleted ? "completed" : "in-progress",
          blueprint: {
            ...session.blueprint,
            microSteps: updatedSteps,
          },
        };

        if (selectedBlueprintSession?.id === sessionId) {
          setSelectedBlueprintSession(updatedSession);
        }

        if (auth.currentUser) {
          saveStudyBlock(auth.currentUser.uid, {
            title: updatedSession.title,
            course: updatedSession.course,
            durationMinutes: updatedSession.durationMinutes,
            status: updatedSession.status,
            microStepsCount: updatedSteps.length,
            completedStepsCount: updatedSteps.filter((s) => s.completed).length,
            lastUpdated: new Date().toISOString(),
          }).catch(() => {});
        }

        return updatedSession;
      })
    );
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

  async function handleGenerateAiBlueprint(e: React.FormEvent) {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setIsGeneratingAiBlueprint(true);
    try {
      const res = await fetch("/api/generate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          course: aiCourse,
          durationMinutes: parseInt(aiDuration, 10) || 45,
        }),
      });
      const data = await res.json();
      if (data.blueprint) {
        setAiGeneratedBlueprint(data.blueprint);
        onAction(`Generated whole blueprint with YouTube links for "${aiTopic}".`);
      }
    } catch {
      onAction("Could not generate AI blueprint. Please try again.");
    } finally {
      setIsGeneratingAiBlueprint(false);
    }
  }

  function handleSaveAiBlueprint() {
    if (!aiGeneratedBlueprint || !aiTopic.trim()) return;
    const newBlock: StudySession = {
      id: `s-ai-${Date.now()}`,
      day: "Today",
      title: aiTopic,
      course: aiCourse,
      durationMinutes: parseInt(aiDuration, 10) || 45,
      status: "not-started",
      focusNotes: aiGeneratedBlueprint.biggerGoal,
      color: "bg-[var(--cobalt)]",
      blueprint: aiGeneratedBlueprint,
    };
    setSessions((prev) => [newBlock, ...prev]);
    setShowAddModal(false);
    setAiTopic("");
    setAiGeneratedBlueprint(null);
    setSelectedBlueprintSession(newBlock);
    onAction(`Added AI Blueprint block: "${newBlock.title}".`);
    if (auth.currentUser) {
      saveStudyBlock(auth.currentUser.uid, {
        title: newBlock.title,
        course: newBlock.course,
        durationMinutes: newBlock.durationMinutes,
        status: newBlock.status,
        blueprintGoal: newBlock.blueprint?.biggerGoal,
      }).catch(() => {});
    }
  }

  function handleAddPresetBlueprint() {
    const preset = PRESET_BLUEPRINTS[selectedPresetKey];
    if (!preset) return;

    let presetTitle = "Bayesian Parameter Estimation";
    let presetCourse = "Applied Statistics";
    let presetColor = "bg-[var(--coral)]";

    if (selectedPresetKey === "ml-regularization") {
      presetTitle = "L1 vs L2 Regularization & Sparsity";
      presetCourse = "Machine Learning";
      presetColor = "bg-[var(--mint)]";
    } else if (selectedPresetKey === "distributed-caching") {
      presetTitle = "Distributed Caching & Stampede Defense";
      presetCourse = "Distributed Systems";
      presetColor = "bg-[var(--ink)]";
    } else if (selectedPresetKey === "alphafold-bioscience") {
      presetTitle = "AlphaFold 3D Macromolecular Modeling";
      presetCourse = "Bioscience & Structural Biology";
      presetColor = "bg-teal-600";
    }

    const newBlock: StudySession = {
      id: `s-preset-${Date.now()}`,
      day: "Today",
      title: presetTitle,
      course: presetCourse,
      durationMinutes: 45,
      status: "not-started",
      focusNotes: preset.biggerGoal,
      color: presetColor,
      blueprint: preset,
    };

    setSessions((prev) => [newBlock, ...prev]);
    setShowAddModal(false);
    setSelectedBlueprintSession(newBlock);
    onAction(`Added Subject Blueprint: "${newBlock.title}" with YouTube lessons.`);
    if (auth.currentUser) {
      saveStudyBlock(auth.currentUser.uid, {
        title: newBlock.title,
        course: newBlock.course,
        durationMinutes: newBlock.durationMinutes,
        status: newBlock.status,
        blueprintGoal: newBlock.blueprint?.biggerGoal,
      }).catch(() => {});
    }
  }

  function handleAddCustomSession(e: React.FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const rawSteps = customStepsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const microSteps = rawSteps.map((line, idx) => ({
      id: `custom-step-${Date.now()}-${idx}`,
      stepNumber: idx + 1,
      title: line.replace(/^Step \d+:\s*/i, ""),
      explanation: `Detailed micro-focus for ${line}. Master this sub-task before advancing.`,
      task: `Implement or verify: ${line}. Record findings or notes.`,
      estimatedMinutes: 15,
      completed: false,
      youtubeUrl: customYtUrl.trim() || undefined,
      youtubeTitle: customYtTitle.trim() || undefined,
    }));

    const videoLinks = customYtUrl.trim()
      ? [
          {
            title: customYtTitle.trim() || "Recommended Video Reference",
            channel: customYtChannel.trim() || "Curated Lecture",
            url: customYtUrl.trim(),
            duration: "15:00",
          },
        ]
      : [];

    const blueprint: SubjectBlueprint = {
      biggerGoal:
        customBiggerGoal.trim() ||
        `Achieve full conceptual and practical mastery in ${customTitle} through structured small steps.`,
      overview:
        customOverview.trim() ||
        `${customTitle} provides core mathematical and computational principles. Breaking down this domain into bite-sized micro-steps allows efficient, high-retention mastery.`,
      videoLinks,
      microSteps,
    };

    const newBlock: StudySession = {
      id: `s-custom-${Date.now()}`,
      day: customDay,
      title: customTitle,
      course: customCourse,
      durationMinutes: parseInt(customDuration, 10) || 30,
      status: "not-started",
      focusNotes: customBiggerGoal.trim() || "Custom whole-blueprint study block.",
      color: "bg-[var(--cobalt)]",
      blueprint,
    };

    setSessions((prev) => [newBlock, ...prev]);
    setCustomTitle("");
    setCustomBiggerGoal("");
    setCustomOverview("");
    setCustomYtTitle("");
    setCustomYtChannel("");
    setCustomYtUrl("");
    setShowAddModal(false);
    setSelectedBlueprintSession(newBlock);
    onAction(`Added custom blueprint: "${newBlock.title}".`);

    if (auth.currentUser) {
      saveStudyBlock(auth.currentUser.uid, {
        title: newBlock.title,
        course: newBlock.course,
        durationMinutes: newBlock.durationMinutes,
        status: newBlock.status,
        blueprintGoal: newBlock.blueprint?.biggerGoal,
      }).catch(() => {});
    }
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
            Whole Blueprint & Micro-Steps Architecture
          </span>
          <h3 className="mt-1 font-display text-3xl">Adaptive Study Blocks</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {completedCount} of {sessions.length} study blocks completed · Learn small things in each project to stay efficient
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
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition"
          >
            <Plus size={14} /> Add Subject Block
          </button>

          <button
            onClick={generateAiStudyPlan}
            disabled={isAiGeneratingPlan}
            className="flex items-center gap-1.5 rounded-full bg-[var(--cobalt)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
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
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--ink)] hover:bg-[var(--mint)] transition"
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  completeSession(activeTimerSession.id);
                  setActiveTimerSession(null);
                }}
                className="rounded-full bg-[var(--mint)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:opacity-90 transition"
              >
                Mark Done
              </button>
              <button
                onClick={() => setActiveTimerSession(null)}
                className="text-xs text-white/60 hover:text-white p-1"
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
          const blueprint = session.blueprint;
          const totalSteps = blueprint?.microSteps.length || 0;
          const completedSteps = blueprint?.microSteps.filter((s) => s.completed).length || 0;
          const stepPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

          return (
            <div
              key={session.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                isDone
                  ? "border-[var(--line)] bg-white/30 opacity-75"
                  : isActive
                  ? "border-[var(--cobalt)] bg-white shadow-md ring-2 ring-[var(--cobalt)]/20"
                  : "border-[var(--line)] bg-white/70 hover:-translate-y-0.5 hover:shadow-xs"
              }`}
            >
              <div>
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

                <h4 className="mt-3 font-display text-lg font-semibold">{session.title}</h4>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{session.course}</p>

                {/* Overarching Bigger Goal Callout */}
                {blueprint?.biggerGoal ? (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Target size={13} className="text-teal-600 shrink-0" />
                      <span className="text-[11px] uppercase tracking-wide text-teal-800">Bigger Goal:</span>
                    </div>
                    <p className="mt-1 text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                      {blueprint.biggerGoal}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-[var(--muted)] line-clamp-2">
                    {session.focusNotes}
                  </p>
                )}

                {/* Small Micro-steps Progress Bar */}
                {totalSteps > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">Small Micro-Steps</span>
                      <span className="font-mono text-slate-500">
                        {completedSteps}/{totalSteps} ({stepPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                        style={{ width: `${stepPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* YouTube Video Counter Badge */}
                {blueprint?.videoLinks && blueprint.videoLinks.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] text-red-600 font-medium">
                    <Youtube size={13} />
                    <span>{blueprint.videoLinks.length} Curated YouTube Video Lessons</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBlueprintSession(session)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    <BookOpen size={13} className="text-teal-400" />
                    <span>Whole Blueprint & Videos</span>
                  </button>

                  <button
                    onClick={() => {
                      onAskQuestion?.(
                        `Conduct an adaptive review and diagnostic on "${session.title}" (${session.course}). Explain the core theoretical blueprint, identify subtle pitfalls, and outline the small actionable micro-steps to achieve the bigger goal: ${blueprint?.biggerGoal || session.focusNotes}.`
                      );
                      onAction(`Redirecting to Ask CampusGenie for review of "${session.title}".`);
                    }}
                    title="Review & Diagnose in Ask CampusGenie (auto-scrolls)"
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Sparkles size={13} className="text-[var(--cobalt)]" />
                    <span className="hidden sm:inline">Review</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {!isDone ? (
                    <button
                      onClick={() => startTimerForSession(session)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cobalt)] hover:underline"
                    >
                      <Play size={13} /> Focus Timer
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check size={14} /> Completed
                    </span>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => completeSession(session.id)}
                      className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
                    >
                      Mark done
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Block Modal with 3 Tabs: Curated Presets, AI Generation, Custom Blueprint */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-700 font-semibold">
                  New Subject Block
                </span>
                <h3 className="font-display text-2xl">Attach a Whole Blueprint & Small Steps</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[var(--line)] bg-slate-50 p-2 gap-2 text-xs font-medium">
              <button
                onClick={() => setModalMode("preset")}
                className={`flex-1 py-2 px-3 rounded-xl transition ${
                  modalMode === "preset"
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:bg-white/60"
                }`}
              >
                1. Curated Blueprint Library
              </button>
              <button
                onClick={() => setModalMode("ai")}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  modalMode === "ai"
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:bg-white/60"
                }`}
              >
                <Sparkles size={13} className="text-teal-600" />
                <span>2. AI Blueprint Engine</span>
              </button>
              <button
                onClick={() => setModalMode("custom")}
                className={`flex-1 py-2 px-3 rounded-xl transition ${
                  modalMode === "custom"
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:bg-white/60"
                }`}
              >
                3. Custom Blueprint
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Tab 1: Curated Library */}
              {modalMode === "preset" && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Select a battle-tested blueprint template with ready-to-watch YouTube lectures (3Blue1Brown, StatQuest, etc.) and sequenced micro-steps:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        key: "bayes-inference",
                        title: "Bayesian Inference & Belief Updates",
                        course: "Applied Statistics",
                        desc: "Prior vs Likelihood distinction, Base-Rate Fallacy, Beta-Binomial conjugate analysis.",
                        videos: "3Blue1Brown & StatQuest",
                        steps: "4 micro-steps",
                      },
                      {
                        key: "ml-regularization",
                        title: "L1 vs L2 Regularization & Sparsity",
                        course: "Machine Learning",
                        desc: "Ridge vs Lasso geometric penalty contours, bias-variance tradeoff, sparsity.",
                        videos: "StatQuest & MIT OCW",
                        steps: "4 micro-steps",
                      },
                      {
                        key: "distributed-caching",
                        title: "Distributed Caching & Stampedes",
                        course: "Distributed Systems",
                        desc: "Write-through vs Write-back, cache stampede mitigations, consistent hashing.",
                        videos: "Hussein Nasser & ByteByteGo",
                        steps: "4 micro-steps",
                      },
                      {
                        key: "alphafold-bioscience",
                        title: "AlphaFold 3D Macromolecular Modeling",
                        course: "Bioscience & Structural Biology",
                        desc: "Predicted pLDDT confidence scoring, PAE domain alignment, conformational flexibility.",
                        videos: "EMBL-EBI & DeepMind",
                        steps: "3 micro-steps",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => setSelectedPresetKey(item.key)}
                        className={`cursor-pointer rounded-xl border p-3.5 transition ${
                          selectedPresetKey === item.key
                            ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-sm">{item.title}</span>
                          <span className="text-[10px] font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                            {item.steps}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{item.course}</span>
                        <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">{item.desc}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                          <Youtube size={12} />
                          <span>Lectures: {item.videos}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {PRESET_BLUEPRINTS[selectedPresetKey] && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <Target size={14} className="text-teal-600" />
                        <span>Bigger Goal:</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {PRESET_BLUEPRINTS[selectedPresetKey].biggerGoal}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleAddPresetBlueprint}
                      className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Attach Preset Blueprint to Schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Blueprint Generator */}
              {modalMode === "ai" && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Enter any academic topic or capstone project requirement. Gemini will synthesize the overarching bigger goal, complete text explanation, curated YouTube video links, and small 15-minute micro-steps.
                  </p>

                  <form onSubmit={handleGenerateAiBlueprint} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Subject Topic / Requirement</label>
                      <input
                        type="text"
                        required
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="e.g. Transformer Self-Attention Mechanics, Fast Fourier Transform, CRISPR-Cas9"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Course</label>
                        <select
                          value={aiCourse}
                          onChange={(e) => setAiCourse(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                        >
                          <option value="Machine Learning">Machine Learning (CS-402)</option>
                          <option value="Applied Statistics">Applied Statistics (STAT-301)</option>
                          <option value="Distributed Systems">Distributed Systems (CS-410)</option>
                          <option value="Bioscience & Structural Biology">Bioscience & Structural Biology (BIO-502)</option>
                          <option value="BSc Capstone">BSc Capstone Project</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700">Planned Duration (Minutes)</label>
                        <input
                          type="number"
                          min="15"
                          max="180"
                          value={aiDuration}
                          onChange={(e) => setAiDuration(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isGeneratingAiBlueprint || !aiTopic.trim()}
                        className="flex items-center gap-1.5 rounded-full bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition"
                      >
                        <Sparkles size={13} />
                        {isGeneratingAiBlueprint ? "Synthesizing Blueprint & YouTube Links..." : "Generate Whole Blueprint with Gemini"}
                      </button>
                    </div>
                  </form>

                  {/* AI Generated Blueprint Preview */}
                  {aiGeneratedBlueprint && (
                    <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-teal-900 text-sm">Generated Blueprint Ready</span>
                        <span className="text-[10px] font-mono text-teal-700">
                          {aiGeneratedBlueprint.microSteps.length} small steps · {aiGeneratedBlueprint.videoLinks.length} videos
                        </span>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-teal-100">
                        <span className="font-bold text-slate-800">Bigger Goal:</span>
                        <p className="mt-0.5 text-slate-600 leading-relaxed text-[11px]">
                          {aiGeneratedBlueprint.biggerGoal}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800">Curated Video Lessons:</span>
                        <div className="mt-1 space-y-1">
                          {aiGeneratedBlueprint.videoLinks.map((vid, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px]">
                              <span className="font-medium text-slate-700 truncate pr-2">
                                🎬 {vid.channel}: {vid.title}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">{vid.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800">Micro-Steps Checklist:</span>
                        <div className="mt-1 space-y-1">
                          {aiGeneratedBlueprint.microSteps.map((step) => (
                            <div key={step.id} className="bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px] flex items-center justify-between">
                              <span className="text-slate-700">
                                Step {step.stepNumber}: {step.title}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">~{step.estimatedMinutes} min</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveAiBlueprint}
                          className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                        >
                          Save AI Blueprint to My Study Schedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Custom Blueprint Builder */}
              {modalMode === "custom" && (
                <form onSubmit={handleAddCustomSession} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Subject Topic / Block Name</label>
                      <input
                        type="text"
                        required
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Distributed Consensus (Raft)"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Course</label>
                      <select
                        value={customCourse}
                        onChange={(e) => setCustomCourse(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                      >
                        <option value="Applied Statistics">Applied Statistics (STAT-301)</option>
                        <option value="Machine Learning">Machine Learning (CS-402)</option>
                        <option value="Distributed Systems">Distributed Systems (CS-410)</option>
                        <option value="Bioscience & Structural Biology">Bioscience & Structural Biology (BIO-502)</option>
                        <option value="BSc Capstone">BSc Capstone Project</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Day / Target Schedule</label>
                      <input
                        type="text"
                        value={customDay}
                        onChange={(e) => setCustomDay(e.target.value)}
                        placeholder="e.g. Today, Tomorrow, Wed"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Planned Duration (Minutes)</label>
                      <input
                        type="number"
                        min="10"
                        max="180"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      🎯 Bigger Goal (The overarching outcome to achieve)
                    </label>
                    <input
                      type="text"
                      value={customBiggerGoal}
                      onChange={(e) => setCustomBiggerGoal(e.target.value)}
                      placeholder="e.g. Implement leader election and log replication without split-brain"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      📖 Detailed Conceptual Blueprint & Principles (Text Explanation)
                    </label>
                    <textarea
                      rows={3}
                      value={customOverview}
                      onChange={(e) => setCustomOverview(e.target.value)}
                      placeholder="Explain key theorems, definitions, tradeoffs, or mental models for this domain..."
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                    />
                  </div>

                  {/* Curated YouTube Video Info */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                      <Youtube size={14} className="text-red-600" />
                      Curated YouTube Video Lecture
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={customYtTitle}
                        onChange={(e) => setCustomYtTitle(e.target.value)}
                        placeholder="Video Title (e.g. Raft Consensus Algorithm)"
                        className="rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:border-teal-600"
                      />
                      <input
                        type="text"
                        value={customYtChannel}
                        onChange={(e) => setCustomYtChannel(e.target.value)}
                        placeholder="Channel (e.g. MIT 6.824 / Hussein Nasser)"
                        className="rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:border-teal-600"
                      />
                    </div>
                    <input
                      type="url"
                      value={customYtUrl}
                      onChange={(e) => setCustomYtUrl(e.target.value)}
                      placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:border-teal-600"
                    />
                  </div>

                  {/* Micro Steps Area */}
                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      ✅ Small Steps to Achieve the Bigger Goal (One step per line)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-1">
                      Breaking the project into small 10-15 minute things makes learning efficient.
                    </p>
                    <textarea
                      rows={3}
                      value={customStepsText}
                      onChange={(e) => setCustomStepsText(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Save Custom Blueprint
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subject Blueprint & Micro-Steps Modal */}
      <SubjectBlueprintModal
        isOpen={Boolean(selectedBlueprintSession)}
        onClose={() => setSelectedBlueprintSession(null)}
        session={selectedBlueprintSession}
        onToggleStep={handleToggleStep}
        onAskQuestion={onAskQuestion}
      />
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
