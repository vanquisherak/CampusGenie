import type { Evidence } from "@/lib/rag/contracts";
import type { LearningState } from "@/lib/curriculum/types";

export const demoLearner: LearningState = {
  learnerId: "learner-aria-01",
  program: "BSc Computer Science",
  currentTerm: "Term 4 · 2026",
  preferredFormats: ["worked examples", "short quizzes", "visual maps"],
  updatedAt: "2026-10-28T16:20:00.000Z",
  topics: [
    { topicId: "ml-regularization", topic: "Regularization", course: "Machine Learning", mastery: 78, band: "ready", confidence: 0.86, evidenceIds: ["ev-ml-01"], nextAction: "Compare L1 and L2 on a tiny dataset" },
    { topicId: "stats-bayes", topic: "Bayesian inference", course: "Applied Statistics", mastery: 61, band: "developing", confidence: 0.71, misconception: "Confuses prior probability with likelihood", evidenceIds: ["ev-stats-01"], nextAction: "Complete a three-question diagnostic" },
    { topicId: "systems-caching", topic: "Caching strategies", course: "Distributed Systems", mastery: 44, band: "emerging", confidence: 0.63, evidenceIds: ["ev-systems-01"], nextAction: "Review cache invalidation patterns" },
  ],
};

export const demoEvidence: Evidence[] = [
  { id: "ev-ml-01", title: "ML-402 Week 7 notes", source: "Machine Learning · Dr. Kim", excerpt: "Regularization trades a small increase in bias for a reduction in variance.", topicIds: ["ml-regularization"], authority: "official", version: "2026.1" },
  { id: "ev-stats-01", title: "Bayesian inference workshop", source: "Statistics Lab · Week 5", excerpt: "The likelihood describes how compatible observed data is with a parameter value.", topicIds: ["stats-bayes"], authority: "curated", version: "2026.2" },
  { id: "ev-systems-01", title: "Distributed systems reading list", source: "CS-410 · Library guide", excerpt: "Caching improves latency, but invalidation determines whether the system remains correct.", topicIds: ["systems-caching"], authority: "official", version: "2026.1" },
];