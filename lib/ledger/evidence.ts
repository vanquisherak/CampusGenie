import type { Evidence } from "@/lib/rag/contracts";

export type EvidenceLedgerEntry = {
  requestId: string;
  evidence: Evidence[];
  claimSupport: Record<string, string[]>;
  verifiedAt: string;
};

export function createEvidenceLedgerEntry(requestId: string, evidence: Evidence[]): EvidenceLedgerEntry {
  return { requestId, evidence, claimSupport: {}, verifiedAt: new Date().toISOString() };
}