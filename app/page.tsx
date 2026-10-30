"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, BrainCircuit, Check, ChevronRight, CircleHelp, Compass, FlaskConical, Library, Menu, MessageCircle, Network, Sparkles, Target, X } from "lucide-react";
import { demoEvidence, demoLearner } from "@/lib/demo-data";
import { AcademicWorkspaces } from "@/components/AcademicWorkspaces";

const navigation = [
  { label: "Overview", icon: Compass, active: true },
  { label: "Study Studio", icon: BookOpen },
  { label: "Quiz Lab", icon: CircleHelp },
  { label: "Project Radar", icon: FlaskConical },
  { label: "Institutional Tools", icon: Library },
];

const activity = [
  { title: "Bayesian inference diagnostic", meta: "12 min ago", status: "3/5 correct", color: "bg-coral" },
  { title: "Regularization study note", meta: "Yesterday", status: "Mastery +8%", color: "bg-cobalt" },
  { title: "Library guide connected", meta: "Oct 27", status: "12 sources", color: "bg-mint" },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [assistantReply, setAssistantReply] = useState("");
  const [agentTrace, setAgentTrace] = useState<string[]>([]);
  const [assistantConfidence, setAssistantConfidence] = useState<number | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const workspaceTarget = activeNav === "Project Radar" ? "Project Explorer" : activeNav === "Study Studio" ? "Study Planner" : activeNav;

  function selectNavigation(label: string) {
    setActiveNav(label);
    setSidebarOpen(false);
    window.requestAnimationFrame(() => document.getElementById("workspaces")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setIsAsking(true);
    setAssistantReply("");
    setAgentTrace([]);
    setAssistantConfidence(null);
    void fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, learner: demoLearner }) })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? `Assistant request failed with HTTP ${response.status}`);
        return result as { answer?: string; agentsUsed?: string[]; confidence?: number; provider?: string; providerMessage?: string };
      })
      .then((result: { answer?: string; agentsUsed?: string[]; confidence?: number; provider?: string; providerMessage?: string }) => {
        setAssistantReply(result.answer ?? "Your request was added to the adaptive study queue.");
        setAgentTrace(result.agentsUsed ?? []);
        setAssistantConfidence(result.confidence ?? null);
        if (result.providerMessage) setAssistantReply((current) => `${current}\n\n${result.providerMessage}`);
      })
      .catch((error: Error) => setAssistantReply(`CampusGenie could not complete the request: ${error.message}`))
      .finally(() => setIsAsking(false));
    setMessage("");
  }

  return (
    <main className="min-h-screen lg:flex">
      <div className="noise" />
      <aside className={`fixed inset-y-0 left-0 z-30 w-[276px] overflow-y-auto border-r border-[var(--line)] bg-[var(--paper)] px-7 py-7 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ink)] text-[var(--paper)]"><Network size={18} /></div><span className="font-display text-xl">CampusGenie</span></div>
          <button aria-label="Close navigation" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="mt-14"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.2em] text-[var(--muted)]">Your workspace</p><nav className="space-y-1">{navigation.map(({ label, icon: Icon }) => { const active = activeNav === label; return <button key={label} onClick={() => selectNavigation(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]"}`}><Icon size={17} strokeWidth={active ? 2.3 : 1.8} /><span>{label}</span>{label === "Institutional Tools" && <span className="ml-auto h-2 w-2 rounded-full bg-[var(--mint)]" />}</button>; })}</nav></div>
        <div className="mt-10 rounded-2xl bg-[var(--paper-deep)] p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--muted)]">Term progress</span><Target size={15} className="text-[var(--cobalt)]" /></div><div className="mb-2 flex items-end justify-between"><span className="font-display text-3xl">68%</span><span className="text-xs text-[var(--muted)]">4 of 6 outcomes</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-[68%] rounded-full bg-[var(--cobalt)]" /></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">You are on pace for your strongest term yet.</p></div>
      </aside>
      {sidebarOpen && <button aria-label="Close navigation overlay" className="fixed inset-0 z-20 bg-[var(--ink)]/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-9">
        <header className="flex items-center justify-between"><button aria-label="Open navigation" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button><div className="hidden items-center gap-2 text-sm text-[var(--muted)] sm:flex"><span className="h-2 w-2 rounded-full bg-[var(--mint)]" /> Atlas workspace <ChevronRight size={14} /> Overview</div><div className="flex items-center gap-4"><span className="hidden text-xs text-[var(--muted)] sm:inline">Thursday, Oct 29, 2026</span><div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--coral)] font-display text-sm text-white">AS</div></div></header>
        <div className="mx-auto max-w-[1210px]">
          <div className="reveal mt-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[var(--cobalt)]">Thursday focus · 02</p><h1 className="max-w-[650px] font-display text-5xl leading-[.98] tracking-[-.03em] sm:text-6xl">Make the difficult<br /><em className="text-[var(--coral)]">part</em> visible.</h1></div><div className="max-w-[250px] text-sm leading-6 text-[var(--muted)]">CampusGenie shapes your learning path by what you understand, not just what you have opened.</div></div>
          <div className="mt-12 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <section className="reveal delay-1 overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--mint)]">Current study mission</p><h2 className="mt-5 max-w-[450px] font-display text-3xl leading-tight sm:text-4xl">Untangle Bayesian inference before Friday.</h2></div><Sparkles className="text-[var(--coral)]" size={22} /></div><div className="mt-10 flex flex-col justify-between gap-6 border-t border-white/15 pt-5 sm:flex-row sm:items-end"><div><p className="text-xs text-white/50">Recommended because</p><p className="mt-1 text-sm">Your confidence is low where the next module begins.</p></div><button onClick={() => selectNavigation("Quiz Lab")} className="flex items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mint)]">Start diagnostic <ArrowUpRight size={16} /></button></div></section>
            <section className="reveal delay-2 rounded-2xl border border-[var(--line)] bg-white/40 p-6 sm:p-8"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Learner signal</p><BrainCircuit size={19} className="text-[var(--cobalt)]" /></div><div className="mt-7 flex items-end gap-3"><span className="font-display text-6xl">61</span><span className="mb-2 text-sm text-[var(--muted)]">/ 100<br />current mastery</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--paper-deep)]"><div className="h-full w-[61%] rounded-full bg-[var(--coral)]" /></div><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--coral)]" />One misconception detected: prior probability vs likelihood.</div></section>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.15fr]">
            <section className="reveal delay-2"><div className="mb-6 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">The learning graph</p><h2 className="mt-2 font-display text-3xl">Three topics in motion</h2></div><button onClick={() => setAssistantReply("Graph view: Bayesian inference depends on probability foundations; regularization follows Bayesian inference.")} className="text-xs font-semibold text-[var(--cobalt)]">View graph <ArrowUpRight className="ml-1 inline" size={14} /></button></div><div className="space-y-3">{demoLearner.topics.map((topic, index) => <div key={topic.topicId} className="group flex items-center gap-4 border-b border-[var(--line)] py-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-[var(--cobalt)] text-white" : index === 1 ? "bg-[var(--coral)] text-white" : "bg-[var(--mint)]"}`}><span className="font-mono text-xs">0{index + 1}</span></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="truncate text-sm font-semibold">{topic.topic}</h3><span className="font-mono text-xs text-[var(--muted)]">{topic.mastery}%</span></div><p className="mt-1 text-xs text-[var(--muted)]">{topic.course} · {topic.nextAction}</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--paper-deep)]"><div className={`h-full rounded-full ${index === 0 ? "bg-[var(--cobalt)]" : index === 1 ? "bg-[var(--coral)]" : "bg-[var(--mint)]"}`} style={{ width: `${topic.mastery}%` }} /></div></div><ChevronRight size={17} className="text-[var(--muted)] transition group-hover:translate-x-1" /></div>)}</div></section>
            <section className="reveal delay-3"><div className="mb-6 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Ask CampusGenie</p><h2 className="mt-2 font-display text-3xl">What are you working through?</h2></div><span className="rounded-full bg-[var(--mint)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider">RAG live</span></div><form onSubmit={submitPrompt} className="relative"><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="e.g. Show me why the prior matters in this problem..." className="h-32 w-full resize-none rounded-2xl border border-[var(--line)] bg-white/60 p-5 text-sm leading-6 outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--cobalt)]" /><button aria-label="Send question" disabled={isAsking} className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--ink)] text-white transition hover:bg-[var(--cobalt)] disabled:cursor-wait disabled:opacity-50">{isAsking ? <span className="h-3 w-3 animate-pulse rounded-full bg-white" /> : <ArrowUpRight size={17} />}</button></form>{isAsking && <div className="mt-3 text-xs text-[var(--cobalt)]">CampusGenie is mapping your question to curriculum evidence...</div>}{sent && !isAsking && <div className="mt-3 flex items-center gap-2 text-xs text-[var(--cobalt)]"><Check size={14} /> Added to your adaptive study queue.</div>}{assistantReply && <div className="mt-3 whitespace-pre-line rounded-xl bg-[var(--paper-deep)] p-4 text-sm leading-6"><p>{assistantReply}</p>{agentTrace.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3"><span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">Agent trace</span>{agentTrace.map((agent) => <span key={agent} className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-[var(--cobalt)]">{agent}</span>)}{assistantConfidence !== null && <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">confidence {Math.round(assistantConfidence * 100)}%</span>}</div>}</div>}<div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setMessage("Explain prior probability with a visual analogy") } className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]">Explain with an analogy</button><button onClick={() => setMessage("Create a 5-question diagnostic for Bayesian inference") } className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]">Make a diagnostic</button></div></section>
          </div>
          <div className="mt-14 grid gap-5 border-t border-[var(--line)] pt-8 md:grid-cols-[.8fr_1.2fr]"><section><div className="mb-5 flex items-center gap-2"><MessageCircle size={17} className="text-[var(--cobalt)]" /><h2 className="font-display text-2xl">Recent activity</h2></div><div className="space-y-1">{activity.map((item) => <div key={item.title} className="flex items-center gap-3 border-b border-[var(--line)] py-3"><span className={`h-2 w-2 rounded-full ${item.color}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-[var(--muted)]">{item.meta}</p></div><span className="font-mono text-[10px] text-[var(--muted)]">{item.status}</span></div>)}</div></section><section className="rounded-2xl bg-[var(--paper-deep)] p-6"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Evidence trail</p><h2 className="mt-2 font-display text-2xl">Why this recommendation?</h2></div><Library size={19} className="text-[var(--cobalt)]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{demoEvidence.map((evidence) => <div key={evidence.id} className="rounded-xl bg-white/60 p-3"><p className="text-xs font-semibold leading-4">{evidence.title}</p><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[var(--muted)]">{evidence.excerpt}</p></div>)}</div></section></div>
          <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white/45 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--cobalt)] text-white"><Library size={17} /></div><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Institutional connection</p><h2 className="mt-1 font-display text-xl">CU-LMS / CUIMS context</h2><p className="mt-1 max-w-[560px] text-xs leading-5 text-[var(--muted)]">Course resources and identity context will connect through institutional SSO. CampusGenie never stores portal session keys in the application.</p></div></div><a href="https://lms.cuchd.in/" target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--ink)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--ink)] hover:text-white">Open CU-LMS <ArrowUpRight size={14} /></a></section>
          <AcademicWorkspaces requestedWorkspace={workspaceTarget as "Overview" | "Quiz Lab" | "Study Planner" | "Project Explorer" | "Faculty View" | "Institutional Tools"} onStatus={setAssistantReply} />
        </div>
      </section>
    </main>
  );
}