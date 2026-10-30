export type MasteryBand = "emerging" | "developing" | "ready" | "mastered";

export type LearnerTopicState = {
  topicId: string;
  topic: string;
  course: string;
  mastery: number;
  band: MasteryBand;
  confidence: number;
  misconception?: string;
  evidenceIds: string[];
  nextAction: string;
};

export type CurriculumNode = {
  id: string;
  label: string;
  type: "course" | "module" | "topic" | "outcome" | "skill";
  prerequisites: string[];
  outcomeIds: string[];
};

export type LearningState = {
  learnerId: string;
  program: string;
  currentTerm: string;
  topics: LearnerTopicState[];
  preferredFormats: string[];
  updatedAt: string;
};