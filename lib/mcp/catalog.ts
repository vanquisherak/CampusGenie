import type { InstitutionalTool } from "@/lib/mcp/contracts";

export const approvedInstitutionalTools: InstitutionalTool[] = [
  { name: "lms.course_context", description: "Read enrolled course, module, and deadline context", access: "read", system: "lms" },
  { name: "library.search", description: "Search institution-approved books, papers, and reading lists", access: "read", system: "library" },
  { name: "timetable.upcoming", description: "Read classes, labs, and examination schedule", access: "read", system: "advising" },
  { name: "assignments.status", description: "Read assignment status and rubric metadata", access: "read", system: "lms" },
  { name: "projects.approved_datasets", description: "Find approved project datasets and lab resources", access: "read", system: "projects" },
];