"use client";

import { useEffect, useState } from "react";
import { BarChart3, BookOpenCheck, CalendarClock, CheckCircle2, ExternalLink, FlaskConical, Library, ShieldCheck, Sparkles, Users } from "lucide-react";

const workspaces = ["Overview", "Quiz Lab", "Study Planner", "Project Explorer", "Faculty View", "Institutional Tools"] as const;
type Workspace = (typeof workspaces)[number];

const projects = [
  { title: "Campus energy forecasting", fit: "92% fit", reason: "Builds statistics confidence while using your Python strength.", tag: "Data + sustainability" },
  { title: "Accessible study companion", fit: "84% fit", reason: "Connects your HCI interest to a real student need.", tag: "Product + research" },
  { title: "Low-latency course search", fit: "79% fit", reason: "Turns caching practice into a measurable systems project.", tag: "Systems" },
];

export function AcademicWorkspaces({ requestedWorkspace, onStatus }: { requestedWorkspace?: Workspace; onStatus?: (message: string) => void }) {
  const [workspace, setWorkspace] = useState<Workspace>(requestedWorkspace ?? "Overview");
  const [notice, setNotice] = useState("Choose a workspace to begin.");

  useEffect(() => {
    if (requestedWorkspace) setWorkspace(requestedWorkspace);
  }, [requestedWorkspace]);

  function updateNotice(message: string) {
    setNotice(message);
    onStatus?.(message);
  }

  return (
    <section id="workspaces" className="mt-12">
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-1">
        {workspaces.map((item) => (
          <button key={item} onClick={() => setWorkspace(item)} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold transition ${workspace === item ? "border-[var(--cobalt)] text-[var(--cobalt)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-[var(--paper-deep)] px-4 py-3 text-xs text-[var(--muted)]" aria-live="polite"><span>{notice}</span><button className="font-semibold text-[var(--cobalt)]" onClick={() => updateNotice("CampusGenie has saved this workspace to your study queue.")}>Save workspace</button></div>
      <div className="mt-6">
        {workspace === "Overview" && <OverviewPanel onAction={updateNotice} />}
        {workspace === "Quiz Lab" && <QuizPanel onComplete={() => updateNotice("Quiz result recorded. Your Bayesian inference mastery signal is ready for review.")} />}
        {workspace === "Study Planner" && <PlannerPanel />}
        {workspace === "Project Explorer" && <ProjectPanel onSelect={(title) => updateNotice(`${title} added to your project shortlist.`)} />}
        {workspace === "Faculty View" && <FacultyPanel />}
        {workspace === "Institutional Tools" && <InstitutionalPanel onAction={updateNotice} />}
      </div>
    </section>
  );
}

function OverviewPanel({ onAction }: { onAction: (message: string) => void }) {
  return <div className="grid gap-4 md:grid-cols-3"><WorkspaceCard onClick={() => onAction("Assistant ready. Ask a curriculum-aware question above.")} icon={<Sparkles size={18} />} title="Ask CampusGenie" text="Explain, quiz, plan, or find an approved campus resource." action="Open assistant" /><WorkspaceCard onClick={() => onAction("Evidence ledger opened. Recommendations are linked to curriculum sources.")} icon={<BookOpenCheck size={18} />} title="Evidence-led answers" text="Every recommendation carries curriculum context and source evidence." action="View evidence" /><WorkspaceCard onClick={() => onAction("Permission checks are active for student read and recommendation actions.")} icon={<ShieldCheck size={18} />} title="Institution-ready" text="CU-LMS and CUIMS context stays behind SSO and permission checks." action="Review permissions" /></div>;
}

function QuizPanel({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const answers = ["The starting belief before data", "How compatible evidence is with a hypothesis", "The final updated belief", "The confidence in a quiz score"];
  const submit = () => { if (selected === null) return; setSubmitted(true); onComplete(); };
  return <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]"><div className="rounded-2xl bg-[var(--ink)] p-6 text-white"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--mint)]">Adaptive diagnostic · 01 / 05</span><BookOpenCheck size={18} className="text-[var(--coral)]" /></div><h3 className="mt-8 font-display text-3xl">What does the likelihood describe?</h3><div className="mt-7 space-y-2">{answers.map((answer, index) => <button key={answer} onClick={() => setSelected(index)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${selected === index ? "border-[var(--mint)] bg-white/10" : "border-white/15 hover:border-[var(--mint)]"}`}><span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 font-mono text-[10px]">{String.fromCharCode(65 + index)}</span>{answer}</button>)}</div><button disabled={selected === null || submitted} onClick={submit} className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50">{submitted ? "Recorded" : "Submit answer"}</button></div><div className="rounded-2xl border border-[var(--line)] bg-white/40 p-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Quiz agent plan</p><div className="mt-6 space-y-4">{["Map to Bayesian inference outcome", "Check prior misconception", "Generate one worked example", "Update mastery evidence"].map((step) => <div key={step} className="flex items-center gap-3 text-sm"><CheckCircle2 size={17} className="text-[var(--cobalt)]" />{step}</div>)}</div>{submitted && <p className="mt-6 text-xs text-[var(--cobalt)]">Answer submitted. Mastery evidence queued for the learner model.</p>}</div></div>;
}

function PlannerPanel() {
  const [planned, setPlanned] = useState<string[]>([]);
  const sessions = [["Thu", "Bayes diagnostic", "25 min", "bg-[var(--coral)]"], ["Fri", "Prior vs likelihood", "45 min", "bg-[var(--cobalt)]"], ["Sat", "Regularization lab", "60 min", "bg-[var(--mint)]"], ["Sun", "Project scoping", "90 min", "bg-[var(--ink)]"]];
  return <div className="rounded-2xl border border-[var(--line)] bg-white/40 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Next 7 days</p><h3 className="mt-2 font-display text-3xl">A plan that responds to evidence.</h3></div><span className="rounded-full bg-[var(--mint)] px-3 py-1 font-mono text-[10px] uppercase">{planned.length}/4 sessions started</span></div><div className="mt-7 grid gap-3 md:grid-cols-4">{sessions.map(([day, title, time, color]) => <button key={day} onClick={() => setPlanned((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} className={`rounded-xl bg-[var(--paper-deep)] p-4 text-left transition hover:-translate-y-0.5 ${planned.includes(day) ? "ring-2 ring-[var(--cobalt)]" : ""}`}><div className={`mb-7 h-1.5 w-8 rounded-full ${color}`} /><p className="font-mono text-[10px] uppercase text-[var(--muted)]">{day}</p><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-2 text-xs text-[var(--muted)]">{time} · {planned.includes(day) ? "started" : "start session"}</p></button>)}</div></div>;
}

function ProjectPanel({ onSelect }: { onSelect: (title: string) => void }) {
  return <div><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Project radar</p><h3 className="mt-2 font-display text-3xl">Ideas matched to your next skill.</h3></div><FlaskConical className="text-[var(--coral)]" /></div><div className="grid gap-4 md:grid-cols-3">{projects.map((project) => <article key={project.title} className="rounded-2xl border border-[var(--line)] bg-white/40 p-5"><div className="flex items-center justify-between"><span className="rounded-full bg-[var(--mint)] px-2 py-1 font-mono text-[10px]">{project.fit}</span><ExternalLink size={15} className="text-[var(--muted)]" /></div><h4 className="mt-8 font-display text-xl">{project.title}</h4><p className="mt-3 text-sm leading-5 text-[var(--muted)]">{project.reason}</p><p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-[var(--cobalt)]">{project.tag}</p><button onClick={() => onSelect(project.title)} className="mt-5 w-full rounded-full bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--cobalt)]">Shortlist project</button></article>)}</div></div>;
}

function FacultyPanel() {
  return <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]"><div className="rounded-2xl border border-[var(--line)] bg-white/40 p-6"><div className="flex items-center gap-3"><Users className="text-[var(--cobalt)]" /><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">Faculty view</p><h3 className="mt-1 font-display text-2xl">Course health snapshot</h3></div></div><div className="mt-7 grid grid-cols-3 gap-3">{[["84%", "outcome coverage"], ["72%", "weekly activity"], ["18", "signals to review"]].map(([value, label]) => <div key={label} className="rounded-xl bg-[var(--paper-deep)] p-4"><p className="font-display text-3xl">{value}</p><p className="mt-2 text-xs leading-4 text-[var(--muted)]">{label}</p></div>)}</div></div><div className="rounded-2xl bg-[var(--ink)] p-6 text-white"><div className="flex items-center gap-3"><BarChart3 className="text-[var(--mint)]" /><h3 className="font-display text-2xl">Quality metrics</h3></div><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/60">Response accuracy</span><strong>91%</strong></div><div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/60">Task completion</span><strong>78%</strong></div><div className="flex justify-between"><span className="text-white/60">Median latency</span><strong>1.8s</strong></div></div></div></div>;
}

function InstitutionalPanel({ onAction }: { onAction: (message: string) => void }) {
  const tools = [
    ["CU-LMS course context", "Read enrolled courses, modules, and deadlines", "CU-LMS"],
    ["Library search", "Find approved books, papers, and reading lists", "Library"],
    ["Timetable and assignments", "Read upcoming classes and assignment status", "Academic systems"],
    ["Approved project resources", "Find datasets, labs, and project equipment", "Project services"],
  ];
  return <div><div className="mb-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--muted)]">MCP integration gateway</p><h3 className="mt-2 font-display text-3xl">Institutional tools, with permission.</h3><p className="mt-2 max-w-[650px] text-sm leading-6 text-[var(--muted)]">Each connector is read-only in this MVP and expects institutional SSO. Tool calls create audit receipts before production write actions are enabled.</p></div><div className="grid gap-3 md:grid-cols-2">{tools.map(([title, description, system]) => <button key={title} onClick={() => onAction(`${title} requested. CampusGenie will ask for institutional SSO before reading ${system} data.`)} className="rounded-2xl border border-[var(--line)] bg-white/45 p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--cobalt)]"><div className="flex items-center justify-between"><span className="rounded-full bg-[var(--mint)] px-2 py-1 font-mono text-[10px] uppercase">read-only</span><Library size={16} className="text-[var(--cobalt)]" /></div><h4 className="mt-6 font-display text-xl">{title}</h4><p className="mt-2 text-sm leading-5 text-[var(--muted)]">{description}</p><p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{system} · SSO required</p></button>)}</div></div>;
}

function WorkspaceCard({ icon, title, text, action, onClick }: { icon: React.ReactNode; title: string; text: string; action: string; onClick: () => void }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-white/40 p-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--paper-deep)] text-[var(--cobalt)]">{icon}</div><h3 className="mt-5 font-display text-xl">{title}</h3><p className="mt-2 text-sm leading-5 text-[var(--muted)]">{text}</p><button onClick={onClick} className="mt-5 text-xs font-semibold text-[var(--cobalt)]">{action} <span aria-hidden="true">→</span></button></div>;
}
