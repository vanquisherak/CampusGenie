"use client";

import { useState } from "react";
import {
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Bell,
  ShieldCheck,
  Sparkles,
  Calculator,
  BookOpen,
  Check,
  ChevronRight,
  QrCode,
  Search,
} from "lucide-react";

export interface SubjectAttendance {
  code: string;
  name: string;
  category: "Core Theory" | "Practical Lab" | "Professional Elective" | "Institutional";
  attended: number;
  delivered: number;
  credits: number;
  faculty: string;
  venue: string;
  mstScore?: { mst1: number; mst2: number; maxMst: number; assignment: number; maxAssignment: number };
}

export interface TimetableSlot {
  id: string;
  time: string;
  code: string;
  subject: string;
  faculty: string;
  venue: string;
  status: "completed" | "current" | "upcoming";
  type: "Lecture" | "Lab" | "Tutorial";
}

export interface CuimsNotice {
  id: string;
  title: string;
  category: "Academic" | "Examination" | "Placement" | "Hostel";
  date: string;
  department: string;
  priority: "High" | "Normal";
  summary: string;
  linkText?: string;
}

const DEFAULT_SUBJECTS: SubjectAttendance[] = [
  {
    code: "21CSH-301",
    name: "Machine Learning & Neural Networks",
    category: "Core Theory",
    attended: 28,
    delivered: 32,
    credits: 4,
    faculty: "Dr. Rajesh K. Sharma (Block B1)",
    venue: "B1-304",
    mstScore: { mst1: 18, mst2: 17, maxMst: 20, assignment: 9, maxAssignment: 10 },
  },
  {
    code: "21CSH-302",
    name: "Cloud Architecture & DevOps",
    category: "Core Theory",
    attended: 29,
    delivered: 32,
    credits: 4,
    faculty: "Prof. Ananya Sen (Block B2)",
    venue: "B2-401",
    mstScore: { mst1: 19, mst2: 18, maxMst: 20, assignment: 10, maxAssignment: 10 },
  },
  {
    code: "21CSP-305",
    name: "Advanced AI & Deep Learning Lab",
    category: "Practical Lab",
    attended: 14,
    delivered: 16,
    credits: 2,
    faculty: "Er. Gurpreet Singh",
    venue: "Lab Complex 4 (LC-402)",
    mstScore: { mst1: 19, mst2: 19, maxMst: 20, assignment: 10, maxAssignment: 10 },
  },
  {
    code: "21CSH-308",
    name: "Design & Analysis of Algorithms",
    category: "Core Theory",
    attended: 22,
    delivered: 32,
    credits: 4,
    faculty: "Dr. Vikramaditya Rathore",
    venue: "B1-205",
    mstScore: { mst1: 14, mst2: 15, maxMst: 20, assignment: 7, maxAssignment: 10 },
  },
  {
    code: "21CSH-312",
    name: "Full-Stack Distributed Systems",
    category: "Professional Elective",
    attended: 25,
    delivered: 30,
    credits: 3,
    faculty: "Prof. Priya Nair",
    venue: "B3-102",
    mstScore: { mst1: 17, mst2: 18, maxMst: 20, assignment: 9, maxAssignment: 10 },
  },
  {
    code: "21UCH-301",
    name: "Soft Skills & Career Competency",
    category: "Institutional",
    attended: 18,
    delivered: 20,
    credits: 1,
    faculty: "DCPD Corporate Trainer",
    venue: "Auditorium Hall B",
    mstScore: { mst1: 19, mst2: 18, maxMst: 20, assignment: 10, maxAssignment: 10 },
  },
];

const TODAY_TIMETABLE: TimetableSlot[] = [
  {
    id: "tt-1",
    time: "09:15 - 10:05 AM",
    code: "21CSH-301",
    subject: "Machine Learning & Neural Networks",
    faculty: "Dr. Rajesh K. Sharma",
    venue: "Block B1 · Room 304",
    status: "completed",
    type: "Lecture",
  },
  {
    id: "tt-2",
    time: "10:10 - 11:00 AM",
    code: "21CSH-308",
    subject: "Design & Analysis of Algorithms",
    faculty: "Dr. Vikramaditya Rathore",
    venue: "Block B1 · Room 205",
    status: "completed",
    type: "Lecture",
  },
  {
    id: "tt-3",
    time: "11:05 - 11:55 AM",
    code: "21CSH-302",
    subject: "Cloud Architecture & DevOps",
    faculty: "Prof. Ananya Sen",
    venue: "Block B2 · Room 401",
    status: "current",
    type: "Lecture",
  },
  {
    id: "tt-4",
    time: "12:45 - 02:25 PM",
    code: "21CSP-305",
    subject: "Advanced AI & Deep Learning Lab",
    faculty: "Er. Gurpreet Singh",
    venue: "Lab Complex 4 · LC-402",
    status: "upcoming",
    type: "Lab",
  },
  {
    id: "tt-5",
    time: "02:30 - 03:20 PM",
    code: "21UCH-301",
    subject: "Soft Skills & Mock Placement Prep",
    faculty: "DCPD Corporate Trainer",
    venue: "Auditorium Hall B",
    status: "upcoming",
    type: "Tutorial",
  },
];

const CUIMS_NOTICES: CuimsNotice[] = [
  {
    id: "nt-1",
    title: "Mid-Semester Test (MST-2) Date Sheet & Seating Matrix Announced",
    category: "Examination",
    date: "Today, 10:45 AM",
    department: "Controller of Examinations (CoE)",
    priority: "High",
    summary:
      "The official MST-2 schedule for B.Tech Computer Science & Engineering (Semester 6) has been updated on CUIMS. Ensure your minimum 75% subject attendance before hall ticket generation.",
  },
  {
    id: "nt-2",
    title: "DCPD: Microsoft & Atlassian Campus Placement Drive 2025 Registration",
    category: "Placement",
    date: "Yesterday",
    department: "Department of Career Planning & Development",
    priority: "High",
    summary:
      "Eligible candidates with CGPA >= 7.50 and no active backlogs must verify their resume link on the CUIMS placement portal by Friday 5:00 PM.",
    linkText: "View Eligibility & Role Details",
  },
  {
    id: "nt-3",
    title: "Hostel Outing E-Pass Digital QR Verification at Main Gate",
    category: "Hostel",
    date: "Oct 27, 2025",
    department: "Chief Warden Office",
    priority: "Normal",
    summary:
      "All hostel residents must submit evening outing requests via CUIMS portal at least 2 hours before gate closure. Biometric turnstile QR entry is mandatory.",
  },
  {
    id: "nt-4",
    title: "National Conference on Autonomous Agents & Generative AI (NCAA-2025)",
    category: "Academic",
    date: "Oct 24, 2025",
    department: "University Institute of Engineering (UIE)",
    priority: "Normal",
    summary:
      "Call for research papers and student posters. Full submissions accepted till Nov 15. Selected papers indexed in IEEE Xplore.",
  },
];

export function CuimsPortalHub({
  onAskQuestion,
  onAction,
}: {
  onAskQuestion?: (prompt: string) => void;
  onAction?: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"attendance" | "timetable" | "marks" | "notices" | "gatepass">("attendance");
  const [subjects, setSubjects] = useState<SubjectAttendance[]>(DEFAULT_SUBJECTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [noticeFilter, setNoticeFilter] = useState<string>("All");

  // Interactive Attendance Simulator State
  const [simTargetCode, setSimTargetCode] = useState<string>("21CSH-308");
  const [simAttendNext, setSimAttendNext] = useState<number>(4);
  const [simMissNext, setSimMissNext] = useState<number>(0);

  // MST Target Calculator State
  const [targetCgpa, setTargetCgpa] = useState<number>(9.0);

  // Overall attendance calculation
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalDelivered = subjects.reduce((acc, s) => acc + s.delivered, 0);
  const overallPercentage = totalDelivered > 0 ? (totalAttended / totalDelivered) * 100 : 0;

  // 75% Rule Calculations
  function calculateSafeBunk(attended: number, delivered: number): number {
    // A / (D + B) >= 0.75  =>  4A - 3D >= 3B  =>  B <= (4A - 3D)/3
    const bunk = Math.floor((4 * attended - 3 * delivered) / 3);
    return Math.max(0, bunk);
  }

  function calculateLecturesNeeded(attended: number, delivered: number): number {
    // (A + C) / (D + C) >= 0.75  =>  4(A + C) >= 3(D + C)  =>  C >= 3D - 4A
    const needed = 3 * delivered - 4 * attended;
    return Math.max(0, needed);
  }

  // Handle Mark Attendance for today
  function handleMarkAttendance(code: string, type: "present" | "absent") {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.code === code) {
          const newAttended = type === "present" ? s.attended + 1 : s.attended;
          const newDelivered = s.delivered + 1;
          return { ...s, attended: newAttended, delivered: newDelivered };
        }
        return s;
      })
    );
    onAction?.(
      type === "present"
        ? `Marked Present for ${code}. Attendance percentage updated.`
        : `Marked Absent for ${code}. Attendance recalculated.`
    );
  }

  // Selected subject for simulation
  const targetSubject = subjects.find((s) => s.code === simTargetCode) || subjects[0];
  const simNewAttended = targetSubject.attended + simAttendNext;
  const simNewDelivered = targetSubject.delivered + simAttendNext + simMissNext;
  const simNewPercentage = simNewDelivered > 0 ? (simNewAttended / simNewDelivered) * 100 : 0;

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.faculty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredNotices = CUIMS_NOTICES.filter((n) => {
    return noticeFilter === "All" || n.category === noticeFilter;
  });

  return (
    <div className="space-y-6">
      {/* CUIMS Official Header Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-700 text-white shadow-xs">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-red-600 font-bold">
                  CUIMS Student Home Portal · Chandigarh University
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h3 className="mt-1 font-display text-2xl text-slate-900">
                Aria Sharma <span className="text-stone-400 font-sans text-sm font-normal">(UID: 22BCS10482)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Bachelor of Engineering · Computer Science & Engineering (AIML) · Semester 6 · Section 602-B
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 px-3.5 py-2">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block font-mono">Current CGPA</span>
              <span className="font-display text-lg text-slate-900">8.74 <span className="text-xs text-emerald-600 font-sans font-medium">/ 10</span></span>
            </div>
            <div className={`rounded-xl border px-3.5 py-2 ${overallPercentage >= 75 ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"}`}>
              <span className="text-[10px] uppercase font-semibold text-stone-400 block font-mono">Avg Attendance</span>
              <span className={`font-display text-lg ${overallPercentage >= 75 ? "text-emerald-700" : "text-rose-700"}`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 px-3.5 py-2">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block font-mono">Total Credits</span>
              <span className="font-display text-lg text-slate-900">18 / 18</span>
            </div>
          </div>
        </div>

        {/* Portal Sub-Navigation Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-4">
          {[
            { id: "attendance", label: "Attendance & 75% Predictor", icon: Calculator },
            { id: "timetable", label: "Today's Timetable & Venue", icon: Calendar },
            { id: "marks", label: "MST Marks & CGPA Forecaster", icon: TrendingUp },
            { id: "notices", label: "CUIMS Circulars & Placements", icon: Bell },
            { id: "gatepass", label: "Hostel Outing E-Pass", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  onAction?.(`Switched to CUIMS ${tab.label}`);
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-stone-600 hover:text-slate-900 hover:bg-stone-100"
                }`}
              >
                <Icon size={14} className={active ? "text-teal-400" : "text-stone-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ATTENDANCE & 75% RULE PREDICTOR */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* 75% Mandatory Attendance Banner */}
          <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-r from-amber-500/10 via-stone-50 to-emerald-500/10 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-500/20 p-2 text-amber-800">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-display text-base text-slate-900">
                    Chandigarh University 75% Attendance Compliance Engine
                  </h4>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed max-w-2xl">
                    Per university regulations, maintaining minimum 75% in every individual subject is required to download your End-Term Exam admit card. Use the Safe-Bunk and Defaulter Recovery calculators below to plan your week ahead.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onAskQuestion?.(
                    "Give me a customized 7-day study and attendance strategy based on my current CUIMS subject attendance and upcoming MST exams."
                  );
                }}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Sparkles size={14} className="text-teal-400" />
                <span>Ask CampusGenie Attendance Plan</span>
              </button>
            </div>
          </div>

          {/* Interactive Attendance Simulator */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-600 font-bold">
                  What-If Attendance Simulator
                </span>
                <h4 className="font-display text-lg text-slate-900">
                  Simulate Safe Bunks & Recovery for {targetSubject.code}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500 font-medium">Select Subject:</label>
                <select
                  value={simTargetCode}
                  onChange={(e) => setSimTargetCode(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
                >
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} ({((s.attended / s.delivered) * 100).toFixed(0)}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {/* Simulator Controls */}
              <div className="space-y-4 md:col-span-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                    <span>Attend Next Lectures: <strong className="text-emerald-700">+{simAttendNext}</strong></span>
                    <span className="text-stone-400 font-mono text-[11px]">(Scheduled next 2 weeks)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={simAttendNext}
                    onChange={(e) => setSimAttendNext(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                    <span>Miss / Bunk Next Lectures: <strong className="text-rose-700">+{simMissNext}</strong></span>
                    <span className="text-stone-400 font-mono text-[11px]">(Planned leaves/events)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={simMissNext}
                    onChange={(e) => setSimMissNext(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSimAttendNext(3);
                      setSimMissNext(0);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Preset: Attend Next 3
                  </button>
                  <button
                    onClick={() => {
                      setSimAttendNext(0);
                      setSimMissNext(2);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Preset: Miss Next 2
                  </button>
                  <button
                    onClick={() => {
                      setSimAttendNext(0);
                      setSimMissNext(0);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Simulation Outcome Card */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Projected Status</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`font-display text-3xl font-bold ${simNewPercentage >= 75 ? "text-emerald-700" : "text-rose-700"}`}>
                      {simNewPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-stone-500">
                      (from {((targetSubject.attended / targetSubject.delivered) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600 leading-snug">
                    Simulated record: <strong>{simNewAttended}</strong> attended out of <strong>{simNewDelivered}</strong> total lectures.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200">
                  {simNewPercentage >= 75 ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span>Compliant (Eligible for Exams)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                      <AlertTriangle size={16} />
                      <span>Defaulter Risk (Below 75%)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subject Attendance Table with Quick Actions */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h4 className="font-display text-xl text-slate-900">Enrolled Courses Attendance Roster</h4>
                <p className="text-xs text-stone-500">Semester 6 · Continuous Assessment Data from CUIMS</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search subject or faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 sm:w-60 rounded-xl border border-stone-200 bg-stone-50/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-slate-800"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-800"
                >
                  <option value="All">All Categories</option>
                  <option value="Core Theory">Core Theory</option>
                  <option value="Practical Lab">Practical Lab</option>
                  <option value="Professional Elective">Elective</option>
                  <option value="Institutional">Institutional</option>
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredSubjects.map((s) => {
                const pct = (s.attended / s.delivered) * 100;
                const isSafe = pct >= 75;
                const safeBunks = calculateSafeBunk(s.attended, s.delivered);
                const lecturesNeeded = calculateLecturesNeeded(s.attended, s.delivered);

                return (
                  <div
                    key={s.code}
                    className={`rounded-2xl border p-4 transition hover:shadow-xs ${
                      isSafe ? "border-stone-200/80 bg-white" : "border-rose-200 bg-rose-50/20"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Course Info */}
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-stone-100 px-2 py-0.5 rounded">
                            {s.code}
                          </span>
                          <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wide">
                            {s.category} · {s.credits} Credits
                          </span>
                        </div>
                        <h5 className="font-display text-base text-slate-900 leading-tight">{s.name}</h5>
                        <p className="text-xs text-stone-500 flex items-center gap-2">
                          <span>{s.faculty}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-stone-600">
                            <MapPin size={11} /> {s.venue}
                          </span>
                        </p>
                      </div>

                      {/* Percentage & 75% Formula Verdict */}
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className={`font-display text-2xl font-bold ${isSafe ? "text-emerald-700" : "text-rose-700"}`}>
                              {pct.toFixed(1)}%
                            </span>
                            <span className="font-mono text-xs text-stone-400">
                              ({s.attended}/{s.delivered})
                            </span>
                          </div>

                          <div className="mt-1">
                            {isSafe ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                                <Check size={12} />
                                {safeBunks > 0 ? `Can safely bunk ${safeBunks} lectures` : "At 75% boundary (do not miss)"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                                <AlertTriangle size={12} />
                                Must attend next {lecturesNeeded} lectures
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Mark Present/Absent for Today */}
                        <div className="flex flex-col gap-1 border-l border-stone-200 pl-4 shrink-0">
                          <span className="text-[9px] uppercase font-mono text-stone-400 font-semibold">Today&apos;s Class</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMarkAttendance(s.code, "present")}
                              title="Mark Present for Today (+1 Attended, +1 Delivered)"
                              className="rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 p-1.5 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check size={13} />
                              <span className="text-[10px]">Present</span>
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(s.code, "absent")}
                              title="Mark Absent for Today (+0 Attended, +1 Delivered)"
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 p-1.5 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <XCircle size={13} />
                              <span className="text-[10px]">Absent</span>
                            </button>
                          </div>
                        </div>

                        {/* Link to CampusGenie Study Engine */}
                        <div className="shrink-0">
                          <button
                            onClick={() => {
                              onAskQuestion?.(
                                `Generate a structured study blueprint and high-yield revision notes for ${s.name} (${s.code}) to prepare for my upcoming MST exam.`
                              );
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                          >
                            <BookOpen size={13} className="text-[var(--cobalt)]" />
                            <span>Study Subject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TODAY'S TIMETABLE & VENUE RADAR */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--cobalt)] font-bold">
                  Daily Lecture Matrix · Even Semester
                </span>
                <h4 className="font-display text-xl text-slate-900">Today&apos;s Class Schedule & Lecture Halls</h4>
                <p className="text-xs text-stone-500">Venue, Assigned Faculty, and Live Period Indicator</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-mono text-stone-700">
                  <Calendar size={13} /> Monday · Academic Schedule
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {TODAY_TIMETABLE.map((slot) => {
                const isCurrent = slot.status === "current";
                const isCompleted = slot.status === "completed";

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl border p-4.5 transition-all ${
                      isCurrent
                        ? "border-teal-500/50 bg-teal-50/20 shadow-md ring-1 ring-teal-500/20"
                        : isCompleted
                        ? "border-stone-200/60 bg-stone-50/50 opacity-80"
                        : "border-stone-200/80 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`mt-0.5 rounded-xl p-2.5 text-center shrink-0 w-28 ${
                            isCurrent
                              ? "bg-teal-600 text-white font-bold"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          <span className="font-mono text-[10px] uppercase block tracking-wider">
                            {isCurrent ? "● Live Now" : isCompleted ? "Completed" : "Upcoming"}
                          </span>
                          <span className="font-mono text-xs font-bold">{slot.time}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-stone-100 px-2 py-0.5 rounded">
                              {slot.code}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-stone-500">
                              {slot.type}
                            </span>
                          </div>
                          <h5 className="font-display text-base text-slate-900 mt-0.5">{slot.subject}</h5>
                          <p className="text-xs text-stone-500 flex items-center gap-3 mt-1">
                            <span>{slot.faculty}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-mono text-stone-700 font-semibold bg-stone-100/80 px-2 py-0.5 rounded">
                              <MapPin size={11} className="text-red-500" /> {slot.venue}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onAskQuestion?.(
                              `Provide a 5-minute pre-lecture executive summary for my ${slot.subject} class in ${slot.venue}. Focus on the core intuition, key equations, and high-frequency exam questions.`
                            );
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                        >
                          <Sparkles size={13} className="text-teal-400" />
                          <span>Pre-Class Briefing</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MST INTERNAL MARKS & CGPA FORECASTER */}
      {activeTab === "marks" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 font-bold">
                  Internal Assessment & Evaluation
                </span>
                <h4 className="font-display text-xl text-slate-900">Mid-Semester Tests (MST-1 & MST-2) Tracker</h4>
                <p className="text-xs text-stone-500">Internal component: 40 Marks (MSTs + Assignments + Attendance)</p>
              </div>

              {/* Target CGPA Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-600">Semester Target CGPA:</span>
                <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
                  {[8.5, 9.0, 9.5].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setTargetCgpa(grade)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        targetCgpa === grade
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-stone-500 hover:text-slate-900"
                      }`}
                    >
                      {grade.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {subjects.map((sub) => {
                const mst = sub.mstScore;
                if (!mst) return null;
                const totalInternal = (mst.mst1 + mst.mst2) / 2 + mst.assignment + (sub.attended / sub.delivered >= 0.85 ? 5 : 3);
                // In CU system: 40 internal + 60 end term = 100
                const targetEndTerm = Math.max(30, Math.min(60, Math.round(targetCgpa * 10 - totalInternal)));

                return (
                  <div key={sub.code} className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-stone-200 px-2 py-0.5 rounded">
                          {sub.code}
                        </span>
                        <h5 className="font-display text-base text-slate-900 mt-1">{sub.name}</h5>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        {totalInternal.toFixed(0)} / 40 Internal
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-white border border-stone-200/80 p-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">MST 1</span>
                        <span className="font-display text-sm font-bold text-slate-900">{mst.mst1} / 20</span>
                      </div>
                      <div className="rounded-xl bg-white border border-stone-200/80 p-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">MST 2</span>
                        <span className="font-display text-sm font-bold text-slate-900">{mst.mst2} / 20</span>
                      </div>
                      <div className="rounded-xl bg-white border border-stone-200/80 p-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Assignments</span>
                        <span className="font-display text-sm font-bold text-slate-900">{mst.assignment} / 10</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 text-white p-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-teal-300 block uppercase">
                          Target for {targetCgpa.toFixed(1)} Grade (O / A+)
                        </span>
                        <span>Need min <strong>{targetEndTerm} / 60</strong> in End-Term Exam</span>
                      </div>
                      <button
                        onClick={() => {
                          onAskQuestion?.(
                            `I have ${totalInternal.toFixed(0)}/40 internal marks in ${sub.name}. I need ${targetEndTerm}/60 in End-Term to secure an A+ grade. Break down the highest-scoring question types and recommended study plan.`
                          );
                        }}
                        className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-teal-300 transition"
                      >
                        Plan Score
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUIMS CIRCULARS & NOTICES */}
      {activeTab === "notices" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-rose-700 font-bold">
                  Official CU Broadcasts
                </span>
                <h4 className="font-display text-xl text-slate-900">University Circulars & DCPD Placement Bulletins</h4>
                <p className="text-xs text-stone-500">Verified announcements from Chandigarh University departments</p>
              </div>

              <div className="flex gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-xl">
                {["All", "Examination", "Placement", "Academic", "Hostel"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeFilter(cat)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      noticeFilter === cat
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-stone-500 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/30 p-4.5 hover:bg-white transition hover:shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            notice.category === "Examination"
                              ? "bg-amber-100 text-amber-800"
                              : notice.category === "Placement"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-stone-200 text-stone-800"
                          }`}
                        >
                          {notice.category}
                        </span>
                        <span className="font-mono text-xs text-stone-400">{notice.date}</span>
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs font-medium text-stone-500">{notice.department}</span>
                      </div>

                      <h5 className="font-display text-base text-slate-900">{notice.title}</h5>
                      <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">{notice.summary}</p>
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => {
                          onAskQuestion?.(
                            `Analyze this university notice: "${notice.title}". Tell me the immediate deadlines, eligibility requirements, and action items for my student profile.`
                          );
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-teal-700 transition"
                      >
                        <span>Extract Action Items</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HOSTEL OUTING E-PASS & DIGITAL GATEWAY */}
      {activeTab === "gatepass" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="border-b border-stone-100 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-teal-700 font-bold">
                Student Welfare & Campus Services
              </span>
              <h4 className="font-display text-xl text-slate-900">Hostel Outing E-Pass & Biometric Gate Clearance</h4>
              <p className="text-xs text-stone-500">Official digital verification pass for Chandigarh University gates</p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_.8fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-400">Active Outing Request</span>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="font-display text-lg text-slate-900">Evening Market / Library Outing</span>
                      <p className="text-xs text-stone-500">Gate Pass ID: CU-OUT-2025-94812</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 size={13} /> Approved by Warden
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200/80 pt-3 text-xs">
                    <div>
                      <span className="text-stone-400 font-mono text-[10px] uppercase block">Departure Window</span>
                      <span className="font-semibold text-slate-800">Today, 05:00 PM - 08:30 PM</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-mono text-[10px] uppercase block">Hostel Block</span>
                      <span className="font-semibold text-slate-800">Sukhna Hostel · Room 412</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 p-5 text-xs text-stone-600 space-y-2">
                  <h6 className="font-semibold text-slate-900">Campus Entry & Exit Guidelines:</h6>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Scan this QR code at Main Gate 1 or Gate 2 biometric turnstiles.</li>
                    <li>Students must return to campus before 08:30 PM sharp to avoid attendance flag.</li>
                    <li>For overnight leave requests, parent SMS verification is required on CUIMS.</li>
                  </ul>
                </div>
              </div>

              {/* Digital QR Code Card */}
              <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white text-center flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-400 font-bold">
                  Digital Turnstile Pass
                </span>
                <div className="my-4 rounded-xl bg-white p-4 shadow-lg">
                  {/* High visual fidelity QR representation */}
                  <div className="w-40 h-40 bg-slate-900 rounded-lg grid grid-cols-6 grid-rows-6 p-2 gap-1">
                    <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-teal-400 col-span-2 row-span-1" />
                    <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-white col-span-1 row-span-2" />
                    <div className="bg-teal-300 col-span-1 row-span-1" />
                    <div className="bg-white col-span-1 row-span-2" />
                    <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-teal-400 col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-white col-span-2 row-span-1" />
                    <div className="bg-white col-span-1 row-span-1" />
                    <div className="bg-teal-400 col-span-1 row-span-1" />
                  </div>
                </div>
                <span className="font-mono text-xs text-stone-300">UID: 22BCS10482 · ARIA SHARMA</span>
                <p className="mt-1 text-[11px] text-teal-300">Valid for Gate Turnstile Scanner</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
