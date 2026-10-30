export type InstitutionalTool = {
  name: string;
  description: string;
  access: "read" | "write";
  system: "library" | "lms" | "projects" | "advising";
};

export const institutionConnectors = [
  {
    id: "cu-lms",
    label: "CU-LMS",
    baseUrl: "https://lms.cuchd.in/",
    authMode: "institutional-sso",
    capabilities: ["course resources", "learning activities", "deadlines"],
  },
  {
    id: "cuims",
    label: "CUIMS",
    baseUrl: "https://students.cuchd.in",
    authMode: "institutional-sso",
    capabilities: ["student identity", "enrollment context"],
  },
] as const;

export type ToolCallReceipt = {
  tool: string;
  system: InstitutionalTool["system"];
  authorized: boolean;
  resultSummary: string;
  timestamp: string;
};

export interface InstitutionalMcpGateway {
  listTools(): Promise<InstitutionalTool[]>;
  callTool(toolName: string, input: Record<string, unknown>): Promise<ToolCallReceipt>;
}