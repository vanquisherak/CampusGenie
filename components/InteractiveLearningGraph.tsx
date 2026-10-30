"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Mic,
} from "lucide-react";
import type { LearningState } from "@/lib/curriculum/types";

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  course: string;
  mastery: number;
  band: "mastered" | "ready" | "developing" | "emerging";
  color: string;
  misconception?: string;
  nextAction: string;
  evidenceCount: number;
  prerequisites: string[];
  unlocks: string[];
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

export function InteractiveLearningGraph({
  learner,
  onSelectTopicPrompt,
  onStartQuizTopic,
  onOpenVoiceTutor,
}: InteractiveLearningGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync node data with learner dynamic state
  const bayesTopic = learner.topics.find((t) => t.topicId === "stats-bayes");
  const regTopic = learner.topics.find((t) => t.topicId === "ml-regularization");
  const cacheTopic = learner.topics.find((t) => t.topicId === "systems-caching");

  const nodesData: GraphNode[] = useMemo(() => [
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
      color: "#E11D48", // Coral
      misconception: bayesTopic?.misconception,
      nextAction: bayesTopic?.nextAction ?? "Complete a 3-question diagnostic",
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
      color: "#0D9488", // Teal/Mint
      nextAction: cacheTopic?.nextAction ?? "Review cache invalidation and write policies",
      evidenceCount: 3,
      prerequisites: ["systems-rpc"],
      unlocks: [],
    },
  ], [bayesTopic, regTopic, cacheTopic]);

  const linksData: GraphLink[] = useMemo(() => [
    {
      source: "probability-foundations",
      target: "stats-bayes",
      label: "Axiom Prior",
    },
    {
      source: "stats-bayes",
      target: "ml-regularization",
      label: "Prior Weight Penalty",
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
  ], []);

  const [selectedNode, setSelectedNode] = useState<GraphNode>(() => nodesData[1]); // Default to stats-bayes
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>("All");

  // Keep selected node updated if nodesData changes
  useEffect(() => {
    const updated = nodesData.find((n) => n.id === selectedNode.id);
    if (updated) setSelectedNode(updated);
  }, [nodesData, selectedNode.id]);

  // D3 Force-Directed Graph Simulation Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 550;
    const height = 380;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Setup SVG viewBox
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    // Filter nodes if course filter active
    const activeNodes: GraphNode[] =
      filterCourse === "All"
        ? nodesData.map((d) => ({ ...d }))
        : nodesData.filter((d) => d.course === filterCourse).map((d) => ({ ...d }));

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeLinks: GraphLink[] = linksData
      .filter((l) => activeNodeIds.has(typeof l.source === "string" ? l.source : l.source.id) &&
                     activeNodeIds.has(typeof l.target === "string" ? l.target : l.target.id))
      .map((d) => ({ ...d }));

    // Container Group with Zoom Support
    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 2.5])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Arrowhead marker definition
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "dependency-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94A3B8");

    defs
      .append("marker")
      .attr("id", "dependency-arrow-active")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#2563EB");

    // Force Simulation Setup
    const simulation = d3
      .forceSimulation<GraphNode>(activeNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(activeLinks)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-380))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(44));

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

    // Link label pill
    const linkLabels = linkGroup
      .append("text")
      .text((d) => d.label || "depends on")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("fill", "#64748B")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
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
            d.fx = null;
            d.fy = null;
          })
      );

    // Misconception warning pulse ring for Bayesian inference
    nodeGroup
      .filter((d) => Boolean(d.misconception))
      .append("circle")
      .attr("r", 29)
      .attr("fill", "none")
      .attr("stroke", "#E11D48")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("class", "animate-ping origin-center");

    // Outer mastery indicator ring (background track)
    nodeGroup
      .append("circle")
      .attr("r", 23)
      .attr("fill", "#FFFFFF")
      .attr("stroke", "#E2E8F0")
      .attr("stroke-width", 3.5);

    // Mastery progress arc
    nodeGroup
      .append("circle")
      .attr("r", 23)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 3.5)
      .attr("stroke-dasharray", (d) => {
        const circumference = 2 * Math.PI * 23;
        const progress = (d.mastery / 100) * circumference;
        return `${progress} ${circumference - progress}`;
      })
      .attr("transform", "rotate(-90)");

    // Inner filled circle
    nodeGroup
      .append("circle")
      .attr("r", 17)
      .attr("fill", (d) => (d.id === selectedNode.id ? d.color : "#F8FAFC"))
      .attr("stroke", (d) => (d.id === selectedNode.id ? "#FFFFFF" : d.color))
      .attr("stroke-width", 1.5)
      .attr("class", "transition-all duration-200");

    // Node icon / mastery text inside
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("fill", (d) => (d.id === selectedNode.id ? "#FFFFFF" : "#1E293B"))
      .text((d) => `${d.mastery}%`);

    // Topic Label below node
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 38)
      .attr("font-size", "11px")
      .attr("font-weight", (d) => (d.id === selectedNode.id ? "700" : "500"))
      .attr("fill", (d) => (d.id === selectedNode.id ? "#0F172A" : "#475569"))
      .text((d) => d.label);

    // Course tag badge below label
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 50)
      .attr("font-size", "9px")
      .attr("font-family", "sans-serif")
      .attr("fill", "#94A3B8")
      .text((d) => d.course);

    // Click handler: Select Node and trigger topic content
    nodeGroup.on("click", (_event, d) => {
      setSelectedNode(d);
    });

    // Hover effect: highlight connected prerequisites & successors
    nodeGroup.on("mouseenter", (_event, d) => {
      setHoveredNodeId(d.id);
      linkLines
        .attr("stroke", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? "#2563EB" : "#E2E8F0";
        })
        .attr("stroke-width", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? 3 : 1.5;
        })
        .attr("marker-end", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id
            ? "url(#dependency-arrow-active)"
            : "url(#dependency-arrow)";
        });
    });

    nodeGroup.on("mouseleave", () => {
      setHoveredNodeId(null);
      linkLines
        .attr("stroke", "#CBD5E1")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#dependency-arrow)");
    });

    // Tick update loop
    simulation.on("tick", () => {
      linkLines
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      linkLabels
        .attr("x", (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr("y", (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2);

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodesData, linksData, selectedNode.id, filterCourse]);

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

  return (
    <div className="space-y-4">
      {/* Graph Toolbar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[var(--line)] pb-3">
        {/* Course Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["All", "Applied Statistics", "Machine Learning", "Distributed Systems"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCourse(c)}
              className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] ${
                filterCourse === c
                  ? "bg-slate-900 text-white"
                  : "bg-white/80 hover:bg-white text-slate-600 border border-[var(--line)]"
              }`}
            >
              {c === "All" ? "All Topics" : c}
            </button>
          ))}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
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

      {/* Interactive D3 Canvas Container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-[var(--line)] bg-[#F8FAFC] overflow-hidden shadow-xs"
      >
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/90 border border-slate-200 text-slate-600 rounded-md font-semibold">
            D3 Force-Directed Simulation · Drag & Zoom
          </span>
          {hoveredNodeId && (
            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Tracing dependency route
            </span>
          )}
        </div>

        <svg
          ref={svgRef}
          className="w-full h-[380px] cursor-grab active:cursor-grabbing select-none"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-mono pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered (&ge;85%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Active Focus
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-400" /> Prerequisite Line
          </span>
        </div>
      </div>

      {/* Selected Node Content Drawer / Triggered Context Card */}
      {selectedNode && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs space-y-3 transition-all animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  {selectedNode.course}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedNode.band === "mastered"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : selectedNode.band === "ready"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {selectedNode.band}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                {selectedNode.label}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[var(--muted)]">Mastery Score</div>
                <div className="text-lg font-mono font-bold text-slate-900">
                  {selectedNode.mastery}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-sm text-[var(--cobalt)]">
                {selectedNode.mastery}%
              </div>
            </div>
          </div>

          {/* Misconception Alert if Present */}
          {selectedNode.misconception && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Active Cognitive Misconception:</span>{" "}
                {selectedNode.misconception}. CampusGenie recommends clearing this prior to proceeding with downstream Regularization constraints.
              </div>
            </div>
          )}

          {/* Next Recommended Learning Action */}
          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-900">Recommended Action:</span>{" "}
              {selectedNode.nextAction}
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {selectedNode.evidenceCount} verified citations
            </span>
          </div>

          {/* Dependency Connections List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                Prerequisites Required
              </div>
              {selectedNode.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prerequisites.map((preId) => {
                    const pre = nodesData.find((n) => n.id === preId);
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
                    const un = nodesData.find((n) => n.id === unId);
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
                onSelectTopicPrompt(
                  `Provide a focused curriculum review, visual explanation, and concrete study action for "${selectedNode.label}" in ${selectedNode.course}.`
                );
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-teal-400" />
              <span>Ask CampusGenie About Topic</span>
            </button>

            {onStartQuizTopic && (
              <button
                onClick={() => onStartQuizTopic(selectedNode.id)}
                className="px-3.5 py-2 bg-white border border-[var(--line)] text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} className="text-[var(--cobalt)]" />
                <span>Test in Quiz Lab</span>
              </button>
            )}

            {onOpenVoiceTutor && (
              <button
                onClick={() => onOpenVoiceTutor(selectedNode.label)}
                className="px-3.5 py-2 bg-white border border-[var(--line)] text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <Mic size={13} className="text-rose-500" />
                <span>Voice Discuss</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
