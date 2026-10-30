"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  Youtube,
  ExternalLink,
  Target,
  Sparkles,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface MicroStep {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  task: string;
  estimatedMinutes: number;
  completed: boolean;
  youtubeUrl?: string;
  youtubeTitle?: string;
}

export interface SubjectBlueprint {
  overview: string;
  biggerGoal: string;
  videoLinks: Array<{
    title: string;
    channel: string;
    url: string;
    duration: string;
  }>;
  microSteps: MicroStep[];
}

export interface SubjectBlock {
  id: string;
  day: string;
  title: string;
  course: string;
  durationMinutes: number;
  status: "not-started" | "in-progress" | "completed";
  focusNotes: string;
  color: string;
  blueprint?: SubjectBlueprint;
}

interface SubjectBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SubjectBlock | null;
  onToggleStep: (sessionId: string, stepId: string) => void;
  onAskQuestion?: (prompt: string) => void;
}

export function SubjectBlueprintModal({
  isOpen,
  onClose,
  session,
  onToggleStep,
  onAskQuestion,
}: SubjectBlueprintModalProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  if (!isOpen || !session || !session.blueprint) return null;

  const blueprint = session.blueprint;
  const completedSteps = blueprint.microSteps.filter((s) => s.completed).length;
  const totalSteps = blueprint.microSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  function handleReviewWithCampusGenie() {
    onClose();
    if (onAskQuestion && session) {
      const remainingTasks = blueprint.microSteps
        .filter((s) => !s.completed)
        .map((s) => `Step ${s.stepNumber}: ${s.title}`)
        .join("; ");

      const prompt = `Review my learning blueprint for "${session.title}" (${session.course}). 
Bigger Goal: "${blueprint.biggerGoal}".
I have completed ${completedSteps} of ${totalSteps} small steps (${progressPct}%).
Pending small steps: ${remainingTasks || "All completed"}.
Diagnose my progress, explain the key intuition for the next pending step, and recommend one concrete practice problem.`;

      onAskQuestion(prompt);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {session.course}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {session.durationMinutes} min block
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">{session.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F8FAFC]">
          {/* Overarching Bigger Goal Card */}
          <div className="p-4 bg-white border border-teal-200 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <Target size={16} className="text-teal-600" />
              <span>The Bigger Goal</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {blueprint.biggerGoal}
            </p>
            <p className="text-xs text-slate-500">
              Achieved by mastering small, bite-sized concepts step by step for peak efficiency.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Micro-Steps Progress</span>
              <span className="font-mono font-bold text-teal-700">
                {completedSteps} of {totalSteps} steps completed ({progressPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Text Explanation Overview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wide">
              <BookOpen size={15} className="text-[var(--cobalt)]" />
              <span>Subject Architecture & Core Explanation</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {blueprint.overview}
            </div>
          </div>

          {/* Curated YouTube Video Links */}
          {blueprint.videoLinks && blueprint.videoLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                  <Youtube size={16} className="text-red-600" />
                  <span>Curated High-Yield Video Lessons</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Verified educational resources
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blueprint.videoLinks.map((vid, idx) => (
                  <a
                    key={idx}
                    href={vid.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-white border border-slate-200 hover:border-red-400 rounded-xl transition group flex items-start justify-between gap-3 shadow-xs hover:shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-red-600">
                        <Youtube size={13} />
                        <span>{vid.channel}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition line-clamp-2">
                        {vid.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono inline-flex items-center gap-1">
                        <Clock size={10} /> {vid.duration}
                      </span>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-red-600 shrink-0 mt-1 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Micro-Steps List (Small steps to achieve the bigger goal) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Small Steps Roadmap (Bite-Sized Efficiency)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete each 10-15 min step to steadily unlock the complete project goal.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {blueprint.microSteps.map((step) => {
                const isExpanded = expandedStepId === step.id;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border transition-all ${
                      step.completed
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => onToggleStep(session.id, step.id)}
                        className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition"
                      >
                        {step.completed ? (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        ) : (
                          <Circle size={18} className="text-slate-300 hover:text-slate-500" />
                        )}
                      </button>

                      {/* Title & Time */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            onClick={() => onToggleStep(session.id, step.id)}
                            className={`text-xs font-semibold cursor-pointer ${
                              step.completed ? "line-through text-slate-500" : "text-slate-900"
                            }`}
                          >
                            Step {step.stepNumber}: {step.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            ~{step.estimatedMinutes} min
                          </span>
                        </div>

                        {/* Collapsible details toggle */}
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                            className="text-[11px] text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"
                          >
                            <span>{isExpanded ? "Hide micro-lesson" : "Read micro-lesson & task"}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {step.youtubeUrl && (
                            <a
                              href={step.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                            >
                              <Youtube size={12} />
                              <span>{step.youtubeTitle || "Video Clip"}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Lesson & Hands-on Task */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs space-y-2 bg-slate-50/70 rounded-b-xl">
                        <div>
                          <span className="font-semibold text-slate-800">Concept Explanation:</span>
                          <p className="mt-0.5 text-slate-600 leading-relaxed">{step.explanation}</p>
                        </div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                          <span className="font-semibold text-slate-800">Practical Micro-Task:</span>
                          <p className="mt-0.5 text-slate-600">{step.task}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {completedSteps === totalSteps ? (
              <span className="text-emerald-700 font-bold">🎉 Whole blueprint completed!</span>
            ) : (
              <span>Take small steps daily to reach your bigger goal.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReviewWithCampusGenie}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-teal-400" />
              <span>Review in Ask CampusGenie</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
