"use client";

import { motion } from "motion/react";
import {
  Sparkles,
  Target,
  Calculator,
  Mic,
  ArrowRight,
  Brain,
} from "lucide-react";

interface CommandPortal {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  actionLabel: string;
  accent: "teal" | "cobalt" | "coral" | "emerald";
  badgeText: string;
}

const COMMAND_PORTALS: CommandPortal[] = [
  {
    id: "portal-ask",
    tag: "Adaptive AI Tutor",
    title: "AI Blueprint & Concept Solver",
    description: "Input any syllabus topic or exam question. Receive instant micro-steps, formulas, and video explanations.",
    icon: Brain,
    actionLabel: "Launch Prompt Console",
    accent: "teal",
    badgeText: "Gemini 3.8 Flash",
  },
  {
    id: "portal-quiz",
    tag: "Misconception Lab",
    title: "Adaptive Diagnostic Quiz",
    description: "5-question diagnostic pinpointing your exact knowledge gap (Prior Probability vs Likelihood).",
    icon: Target,
    actionLabel: "Start Diagnostic",
    accent: "coral",
    badgeText: "5 Questions · 4 min",
  },
  {
    id: "portal-cuims",
    tag: "CUIMS Compliance",
    title: "75% Safe-Bunk Predictor",
    description: "Simulate upcoming classes: check how many lectures you can safely miss or must attend to remain exam-eligible.",
    icon: Calculator,
    actionLabel: "Open Attendance Radar",
    accent: "emerald",
    badgeText: "83.4% Avg · 2 Bunks Safe",
  },
  {
    id: "portal-voice",
    tag: "Oral Examination",
    title: "Gemini Live Voice Tutor",
    description: "Hands-free, real-time spoken dialogue with AI. Practice explaining formulas and algorithms verbally.",
    icon: Mic,
    actionLabel: "Connect Audio Stream",
    accent: "cobalt",
    badgeText: "Bidirectional Audio",
  },
];

export function FuturisticCommandDeck({
  onSelectPortal,
}: {
  onSelectPortal: (portalId: string) => void;
}) {
  return (
    <div className="mt-8">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-700 font-bold">
              Interactive Mission Control
            </p>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 mt-1">
            Where do you want to focus today?
          </h2>
        </div>
        <p className="text-xs text-stone-500 max-w-xs sm:text-right">
          Click any mission card to enter that interactive module instantly with zero confusion.
        </p>
      </div>

      {/* 4-Card Futuristic Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COMMAND_PORTALS.map((portal, idx) => {
          const Icon = portal.icon;

          const accentStyles = {
            teal: {
              cardBorder: "hover:border-teal-400/80 hover:shadow-[0_0_25px_rgba(20,184,166,0.18)]",
              iconBg: "bg-teal-500/10 text-teal-600 border-teal-500/20",
              btnBg: "hover:text-teal-700",
              badge: "text-teal-700 bg-teal-50 border-teal-200",
            },
            coral: {
              cardBorder: "hover:border-rose-400/80 hover:shadow-[0_0_25px_rgba(244,63,94,0.18)]",
              iconBg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
              btnBg: "hover:text-rose-700",
              badge: "text-rose-700 bg-rose-50 border-rose-200",
            },
            emerald: {
              cardBorder: "hover:border-emerald-400/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]",
              iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              btnBg: "hover:text-emerald-700",
              badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
            },
            cobalt: {
              cardBorder: "hover:border-indigo-400/80 hover:shadow-[0_0_25px_rgba(99,102,241,0.18)]",
              iconBg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
              btnBg: "hover:text-indigo-700",
              badge: "text-indigo-700 bg-indigo-50 border-indigo-200",
            },
          }[portal.accent];

          return (
            <motion.div
              key={portal.id}
              onClick={() => onSelectPortal(portal.id)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`group cursor-pointer rounded-2xl border border-stone-200/90 bg-white/80 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 shadow-xs ${accentStyles.cardBorder}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${accentStyles.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${accentStyles.badge}`}>
                    {portal.badgeText}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                    {portal.tag}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-slate-900 mt-0.5 group-hover:text-slate-950 transition">
                    {portal.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
                    {portal.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className={accentStyles.btnBg}>{portal.actionLabel}</span>
                <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
