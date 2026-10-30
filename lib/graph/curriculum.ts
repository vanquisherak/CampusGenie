import type { CurriculumNode } from "@/lib/curriculum/types";

export const curriculumGraph: CurriculumNode[] = [
  { id: "probability-foundations", label: "Probability foundations", type: "topic", prerequisites: [], outcomeIds: ["outcome-statistics-01"] },
  { id: "stats-bayes", label: "Bayesian inference", type: "topic", prerequisites: ["probability-foundations"], outcomeIds: ["outcome-statistics-02"] },
  { id: "ml-regularization", label: "Regularization", type: "topic", prerequisites: ["stats-bayes"], outcomeIds: ["outcome-ml-03"] },
  { id: "systems-caching", label: "Caching strategies", type: "topic", prerequisites: [], outcomeIds: ["outcome-systems-04"] },
];

export function prerequisiteIds(topicIds: string[]): string[] {
  return curriculumGraph.filter((node) => topicIds.includes(node.id)).flatMap((node) => node.prerequisites);
}