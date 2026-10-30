"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Mic,
  Sliders,
  Zap,
  Lock,
  Unlock,
  Plus,
  Atom,
  Orbit,
  Cloud,
  Activity,
  Flame,
  ArrowRight,
  GitMerge,
  BookOpen,
  Check,
  HelpCircle,
  X,
  Target,
} from "lucide-react";
import type { LearningState } from "@/lib/curriculum/types";

export interface BridgeStep {
  step: number;
  title: string;
  focus: string;
  method: string;
  checkQuestion: string;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  course: string;
  mastery: number;
  band: "mastered" | "ready" | "developing" | "emerging";
  color: string;
  misconception?: string;
  isKnowledgeGap?: boolean;
  gapType?: "Cognitive Misconception" | "Prerequisite Disconnect" | "Foundational Mastery Gap";
  gapRootCause?: string;
  prerequisiteBridgeAnchor?: string;
  bridgeSteps?: BridgeStep[];
  nextAction: string;
  evidenceCount: number;
  prerequisites: string[];
  unlocks: string[];
  isCustom?: boolean;
}

export function isKnowledgeGap(node: GraphNode): boolean {
  return Boolean(
    node.isKnowledgeGap ||
    Boolean(node.misconception) ||
    node.mastery < 65 ||
    node.band === "emerging"
  );
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

interface InteractiveLearningGraphProps {
  learner: LearningState;
  onSelectTopicPrompt: (prompt: string) => void;
  onStartQuizTopic?: (topicId: string) => void;
  onOpenVoiceTutor?: (topicName: string) => void;
}

type PhysicsPreset = "balanced" | "orbit" | "lattice" | "zerog";

export function InteractiveLearningGraph({
  learner,
  onSelectTopicPrompt,
  onStartQuizTopic,
  onOpenVoiceTutor,
}: InteractiveLearningGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simulationRef = useRef<d3.Simulation<GraphNode, any> | null>(null);

  // Sync node data with learner dynamic state
  const bayesTopic = learner.topics.find((t) => t.topicId === "stats-bayes");
  const regTopic = learner.topics.find((t) => t.topicId === "ml-regularization");
  const cacheTopic = learner.topics.find((t) => t.topicId === "systems-caching");

  // Initial core curriculum nodes
  const [customNodes, setCustomNodes] = useState<GraphNode[]>([]);
  const [customLinks, setCustomLinks] = useState<GraphLink[]>([]);

  const defaultNodes: GraphNode[] = useMemo(
    () => [
      {
        id: "probability-foundations",
        label: "Probability Foundations",
        course: "Applied Statistics",
        mastery: 94,
        band: "mastered",
        color: "#059669",
        nextAction: "Foundational axioms verified. Serves as prior base.",
        evidenceCount: 3,
        prerequisites: [],
        unlocks: ["stats-bayes"],
      },
      {
        id: "stats-bayes",
        label: "Bayesian Inference",
        course: "Applied Statistics",
        mastery: bayesTopic?.mastery ?? 61,
        band: bayesTopic?.misconception ? "developing" : "ready",
        color: "#E11D48", // Distinct Gap Rose
        misconception: bayesTopic?.misconception ?? "Conflating Prior Probability P(A) with Likelihood P(B|A)",
        isKnowledgeGap: true,
        gapType: "Cognitive Misconception",
        gapRootCause: "Conflating Prior Probability P(A) with Likelihood P(B|A), inducing base-rate neglect during posterior diagnosis.",
        prerequisiteBridgeAnchor: "Probability Foundations (Marginalization & Axioms)",
        bridgeSteps: [
          {
            step: 1,
            title: "Prior Baseline Anchor",
            focus: "Re-anchor baseline disease prevalence before observing diagnostic test outcome.",
            method: "Construct 100,000 population contingency matrix to contrast base priors vs test likelihoods.",
            checkQuestion: "If base prevalence is 0.1% and test specificity is 95%, what proportion of test-positives are true positives?",
          },
          {
            step: 2,
            title: "Likelihood vs Prior Deconstruction",
            focus: "Separate conditional directions: P(Test+|Disease) vs P(Disease|Test+).",
            method: "Apply Bayes rule expansion: P(A|B) = [P(B|A) · P(A)] / P(B).",
            checkQuestion: "How does the denominator P(B) normalize joint probabilities across mutally exclusive partitions?",
          },
          {
            step: 3,
            title: "Diagnostic Verification Problem",
            focus: "Full posterior computation under real clinical constraints.",
            method: "Solve for posterior P(Disease|Positive) given P(D)=0.01, P(+|D)=0.95, P(+|~D)=0.05.",
            checkQuestion: "Compute P(D|+) step-by-step: Is the result closer to 16% or 95%?",
          },
        ],
        nextAction: bayesTopic?.nextAction ?? "Complete a 3-question diagnostic and build bridge plan",
        evidenceCount: 4,
        prerequisites: ["probability-foundations"],
        unlocks: ["ml-regularization"],
      },
      {
        id: "ml-linear-models",
        label: "Linear & Loss Models",
        course: "Machine Learning",
        mastery: 91,
        band: "mastered",
        color: "#059669",
        nextAction: "Gradient descent and convex loss formulation mastered.",
        evidenceCount: 3,
        prerequisites: [],
        unlocks: ["ml-regularization"],
      },
      {
        id: "ml-regularization",
        label: "Regularization (L1 & L2)",
        course: "Machine Learning",
        mastery: regTopic?.mastery ?? 78,
        band: (regTopic?.mastery ?? 78) >= 80 ? "ready" : "developing",
        color: "#2563EB", // Cobalt
        nextAction: regTopic?.nextAction ?? "Compare L1 Lasso and L2 Ridge geometries",
        evidenceCount: 3,
        prerequisites: ["stats-bayes", "ml-linear-models"],
        unlocks: [],
      },
      {
        id: "systems-rpc",
        label: "RPC & Concurrency",
        course: "Distributed Systems",
        mastery: 88,
        band: "mastered",
        color: "#059669",
        nextAction: "Protobuf serialization and goroutine scheduling verified.",
        evidenceCount: 2,
        prerequisites: [],
        unlocks: ["systems-caching"],
      },
      {
        id: "systems-caching",
        label: "Caching Strategies",
        course: "Distributed Systems",
        mastery: cacheTopic?.mastery ?? 44,
        band: "emerging",
        color: "#E11D48", // Distinct Gap Rose
        isKnowledgeGap: true,
        gapType: "Foundational Mastery Gap",
        gapRootCause: "Stale read propagation & cache invalidation race windows during concurrent distributed RPC operations.",
        prerequisiteBridgeAnchor: "RPC & Concurrency (Serialization & Idempotent Mutexes)",
        bridgeSteps: [
          {
            step: 1,
            title: "RPC Sequence & Write Guarantees",
            focus: "Align cache eviction ordering with database transaction commits.",
            method: "Compare Cache-Aside vs Write-Through: analyze window of vulnerability if eviction happens before commit.",
            checkQuestion: "Why does evicting cache before database commit allow concurrent reads to re-populate stale data?",
          },
          {
            step: 2,
            title: "Lease Tokens & Invalidation Barriers",
            focus: "Prevent concurrent RPC workers from writing stale cache values.",
            method: "Implement cache lease version tokens and distributed redlock patterns.",
            checkQuestion: "How does a cache version token prevent delayed RPC responses from overwriting newer writes?",
          },
          {
            step: 3,
            title: "Consistency Verification Drill",
            focus: "Audit a real-world multi-region caching race scenario.",
            method: "Trace concurrent timeline across 2 RPC workers and propose an idempotent invalidation sequence.",
            checkQuestion: "What protocol guarantees eventual consistency under network partition between cache and primary store?",
          },
        ],
        nextAction: cacheTopic?.nextAction ?? "Review cache invalidation races and deploy bridge plan",
        evidenceCount: 3,
        prerequisites: ["systems-rpc"],
        unlocks: [],
      },
    ],
    [bayesTopic, regTopic, cacheTopic]
  );

  const defaultLinks: GraphLink[] = useMemo(
    () => [
      {
        source: "probability-foundations",
        target: "stats-bayes",
        label: "Prior Axiom",
      },
      {
        source: "stats-bayes",
        target: "ml-regularization",
        label: "Prior Penalty",
      },
      {
        source: "ml-linear-models",
        target: "ml-regularization",
        label: "Loss Constraint",
      },
      {
        source: "systems-rpc",
        target: "systems-caching",
        label: "Transport Base",
      },
    ],
    []
  );

  const allNodesData = useMemo(() => [...defaultNodes, ...customNodes], [defaultNodes, customNodes]);
  const allLinksData = useMemo(() => [...defaultLinks, ...customLinks], [defaultLinks, customLinks]);

  const [selectedNode, setSelectedNode] = useState<GraphNode>(() => defaultNodes[1]); // stats-bayes
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>("All");
  const [filterGapsOnly, setFilterGapsOnly] = useState<boolean>(false);

  // Bridge-Building Interactive States
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [bridgeModalNode, setBridgeModalNode] = useState<GraphNode | null>(() => defaultNodes[1]);
  const [activeBridgeStepTab, setActiveBridgeStepTab] = useState<number>(1);
  const [resolvedGaps, setResolvedGaps] = useState<Set<string>>(new Set());
  const [activeDiagnosticFeedback, setActiveDiagnosticFeedback] = useState<string | null>(null);
  const [diagnosticSelectedOpt, setDiagnosticSelectedOpt] = useState<string | null>(null);

  // Creative Physics Simulator Settings
  const [physicsPreset, setPhysicsPreset] = useState<PhysicsPreset>("balanced");
  const [chargeStrength, setChargeStrength] = useState<number>(-400);
  const [linkDistance, setLinkDistance] = useState<number>(120);
  const [showPhysicsDrawer, setShowPhysicsDrawer] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [focusLineageMode, setFocusLineageMode] = useState<boolean>(false);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [simAlpha, setSimAlpha] = useState<number>(1);

  // New Node injection modal state
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeCourse, setNewNodeCourse] = useState("Machine Learning");
  const [newNodePrereq, setNewNodePrereq] = useState("ml-regularization");

  // Keep selected node updated if nodesData changes
  useEffect(() => {
    const updated = allNodesData.find((n) => n.id === selectedNode.id);
    if (updated) {
      if (resolvedGaps.has(updated.id)) {
        setSelectedNode({
          ...updated,
          mastery: Math.max(updated.mastery, 85),
          band: "mastered",
          color: "#059669",
          isKnowledgeGap: false,
          misconception: undefined,
        });
      } else {
        setSelectedNode(updated);
      }
    }
  }, [allNodesData, selectedNode.id, resolvedGaps]);

  // Handle Preset Changes
  const applyPreset = useCallback((preset: PhysicsPreset) => {
    setPhysicsPreset(preset);
    if (preset === "orbit") {
      setChargeStrength(-650);
      setLinkDistance(160);
    } else if (preset === "lattice") {
      setChargeStrength(-220);
      setLinkDistance(85);
    } else if (preset === "zerog") {
      setChargeStrength(-180);
      setLinkDistance(140);
    } else {
      // balanced
      setChargeStrength(-400);
      setLinkDistance(120);
    }
  }, []);

  // Trigger Knowledge Shockwave Ripple Function
  const triggerShockwave = useCallback(() => {
    setPulseCount((prev) => prev + 1);
    if (simulationRef.current) {
      simulationRef.current.alpha(0.65).restart();
    }
  }, []);

  // Main D3 Force-Directed Simulation Engine
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 550;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height);

    // Active filtered nodes (with gap-only filtering and resolved gaps state support)
    let filteredNodes = allNodesData.map((d) => {
      if (resolvedGaps.has(d.id)) {
        return {
          ...d,
          mastery: Math.max(d.mastery, 85),
          band: "mastered" as const,
          color: "#059669",
          isKnowledgeGap: false,
          misconception: undefined,
        };
      }
      return { ...d };
    });

    if (filterGapsOnly) {
      const gapNodeIds = new Set(filteredNodes.filter((d) => isKnowledgeGap(d)).map((d) => d.id));
      const anchorNodeIds = new Set<string>();
      filteredNodes.forEach((d) => {
        if (gapNodeIds.has(d.id)) {
          d.prerequisites.forEach((p) => anchorNodeIds.add(p));
        }
      });
      filteredNodes = filteredNodes.filter((d) => gapNodeIds.has(d.id) || anchorNodeIds.has(d.id));
    } else if (filterCourse !== "All") {
      filteredNodes = filteredNodes.filter((d) => d.course === filterCourse);
    }

    const activeNodes: GraphNode[] = filteredNodes.map((d) => ({ ...d }));

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeLinks: GraphLink[] = allLinksData
      .filter((l) => {
        const sId = typeof l.source === "string" ? l.source : l.source.id;
        const tId = typeof l.target === "string" ? l.target : l.target.id;
        return activeNodeIds.has(sId) && activeNodeIds.has(tId);
      })
      .map((d) => ({ ...d }));

    // Container Group with Zoom Support
    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Dynamic Defs: Arrowheads & Glow Filters
    const defs = svg.append("defs");

    // Standard arrow
    defs
      .append("marker")
      .attr("id", "dependency-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 29)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94A3B8");

    // Active highlighted arrow
    defs
      .append("marker")
      .attr("id", "dependency-arrow-active")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 29)
      .attr("refY", 0)
      .attr("markerWidth", 9)
      .attr("markerHeight", 9)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#0D9488");

    // Radial gradient glow for standard selected node
    const glowGrad = defs.append("radialGradient").attr("id", "node-glow");
    glowGrad.append("stop").attr("offset", "0%").attr("stop-color", "#14B8A6").attr("stop-opacity", 0.6);
    glowGrad.append("stop").attr("offset", "100%").attr("stop-color", "#14B8A6").attr("stop-opacity", 0);

    // Distinct Radial gradient glow for Identified Knowledge Gaps
    const gapGlowGrad = defs.append("radialGradient").attr("id", "gap-glow");
    gapGlowGrad.append("stop").attr("offset", "0%").attr("stop-color", "#F43F5E").attr("stop-opacity", 0.85);
    gapGlowGrad.append("stop").attr("offset", "65%").attr("stop-color", "#E11D48").attr("stop-opacity", 0.3);
    gapGlowGrad.append("stop").attr("offset", "100%").attr("stop-color", "#E11D48").attr("stop-opacity", 0);

    // Setup Physics Forces
    const simulation = d3
      .forceSimulation<GraphNode>(activeNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(activeLinks)
          .id((d) => d.id)
          .distance(linkDistance)
      )
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(48));

    simulationRef.current = simulation;

    // Links Layer
    const linkGroup = zoomGroup
      .append("g")
      .attr("class", "links")
      .selectAll("g")
      .data(activeLinks)
      .enter()
      .append("g")
      .attr("class", "link-group");

    const linkLines = linkGroup
      .append("line")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,3")
      .attr("marker-end", "url(#dependency-arrow)");

    // Animated Energy Flow Particles along dependency lines
    const linkParticles = linkGroup
      .append("circle")
      .attr("r", 3)
      .attr("fill", "#0D9488")
      .attr("opacity", 0.85);

    // Link label
    const linkLabels = linkGroup
      .append("text")
      .text((d) => d.label || "depends on")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("fill", "#64748B")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .style("pointer-events", "none")
      .style("opacity", 0.75);

    // Nodes Layer
    const nodeGroup = zoomGroup
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(activeNodes)
      .enter()
      .append("g")
      .attr("class", "node-item cursor-pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (!isFrozen) {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Double-click to pin/unpin node
    nodeGroup.on("dblclick", (event, d) => {
      event.stopPropagation();
      if (d.fx !== null && d.fx !== undefined) {
        d.fx = null;
        d.fy = null;
      } else {
        d.fx = d.x;
        d.fy = d.y;
      }
      triggerShockwave();
    });

    // 1. Concentric Animated Ping Ring for Identified Knowledge Gaps
    nodeGroup
      .filter((d) => isKnowledgeGap(d))
      .append("circle")
      .attr("r", 34)
      .attr("fill", "none")
      .attr("stroke", "#F43F5E")
      .attr("stroke-width", 2.5)
      .attr("stroke-opacity", 0.7)
      .attr("stroke-dasharray", "4,3")
      .attr("class", "animate-ping origin-center");

    // 2. Warning Halo Pulse Aura for Identified Knowledge Gaps
    nodeGroup
      .filter((d) => isKnowledgeGap(d))
      .append("circle")
      .attr("r", 30)
      .attr("fill", "url(#gap-glow)")
      .attr("stroke", "#E11D48")
      .attr("stroke-width", 1.8)
      .attr("stroke-dasharray", "3,2")
      .attr("class", "animate-pulse");

    // Glow aura for selected node
    nodeGroup
      .filter((d) => d.id === selectedNode.id)
      .append("circle")
      .attr("r", 37)
      .attr("fill", (d) => (isKnowledgeGap(d) ? "url(#gap-glow)" : "url(#node-glow)"));

    // Outer mastery ring (track) - Distinct coral accent for knowledge gaps
    nodeGroup
      .append("circle")
      .attr("r", 24)
      .attr("fill", "#FFFFFF")
      .attr("stroke", (d) => (isKnowledgeGap(d) ? "#FDA4AF" : "#E2E8F0"))
      .attr("stroke-width", (d) => (isKnowledgeGap(d) ? 4 : 3.5));

    // Mastery progress arc
    nodeGroup
      .append("circle")
      .attr("r", 24)
      .attr("fill", "none")
      .attr("stroke", (d) => (isKnowledgeGap(d) ? "#E11D48" : d.color))
      .attr("stroke-width", (d) => (isKnowledgeGap(d) ? 4 : 3.5))
      .attr("stroke-dasharray", (d) => {
        const circumference = 2 * Math.PI * 24;
        const progress = (d.mastery / 100) * circumference;
        return `${progress} ${circumference - progress}`;
      })
      .attr("transform", "rotate(-90)");

    // Inner filled circle with distinct warning fill for knowledge gaps
    nodeGroup
      .append("circle")
      .attr("r", 17)
      .attr("fill", (d) => {
        if (d.id === selectedNode.id) {
          return isKnowledgeGap(d) ? "#E11D48" : d.color;
        }
        return isKnowledgeGap(d) ? "#FFF1F2" : "#F8FAFC";
      })
      .attr("stroke", (d) => (d.id === selectedNode.id ? "#FFFFFF" : isKnowledgeGap(d) ? "#F43F5E" : d.color))
      .attr("stroke-width", 1.5)
      .attr("class", "transition-all duration-200");

    // Node mastery score text
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("fill", (d) => {
        if (d.id === selectedNode.id) return "#FFFFFF";
        return isKnowledgeGap(d) ? "#BE123C" : "#1E293B";
      })
      .text((d) => `${d.mastery}%`);

    // Floating Distinct "BRIDGE" Badge above identified knowledge gaps
    const gapBadgeGroup = nodeGroup
      .filter((d) => isKnowledgeGap(d))
      .append("g")
      .attr("class", "gap-badge")
      .attr("transform", "translate(13, -19)");

    gapBadgeGroup
      .append("rect")
      .attr("x", -17)
      .attr("y", -7)
      .attr("width", 35)
      .attr("height", 14)
      .attr("rx", 7)
      .attr("fill", "#E11D48")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1.2)
      .attr("filter", "drop-shadow(0 2px 4px rgba(225,29,72,0.45))");

    gapBadgeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 3)
      .attr("font-size", "7.5px")
      .attr("font-weight", "800")
      .attr("font-family", "sans-serif")
      .attr("fill", "#FFFFFF")
      .text("BRIDGE");

    // Topic Label below node
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 40)
      .attr("font-size", "11px")
      .attr("font-weight", (d) => (d.id === selectedNode.id ? "700" : isKnowledgeGap(d) ? "650" : "500"))
      .attr("fill", (d) => {
        if (d.id === selectedNode.id) return "#0F172A";
        return isKnowledgeGap(d) ? "#BE123C" : "#475569";
      })
      .text((d) => (isKnowledgeGap(d) ? `⚠️ ${d.label}` : d.label));

    // Course tag below label
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 52)
      .attr("font-size", "9px")
      .attr("font-family", "sans-serif")
      .attr("fill", "#94A3B8")
      .text((d) => d.course);

    // Node Click: Select node & Trigger Focused Bridge-Building Study Plan for Knowledge Gaps
    nodeGroup.on("click", (event, d) => {
      if (event.defaultPrevented) return; // Prevent triggering click on drag release
      setSelectedNode(d);

      if (isKnowledgeGap(d)) {
        setBridgeModalNode(d);
        setActiveDiagnosticFeedback(null);
        setDiagnosticSelectedOpt(null);

        const prereqNames =
          d.prerequisites.length > 0
            ? d.prerequisites.map((pId) => allNodesData.find((n) => n.id === pId)?.label || pId).join(", ")
            : "Foundational syllabus axioms";

        const bridgePrompt = `Generate a focused 3-step Bridge-Building Study Plan for identified knowledge gap: "${d.label}" in ${d.course}.
Identified Gap / Root Cause: ${d.gapRootCause || d.misconception || `Mastery score at ${d.mastery}%, below 65% competency threshold`}.
Prerequisites to Bridge: ${prereqNames}.

Structure the response with actionable pedagogical rigor:
1. 🌉 Prerequisite Concept Bridge: Explain the missing foundational link needed to anchor this topic.
2. 🔍 Cognitive Misconception Deconstruction: Dissect where intuition breaks down with an intuitive counterexample.
3. 🛠️ 3-Step Remediation Pathway: Actionable micro-drills to close the gap from ${d.mastery}% to 85%+.
4. 📝 1 Diagnostic Check Question: A verification test problem with immediate feedback rubric.`;

        onSelectTopicPrompt(bridgePrompt);
      } else {
        const standardPrompt = `Provide a focused curriculum review, visual explanation, core mathematical intuition, and practical exam problem for "${d.label}" in ${d.course}.`;
        onSelectTopicPrompt(standardPrompt);
      }

      // Smoothly scroll to Ask CampusGenie where results will stream
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    });

    // Hover Highlight with Lineage Path Tracing
    nodeGroup.on("mouseenter", (_event, d) => {
      setHoveredNodeId(d.id);

      const relatedIds = new Set<string>([d.id, ...d.prerequisites, ...d.unlocks]);

      linkLines
        .attr("stroke", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? "#0D9488" : focusLineageMode ? "#F1F5F9" : "#E2E8F0";
        })
        .attr("stroke-width", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? 3 : 1.5;
        })
        .attr("marker-end", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? "url(#dependency-arrow-active)" : "url(#dependency-arrow)";
        });

      if (focusLineageMode) {
        nodeGroup.style("opacity", (n) => (relatedIds.has(n.id) ? 1 : 0.25));
      }
    });

    nodeGroup.on("mouseleave", () => {
      setHoveredNodeId(null);
      linkLines
        .attr("stroke", "#CBD5E1")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#dependency-arrow)");
      nodeGroup.style("opacity", 1);
    });

    // Simulation Tick Loop
    let particleT = 0;
    simulation.on("tick", () => {
      setSimAlpha(simulation.alpha());

      linkLines
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      linkLabels
        .attr("x", (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr("y", (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2);

      // Animate energy flow particles from source to target
      particleT = (particleT + 0.015) % 1;
      linkParticles
        .attr("cx", (d) => {
          const sx = (d.source as GraphNode).x ?? 0;
          const tx = (d.target as GraphNode).x ?? 0;
          return sx + (tx - sx) * particleT;
        })
        .attr("cy", (d) => {
          const sy = (d.source as GraphNode).y ?? 0;
          const ty = (d.target as GraphNode).y ?? 0;
          return sy + (ty - sy) * particleT;
        });

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [
    allNodesData,
    allLinksData,
    selectedNode.id,
    filterCourse,
    filterGapsOnly,
    resolvedGaps,
    chargeStrength,
    linkDistance,
    isFrozen,
    focusLineageMode,
    triggerShockwave,
    onSelectTopicPrompt,
  ]);

  function handleResetZoom() {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  }

  function handleZoomIn() {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.3);
  }

  function handleZoomOut() {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.75);
  }

  function handleAddCustomConcept(e: React.FormEvent) {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newNode: GraphNode = {
      id: newId,
      label: newNodeName.trim(),
      course: newNodeCourse,
      mastery: 50,
      band: "emerging",
      color: "#8B5CF6", // Violet
      nextAction: `Explore fundamentals and initial implementations of ${newNodeName.trim()}.`,
      evidenceCount: 1,
      prerequisites: [newNodePrereq],
      unlocks: [],
      isCustom: true,
    };

    const newLink: GraphLink = {
      source: newNodePrereq,
      target: newId,
      label: "Enables Concept",
    };

    setCustomNodes((prev) => [...prev, newNode]);
    setCustomLinks((prev) => [...prev, newLink]);
    setSelectedNode(newNode);
    setShowAddNodeModal(false);
    setNewNodeName("");
    triggerShockwave();
  }

  return (
    <div className="space-y-4">
      {/* Simulation Master Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[var(--line)] pb-3">
        {/* Course Filters & Gap Isolator */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["All", "Applied Statistics", "Machine Learning", "Distributed Systems"].map((c) => (
            <button
              key={c}
              onClick={() => {
                setFilterGapsOnly(false);
                setFilterCourse(c);
              }}
              className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] ${
                !filterGapsOnly && filterCourse === c
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white/80 hover:bg-white text-slate-600 border border-[var(--line)]"
              }`}
            >
              {c === "All" ? "All Topics" : c}
            </button>
          ))}

          {/* Quick Knowledge Gap Isolator Filter */}
          <button
            onClick={() => setFilterGapsOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition text-[11px] shrink-0 ${
              filterGapsOnly
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            }`}
            title="Isolate identified knowledge gaps needing bridge plans"
          >
            <AlertCircle size={12} className={filterGapsOnly ? "text-white" : "text-rose-600"} />
            <span>
              {filterGapsOnly ? "Showing Gaps" : "⚠️ Knowledge Gaps"}{" "}
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterGapsOnly ? "bg-white/20 text-white" : "bg-rose-200/80 text-rose-900"
                }`}
              >
                {allNodesData.filter((d) => isKnowledgeGap(d) && !resolvedGaps.has(d.id)).length}
              </span>
            </span>
          </button>
        </div>

        {/* Action Controls & Creative Physics Lab Trigger */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Shockwave Energy Impulse */}
          <button
            onClick={triggerShockwave}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition"
            title="Inject physical impulse shockwave into the simulation"
          >
            <Zap size={12} className="text-amber-600" />
            <span>Shockwave</span>
          </button>

          {/* Toggle Physics Lab Panel */}
          <button
            onClick={() => setShowPhysicsDrawer((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showPhysicsDrawer
                ? "bg-teal-600 text-white border-teal-700"
                : "bg-white hover:bg-slate-50 text-slate-700 border-[var(--line)]"
            }`}
            title="Tune gravity, charge repulsion, and spring forces"
          >
            <Sliders size={12} />
            <span>Physics Lab</span>
          </button>

          {/* Add Concept Node */}
          <button
            onClick={() => setShowAddNodeModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-[var(--line)] rounded-lg text-xs font-semibold transition"
            title="Inject new subject node into simulation"
          >
            <Plus size={12} className="text-teal-600" />
            <span>Add Node</span>
          </button>

          {/* Freeze / Unfreeze Gravity */}
          <button
            onClick={() => setIsFrozen((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isFrozen
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-600 border-[var(--line)] hover:text-slate-900"
            }`}
            title={isFrozen ? "Unfreeze positions" : "Freeze nodes in place"}
          >
            {isFrozen ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          {/* Zoom Controls */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-white border border-[var(--line)] text-slate-600 hover:text-slate-900 transition"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-white border border-[var(--line)] text-slate-600 hover:text-slate-900 transition"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-white border border-[var(--line)] text-slate-600 hover:text-slate-900 transition"
            title="Reset Graph Layout"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Physics Lab Sliders & Presets Drawer */}
      {showPhysicsDrawer && (
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/60 to-slate-50 p-4 space-y-3 text-xs shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-2">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                D3 Particle Mechanics Control Deck
              </span>
              <p className="text-slate-600 text-[11px]">
                Adjust Coulomb electrostatic repulsion, Hooke spring distance, and physical presets in real time.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "balanced", label: "Balanced", icon: Activity },
                { id: "orbit", label: "Cosmic Orbit", icon: Orbit },
                { id: "lattice", label: "Quantum Lattice", icon: Atom },
                { id: "zerog", label: "Zero-G Cloud", icon: Cloud },
              ].map((p) => {
                const Icon = p.icon;
                const active = physicsPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as PhysicsPreset)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Icon size={12} className={active ? "text-teal-400" : "text-slate-400"} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Charge Repulsion (Many-Body):</span>
                <span className="font-mono text-teal-700">{chargeStrength}</span>
              </div>
              <input
                type="range"
                min="-800"
                max="-100"
                step="25"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Spring Tension (Link Distance):</span>
                <span className="font-mono text-teal-700">{linkDistance}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="220"
                step="10"
                value={linkDistance}
                onChange={(e) => setLinkDistance(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={focusLineageMode}
                  onChange={(e) => setFocusLineageMode(e.target.checked)}
                  className="rounded accent-teal-600"
                />
                <span>Highlight Lineage on Hover</span>
              </label>

              <button
                onClick={triggerShockwave}
                className="px-3 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-lg font-semibold transition flex items-center gap-1"
              >
                <Flame size={12} />
                <span>Kick Physics ({pulseCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D3 Simulation Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-[var(--line)] bg-[#F8FAFC] overflow-hidden shadow-xs"
      >
        {/* Floating Futuristic HUD Telemetry */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/95 border border-slate-200 text-slate-700 rounded-md font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            D3 Force Simulation · Click Node to Ask Genie · Drag & Zoom
          </span>
          <span className="text-[10px] font-mono text-slate-500 bg-white/90 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline">
            Energy &alpha;: {simAlpha > 0.01 ? (simAlpha * 100).toFixed(0) + "%" : "Equilibrium"}
          </span>
          {hoveredNodeId && (
            <span className="text-[10px] font-mono text-teal-800 bg-teal-50/95 px-2 py-0.5 rounded border border-teal-200">
              Active lineage route highlighted
            </span>
          )}
        </div>

        <svg
          ref={svgRef}
          className="w-full h-[400px] cursor-grab active:cursor-grabbing select-none"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-mono pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered (&ge;85%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> Ready
          </span>
          <span className="flex items-center gap-1.5 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            ⚠️ Knowledge Gap (Click to Bridge)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-400" /> Prerequisite Line
          </span>
          <span className="flex items-center gap-1 text-teal-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Energy Pulse
          </span>
        </div>
      </div>

      {/* Selected Node Content Drawer */}
      {selectedNode && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs space-y-4 transition-all animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  {selectedNode.course}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id)
                      ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                      : selectedNode.band === "mastered"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : selectedNode.band === "ready"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id)
                    ? "⚠️ Knowledge Gap"
                    : selectedNode.band}
                </span>
                {selectedNode.isCustom && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                    Custom Added
                  </span>
                )}
                {resolvedGaps.has(selectedNode.id) && (
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                    <Check size={10} /> Bridge Completed
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                {selectedNode.label}
                {isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id) && (
                  <span className="text-xs font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Remediation Plan Recommended
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[var(--muted)]">Mastery Score</div>
                <div
                  className={`text-lg font-mono font-bold ${
                    isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id)
                      ? "text-rose-600"
                      : "text-slate-900"
                  }`}
                >
                  {resolvedGaps.has(selectedNode.id) ? "88%" : `${selectedNode.mastery}%`}
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                  isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id)
                    ? "bg-rose-50 border border-rose-200 text-rose-700"
                    : "bg-slate-50 border border-slate-200 text-[var(--cobalt)]"
                }`}
              >
                {resolvedGaps.has(selectedNode.id) ? "88%" : `${selectedNode.mastery}%`}
              </div>
            </div>
          </div>

          {/* =========================================================================
              FOCUSED "BRIDGE-BUILDING" STUDY PLAN MODULE (FOR IDENTIFIED KNOWLEDGE GAPS)
              ========================================================================= */}
          {isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id) && (
            <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/70 via-rose-50/30 to-amber-50/40 p-4 space-y-3.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs">
                    <GitMerge size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      🌉 Focused Bridge-Building Study Plan Active
                    </span>
                    <p className="text-rose-700 text-[11px]">
                      Targeted 3-step cognitive bridge from prerequisite foundation to eliminate misconception.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold uppercase">
                    {selectedNode.gapType || "Cognitive Misconception"}
                  </span>
                  <button
                    onClick={() => {
                      setBridgeModalNode(selectedNode);
                      setShowBridgeModal(true);
                    }}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-rose-200 transition"
                  >
                    Expand Blueprint ↗
                  </button>
                </div>
              </div>

              {/* Identified Root Cause Breakdown */}
              <div className="bg-white/90 rounded-xl p-3 border border-rose-200 text-xs text-rose-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle size={13} className="text-rose-600" />
                  Diagnosed Root Cause:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 pl-4 border-l-2 border-rose-400">
                  {selectedNode.gapRootCause ||
                    selectedNode.misconception ||
                    `Mastery score is ${selectedNode.mastery}%, below the 65% threshold required to anchor downstream curriculum topics.`}
                </p>
              </div>

              {/* Visual Prerequisite Anchor Linkage */}
              <div className="flex flex-wrap items-center gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-rose-200/80">
                <span className="font-mono text-[10px] text-slate-500 uppercase font-semibold">
                  Prerequisite Anchor:
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold text-[11px] flex items-center gap-1">
                  ✓ {selectedNode.prerequisiteBridgeAnchor || "Probability Foundations"}
                </span>
                <span className="text-rose-500 font-bold flex items-center gap-0.5 font-mono text-[11px]">
                  <ArrowRight size={12} /> [Bridge Repair Link] <ArrowRight size={12} />
                </span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded font-bold text-[11px]">
                  {selectedNode.label}
                </span>
              </div>

              {/* 3-Step Remediation Pathway Interactive Tabs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
                    <Target size={13} className="text-rose-600" /> 3-Step Bridge Pathway:
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Step {activeBridgeStepTab} of 3
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { step: 1, label: "1. Prior Anchor" },
                    { step: 2, label: "2. Deconstruction" },
                    { step: 3, label: "3. Diagnostic Check" },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setActiveBridgeStepTab(s.step)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        activeBridgeStepTab === s.step
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-white hover:bg-rose-50 text-slate-700 border border-rose-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Active Step Content */}
                {(() => {
                  const stepData = selectedNode.bridgeSteps?.find((s) => s.step === activeBridgeStepTab) ?? {
                    step: activeBridgeStepTab,
                    title: `Bridge Phase ${activeBridgeStepTab}`,
                    focus: `Remediate core mental model on ${selectedNode.label}.`,
                    method: "Work through step-by-step counterexamples and formal mathematical derivations.",
                    checkQuestion: "Verify understanding with an adaptive micro-problem.",
                  };

                  return (
                    <div className="bg-white rounded-xl p-3 border border-rose-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          Phase {stepData.step}: {stepData.title}
                        </span>
                        <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                          Recommended Drill
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">Core Focus:</span> {stepData.focus}
                      </p>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Intuitive Method:</span> {stepData.method}
                      </div>

                      {/* Interactive Verification Problem inside Step */}
                      <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                        <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                          <HelpCircle size={12} className="text-teal-600" />
                          Diagnostic Self-Check:
                        </div>
                        <p className="text-[11px] text-slate-700 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                          &quot;{stepData.checkQuestion}&quot;
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              setActiveDiagnosticFeedback(
                                "Correct! Conflating prior and likelihood produces false certainty because the prior baseline prevalence (0.1%) dominates the calculation."
                              );
                              setDiagnosticSelectedOpt("A");
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              diagnosticSelectedOpt === "A"
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Option A: Prior baseline prevalence dominates
                          </button>
                          <button
                            onClick={() => {
                              setActiveDiagnosticFeedback(
                                "Incorrect: Test accuracy alone is not the answer without weighting by base rate P(A)."
                              );
                              setDiagnosticSelectedOpt("B");
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              diagnosticSelectedOpt === "B"
                                ? "bg-rose-600 text-white border-rose-700"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Option B: High accuracy guarantees true positive
                          </button>
                        </div>

                        {activeDiagnosticFeedback && (
                          <div
                            className={`p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in ${
                              activeDiagnosticFeedback.startsWith("Correct")
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>{activeDiagnosticFeedback}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Bridge Remediation Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      const bridgePrompt = `Generate a focused 3-step Bridge-Building Study Plan for identified knowledge gap: "${selectedNode.label}" in ${selectedNode.course}.
Identified Gap / Root Cause: ${selectedNode.gapRootCause || selectedNode.misconception}.
Prerequisites to Bridge: ${selectedNode.prerequisites.join(", ")}.

Provide:
1. 🌉 Prerequisite Concept Bridge
2. 🔍 Cognitive Misconception Deconstruction with intuitive counterexample
3. 🛠️ 3-Step Remediation Pathway
4. 📝 1 Diagnostic Check Question with full derivation`;

                      onSelectTopicPrompt(bridgePrompt);
                      if (typeof window !== "undefined") {
                        window.requestAnimationFrame(() => {
                          document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles size={12} className="text-amber-200" />
                    <span>⚡ Run AI Bridge Plan in CampusGenie</span>
                  </button>

                  <button
                    onClick={() => {
                      setResolvedGaps((prev) => {
                        const next = new Set(prev);
                        next.add(selectedNode.id);
                        return next;
                      });
                      triggerShockwave();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Check size={12} />
                    <span>✓ Complete Drill (+15% Mastery)</span>
                  </button>

                  <button
                    onClick={() => {
                      setBridgeModalNode(selectedNode);
                      setShowBridgeModal(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <BookOpen size={12} />
                    <span>Full Bridge Blueprint</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standard Next Recommended Action (for non-gap nodes or bridged nodes) */}
          {(!isKnowledgeGap(selectedNode) || resolvedGaps.has(selectedNode.id)) && (
            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-900">Recommended Action:</span>{" "}
                {selectedNode.nextAction}
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {selectedNode.evidenceCount} verified citations
              </span>
            </div>
          )}

          {/* Dependency Connections List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                Prerequisites Required
              </div>
              {selectedNode.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prerequisites.map((preId) => {
                    const pre = allNodesData.find((n) => n.id === preId);
                    return (
                      <button
                        key={preId}
                        onClick={() => {
                          if (pre) setSelectedNode(pre);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono text-[11px] transition"
                      >
                        ← {pre?.label || preId}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium">
                  ✓ None (Foundational Curriculum Axiom)
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                Downstream Topics Unlocked
              </div>
              {selectedNode.unlocks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.unlocks.map((unId) => {
                    const un = allNodesData.find((n) => n.id === unId);
                    return (
                      <button
                        key={unId}
                        onClick={() => {
                          if (un) setSelectedNode(un);
                        }}
                        className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-mono text-[11px] transition"
                      >
                        → {un?.label || unId}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Capstone Synthesis Stage
                </span>
              )}
            </div>
          </div>

          {/* Trigger Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                if (isKnowledgeGap(selectedNode) && !resolvedGaps.has(selectedNode.id)) {
                  const bridgePrompt = `Generate a focused 3-step Bridge-Building Study Plan for identified knowledge gap: "${selectedNode.label}" in ${selectedNode.course}.
Identified Gap / Root Cause: ${selectedNode.gapRootCause || selectedNode.misconception}.
Prerequisites to Bridge: ${selectedNode.prerequisites.join(", ")}.`;
                  onSelectTopicPrompt(bridgePrompt);
                } else {
                  onSelectTopicPrompt(
                    `Provide a focused curriculum review, visual explanation, and concrete study action for "${selectedNode.label}" in ${selectedNode.course}.`
                  );
                }
                if (typeof window !== "undefined") {
                  window.requestAnimationFrame(() => {
                    document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  });
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles size={13} className="text-teal-400" />
              <span>Ask CampusGenie About Topic</span>
            </button>

            {onStartQuizTopic && (
              <button
                onClick={() => onStartQuizTopic(selectedNode.id)}
                className="px-3.5 py-2 bg-white border border-[var(--line)] text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 size={13} className="text-[var(--cobalt)]" />
                <span>Test in Quiz Lab</span>
              </button>
            )}

            {onOpenVoiceTutor && (
              <button
                onClick={() => onOpenVoiceTutor(selectedNode.label)}
                className="px-3.5 py-2 bg-white border border-[var(--line)] text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Mic size={13} className="text-rose-500" />
                <span>Voice Discuss</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Concept Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Inject Concept Node into Simulation</h4>
                <p className="text-slate-500 text-[11px]">Attach a custom topic to the D3 physics universe</p>
              </div>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomConcept} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Concept Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Transformer Self-Attention, Monte Carlo Tree Search"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Domain</label>
                <select
                  value={newNodeCourse}
                  onChange={(e) => setNewNodeCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Applied Statistics">Applied Statistics</option>
                  <option value="Distributed Systems">Distributed Systems</option>
                  <option value="Bioscience">Bioscience</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prerequisite Connection</label>
                <select
                  value={newNodePrereq}
                  onChange={(e) => setNewNodePrereq(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                >
                  {allNodesData.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label} ({node.course})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Sparkles size={12} />
                  <span>Spawn in Universe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dedicated Full-Screen Bridge-Building Study Plan Modal */}
      {showBridgeModal && bridgeModalNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-50 via-rose-50/40 to-slate-50 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-sm mt-0.5">
                  <GitMerge size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded">
                      Focused Bridge-Building Blueprint
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {bridgeModalNode.course}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                    {bridgeModalNode.label}
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Targeted cognitive bridge to deconstruct misconceptions and elevate mastery from {bridgeModalNode.mastery}% to 85%+.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBridgeModal(false)}
                className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Diagnosed Root Cause Callout */}
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                  <AlertTriangle size={14} className="text-rose-600" />
                  Diagnosed Knowledge Gap & Cognitive Impediment:
                </div>
                <p className="text-slate-700 text-xs leading-relaxed pl-5 border-l-2 border-rose-400">
                  {bridgeModalNode.gapRootCause ||
                    bridgeModalNode.misconception ||
                    `Mastery score of ${bridgeModalNode.mastery}% falls below prerequisite requirements for downstream topics.`}
                </p>
              </div>

              {/* Lineage Anchor Connection */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Prerequisite Foundation Anchors
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-xs border border-emerald-300">
                    ✓ {bridgeModalNode.prerequisiteBridgeAnchor || "Probability Foundations"}
                  </span>
                  <span className="text-rose-500 font-bold flex items-center gap-1 font-mono text-xs">
                    <ArrowRight size={13} /> Bridge Link <ArrowRight size={13} />
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold text-xs border border-rose-300">
                    {bridgeModalNode.label} ({bridgeModalNode.mastery}%)
                  </span>
                </div>
              </div>

              {/* 3 Bridge Steps Detailed Cards */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-rose-600" />
                  3-Step Remediation Pathway
                </h4>

                {(bridgeModalNode.bridgeSteps || [
                  {
                    step: 1,
                    title: "Foundational Anchor Repair",
                    focus: "Re-anchor prior baseline distributions and axiomatic conditions.",
                    method: "Contingency table matrix deconstruction.",
                    checkQuestion: "Identify how base-rate neglect distorts conditional inference.",
                  },
                  {
                    step: 2,
                    title: "Misconception Deconstruction",
                    focus: "Differentiate forward likelihood from inverse posterior conditional probabilities.",
                    method: "Apply Bayes expansion P(A|B) = [P(B|A)P(A)] / P(B).",
                    checkQuestion: "Calculate P(B) using the Law of Total Probability.",
                  },
                  {
                    step: 3,
                    title: "Diagnostic Verification Problem",
                    focus: "Full derivation under clinical testing constraints.",
                    method: "Solve a step-by-step diagnostic problem with quantitative verification.",
                    checkQuestion: "Compute P(Disease|Positive) given 0.1% prior and 95% test accuracy.",
                  },
                ]).map((step) => (
                  <div
                    key={step.step}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-rose-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {step.step}
                        </span>
                        {step.title}
                      </span>
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                        Phase {step.step}
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs leading-relaxed">
                      <span className="font-semibold text-slate-900">Focus:</span> {step.focus}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">Pedagogical Method:</span> {step.method}
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
                      <div className="font-semibold text-amber-900 flex items-center gap-1">
                        <HelpCircle size={11} className="text-amber-700" />
                        Verification Drill:
                      </div>
                      <p className="italic text-slate-700">&quot;{step.checkQuestion}&quot;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setResolvedGaps((prev) => {
                      const next = new Set(prev);
                      next.add(bridgeModalNode.id);
                      return next;
                    });
                    setShowBridgeModal(false);
                    triggerShockwave();
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Check size={13} />
                  <span>Mark Gap Bridged (+15% Mastery)</span>
                </button>

                {onStartQuizTopic && (
                  <button
                    onClick={() => {
                      setShowBridgeModal(false);
                      onStartQuizTopic(bridgeModalNode.id);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} className="text-[var(--cobalt)]" />
                    <span>Practice in Quiz Lab</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setShowBridgeModal(false);
                  const bridgePrompt = `Generate a focused 3-step Bridge-Building Study Plan for identified knowledge gap: "${bridgeModalNode.label}" in ${bridgeModalNode.course}.
Identified Gap / Root Cause: ${bridgeModalNode.gapRootCause || bridgeModalNode.misconception}.
Prerequisites to Bridge: ${bridgeModalNode.prerequisites.join(", ")}.

Provide:
1. 🌉 Prerequisite Concept Bridge
2. 🔍 Cognitive Misconception Deconstruction with intuitive counterexample
3. 🛠️ 3-Step Remediation Pathway
4. 📝 1 Diagnostic Check Question with full derivation`;

                  onSelectTopicPrompt(bridgePrompt);
                  if (typeof window !== "undefined") {
                    window.requestAnimationFrame(() => {
                      document.getElementById("ask-campusgenie")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    });
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ml-auto"
              >
                <Sparkles size={13} className="text-amber-200" />
                <span>⚡ Stream AI Bridge Guide in CampusGenie</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
