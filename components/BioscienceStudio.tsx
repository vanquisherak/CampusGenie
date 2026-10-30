"use client";

import { useState, useEffect } from "react";
import {
  Dna,
  ExternalLink,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  AlertTriangle,
  Layers,
  Activity,
  FileCode,
} from "lucide-react";

type BioscienceData = {
  accession: string;
  gene: string;
  organism: string;
  description: string;
  sequenceLength: number;
  sequence: string;
  globalMetricValue: number;
  plddtBreakdown: {
    veryHigh: number;
    confident: number;
    low: number;
    veryLow: number;
  };
  cifUrl: string | null;
  bcifUrl: string | null;
  pdbUrl: string | null;
  paeImageUrl: string | null;
  paeDocUrl: string | null;
  functionSummary: string;
  provenance: string;
};

const QUICK_EXAMPLES = [
  { gene: "TP53", accession: "P04637", label: "Cellular Tumor Antigen p53" },
  { gene: "BRCA1", accession: "P38398", label: "Breast Cancer Type 1 Susceptibility" },
  { gene: "EGFR", accession: "P00533", label: "Epidermal Growth Factor Receptor" },
  { gene: "PCSK9", accession: "Q8NBP7", label: "Proprotein Convertase Subtilisin/Kexin 9" },
  { gene: "HBB", accession: "P68871", label: "Hemoglobin Subunit Beta" },
  { gene: "ACE2", accession: "Q9BYF1", label: "Angiotensin-Converting Enzyme 2" },
  { gene: "KRAS", accession: "P01116", label: "GTPase KRas Proto-Oncogene" },
];

export function BioscienceStudio() {
  const [query, setQuery] = useState("TP53");
  const [data, setData] = useState<BioscienceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSeq, setCopiedSeq] = useState(false);

  async function loadBiomolecule(targetQuery: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bioscience?query=${encodeURIComponent(targetQuery)}`);
      if (!res.ok) {
        throw new Error(`Failed to load target data (${res.status})`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
      setQuery(targetQuery);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve biomolecular coordinates";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBiomolecule("TP53");
  }, []);

  function handleCopySequence() {
    if (!data?.sequence) return;
    navigator.clipboard.writeText(data.sequence);
    setCopiedSeq(true);
    setTimeout(() => setCopiedSeq(false), 2000);
  }

  const isHighlyDisordered = data ? data.plddtBreakdown.veryLow > 40 : false;

  return (
    <div className="space-y-6">
      {/* Header & Science Skill Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Dna className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Bioscience & Structural Biology Studio
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Query macromolecular structures, AlphaFold DB v6 predictions, and confidence metrics (Google DeepMind Science Skill).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
            Authoritative Sources: AlphaFold DB • UniProtKB • RCSB PDB
          </span>
        </div>
      </div>

      {/* Quick-try Example Bar */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Curated Benchmark Targets (Click to Inspect)
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex.gene}
              onClick={() => loadBiomolecule(ex.gene)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all text-left flex items-center gap-2 ${
                query.toUpperCase() === ex.gene
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50"
              }`}
            >
              <span className="font-bold">{ex.gene}</span>
              <span className={`text-[10px] ${query.toUpperCase() === ex.gene ? "text-teal-100" : "text-slate-400"}`}>
                ({ex.accession})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) loadBiomolecule(query.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Gene Symbol (e.g., TP53, EGFR) or UniProt Accession (e.g., P04637)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 placeholder-slate-400 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? (
            <span className="animate-spin text-sm">⌛</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Analyze 3D Target</span>
            </>
          )}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Query Resolution Notice</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Active Biomolecule Workbench */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Metadata & pLDDT Confidence Gauge (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Target Overview Card */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider text-teal-700 font-bold">
                    {data.organism}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                    {data.gene}
                    <span className="text-xs font-mono font-normal px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {data.accession}
                    </span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    AF v6 Model
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {data.description}
              </p>
              <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex justify-between font-mono">
                <span>Residues: {data.sequenceLength} aa</span>
                <span>Provenance: {data.provenance}</span>
              </div>
            </div>

            {/* AlphaFold Confidence Metrics */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  AlphaFold pLDDT Structural Confidence
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">
                  Mean: {data.globalMetricValue.toFixed(1)} / 100
                </div>
              </div>

              {/* Progress bar distribution */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded-md overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${data.plddtBreakdown.veryHigh}%` }}
                    className="bg-[#0053D6] h-full transition-all"
                    title={`Very High (>90): ${data.plddtBreakdown.veryHigh}%`}
                  />
                  <div
                    style={{ width: `${data.plddtBreakdown.confident}%` }}
                    className="bg-[#65CBF3] h-full transition-all"
                    title={`Confident (70-90): ${data.plddtBreakdown.confident}%`}
                  />
                  <div
                    style={{ width: `${data.plddtBreakdown.low}%` }}
                    className="bg-[#FFDB13] h-full transition-all"
                    title={`Low (50-70): ${data.plddtBreakdown.low}%`}
                  />
                  <div
                    style={{ width: `${data.plddtBreakdown.veryLow}%` }}
                    className="bg-[#FF7D45] h-full transition-all"
                    title={`Very Low (<50): ${data.plddtBreakdown.veryLow}%`}
                  />
                </div>

                {/* Canonical 4-band legend */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0053D6]" />
                    <span className="text-slate-600">Very High (&gt;90):</span>
                    <span className="font-mono font-bold ml-auto">{data.plddtBreakdown.veryHigh}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#65CBF3]" />
                    <span className="text-slate-600">Confident (70-90):</span>
                    <span className="font-mono font-bold ml-auto">{data.plddtBreakdown.confident}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFDB13]" />
                    <span className="text-slate-600">Low (50-70):</span>
                    <span className="font-mono font-bold ml-auto">{data.plddtBreakdown.low}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7D45]" />
                    <span className="text-slate-600">Very Low (&lt;50):</span>
                    <span className="font-mono font-bold ml-auto">{data.plddtBreakdown.veryLow}%</span>
                  </div>
                </div>
              </div>

              {/* Disorder or Rigidity Warning from Science Skill */}
              {isHighlyDisordered ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Intrinsically Disordered Region (IDR) Warning
                  </div>
                  <p className="mt-1">
                    This target exhibits significant low-confidence regions (&gt;40% pLDDT &lt;50), typical of disordered loops or regulatory termini. Restrict structural docking to structured domains.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
                  <div className="font-bold">Ordered Fold Topology</div>
                  <p className="mt-0.5">
                    High global confidence. Suitable for downstream binding pocket analysis, Foldseek structural alignments, and active-site characterization.
                  </p>
                </div>
              )}
            </div>

            {/* Coordinate Downloads */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-teal-600" />
                Macromolecular Coordinate Files
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {data.cifUrl && (
                  <a
                    href={data.cifUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 flex items-center justify-between transition"
                  >
                    <span>mmCIF (v6)</span>
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                )}
                {data.pdbUrl && (
                  <a
                    href={data.pdbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 flex items-center justify-between transition"
                  >
                    <span>PDB Format</span>
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: PAE Matrix, Sequence Inspector & External Citations (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Functional Annotation Card */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Curated Biological Function (UniProtKB)
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {data.functionSummary}
              </p>
            </div>

            {/* PAE (Predicted Aligned Error) Matrix Image */}
            {data.paeImageUrl && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Predicted Aligned Error (PAE) Inter-Domain Heatmap
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lower error = higher domain rigidity
                  </span>
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.paeImageUrl}
                    alt="AlphaFold Predicted Aligned Error Heatmap"
                    className="max-h-60 rounded object-contain"
                  />
                </div>
                {data.paeDocUrl && (
                  <div className="text-right">
                    <a
                      href={data.paeDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-700 hover:underline font-mono inline-flex items-center gap-1"
                    >
                      <span>Download Raw PAE JSON Array</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Monospace Sequence Viewer */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Primary Sequence (FASTA Format preview)
                </div>
                <button
                  onClick={handleCopySequence}
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 transition"
                >
                  {copiedSeq ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Sequence</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700 break-all leading-relaxed max-h-36 overflow-y-auto">
                {data.sequence || "Sequence unavailable"}
              </div>
            </div>

            {/* Authoritative Epistemic Provenance Badges */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Direct external records:
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${data.accession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-teal-700 font-semibold hover:border-teal-500 inline-flex items-center gap-1"
                >
                  <span>AlphaFold DB Entry</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://www.uniprot.org/uniprotkb/${data.accession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-teal-700 font-semibold hover:border-teal-500 inline-flex items-center gap-1"
                >
                  <span>UniProtKB {data.accession}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://www.rcsb.org/search?q=${data.gene}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-teal-700 font-semibold hover:border-teal-500 inline-flex items-center gap-1"
                >
                  <span>RCSB PDB Homologs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
