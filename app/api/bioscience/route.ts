import { NextRequest, NextResponse } from "next/server";

// Standard canonical UniProt mappings for top academic examples
const GENE_TO_ACCESSION: Record<string, string> = {
  TP53: "P04637",
  BRCA1: "P38398",
  EGFR: "P00533",
  PCSK9: "Q8NBP7",
  HBB: "P68871",
  ACE2: "Q9BYF1",
  KRAS: "P01116",
  INS: "P01308",
};

interface AlphaFoldModel {
  gene?: string;
  organismScientificName?: string;
  uniprotDescription?: string;
  uniprotEnd?: number;
  uniprotSequence?: string;
  globalMetricValue?: number;
  fractionPlddtVeryHigh?: number;
  fractionPlddtConfident?: number;
  fractionPlddtLow?: number;
  fractionPlddtVeryLow?: number;
  cifUrl?: string;
  bcifUrl?: string;
  pdbUrl?: string;
  paeImageUrl?: string;
  paeDocUrl?: string;
}

interface UniProtEntry {
  genes?: Array<{ geneName?: { value?: string } }>;
  organism?: { scientificName?: string };
  proteinDescription?: { recommendedName?: { fullName?: { value?: string } } };
  sequence?: { length?: number };
  comments?: Array<{
    commentType?: string;
    texts?: Array<{ value?: string }>;
  }>;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "TP53";
  const cleanUpper = query.toUpperCase();
  const accession = GENE_TO_ACCESSION[cleanUpper] || cleanUpper;

  try {
    // 1. Fetch AlphaFold DB prediction metadata
    const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${accession}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    let afData: AlphaFoldModel | null = null;
    if (afRes.ok) {
      const list = (await afRes.json()) as AlphaFoldModel[];
      afData = Array.isArray(list) && list.length > 0 ? list[0] : null;
    }

    // 2. Fetch UniProt entry summary
    let uniData: UniProtEntry | null = null;
    try {
      const uRes = await fetch(`https://rest.uniprot.org/uniprotkb/${accession}.json`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (uRes.ok) {
        uniData = (await uRes.json()) as UniProtEntry;
      }
    } catch {
      // UniProt failure non-fatal if AF succeeds
    }

    // Format structural insights & pLDDT distribution
    const plddtVeryHigh = afData?.fractionPlddtVeryHigh ? Math.round(afData.fractionPlddtVeryHigh * 100) : 0;
    const plddtConfident = afData?.fractionPlddtConfident ? Math.round(afData.fractionPlddtConfident * 100) : 0;
    const plddtLow = afData?.fractionPlddtLow ? Math.round(afData.fractionPlddtLow * 100) : 0;
    const plddtVeryLow = afData?.fractionPlddtVeryLow ? Math.round(afData.fractionPlddtVeryLow * 100) : 0;

    const funcComment = uniData?.comments?.find((c) => c.commentType === "FUNCTION")?.texts?.[0]?.value;

    return NextResponse.json({
      accession,
      gene: afData?.gene || uniData?.genes?.[0]?.geneName?.value || cleanUpper,
      organism: afData?.organismScientificName || uniData?.organism?.scientificName || "Homo sapiens",
      description: afData?.uniprotDescription || uniData?.proteinDescription?.recommendedName?.fullName?.value || "Target Protein",
      sequenceLength: afData?.uniprotEnd || uniData?.sequence?.length || 0,
      sequence: afData?.uniprotSequence?.slice(0, 300) || "",
      globalMetricValue: afData?.globalMetricValue || 0,
      plddtBreakdown: {
        veryHigh: plddtVeryHigh,
        confident: plddtConfident,
        low: plddtLow,
        veryLow: plddtVeryLow,
      },
      cifUrl: afData?.cifUrl || null,
      bcifUrl: afData?.bcifUrl || null,
      pdbUrl: afData?.pdbUrl || null,
      paeImageUrl: afData?.paeImageUrl || null,
      paeDocUrl: afData?.paeDocUrl || null,
      functionSummary: funcComment || "Essential regulatory protein in cellular homeostasis and macromolecular assembly.",
      provenance: "AlphaFold DB v6 (DeepMind / EMBL-EBI) & UniProtKB",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to retrieve biomolecular data";
    console.error("Bioscience API error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg, accession },
      { status: 500 }
    );
  }
}
