export type Evidence = {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  topicIds: string[];
  authority: "official" | "curated" | "community";
  version: string;
};

export type RetrievalQuery = {
  text: string;
  courseId?: string;
  topicIds?: string[];
  learnerId?: string;
  includePrerequisites: boolean;
};

export interface Retriever {
  search(query: RetrievalQuery): Promise<Evidence[]>;
}