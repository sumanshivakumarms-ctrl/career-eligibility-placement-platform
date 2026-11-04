"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import CircularScore from "./CircularScore";
import { ProgressBar } from "./ui";
import { useAuth } from "./Providers";
import { APTITUDE, INTERVIEW, RESUME_TIPS, ROADMAPS } from "@/lib/guidance";

type ResumeResult = {
  score: number;
  wordCount: number;
  foundSkills: string[];
  fileName?: string;
  checks: { label: string; ok: boolean; points: number; max: number; tip: string }[];
};

/* ---------- Resume upload + ATS score ---------- */
function ResumeChecker() {
  const { refresh, user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsText, setNeedsText] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!/\.(pdf|docx?|txt|md)$/i.test(f.name)) return void toast.error("Please upload a PDF, DOCX or TXT file.");
    if (f.size > 5 * 1024 * 1024) return void toast.error("File must be under 5 MB.");
    setFile(f);
    setResult(null);
    setNeedsText(false);
    toast.success(`${f.name} ready to analyse`);
  };

  const analyse = async () => {
    if (!file && text.trim().length < 80) return void toast.error("Upload a resume or paste at least a few lines of text.");
    setBusy(true);
    const form = new FormData();
    if (file) form.append("file", file);
    if (text.trim()) form.append("text", text);
    try {
      const res = await fetch("/api/resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsText) setNeedsText(true);
        toast.error(data.error ?? "Could not analyse the resume.");
      } else {
        setResult(data);
        toast.success(`ATS score: ${data.score}/100`);
        if (user) refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold">ATS resume score</h3>
      <p className="muted mt-1 text-sm">Upload your resume for an instant, ATS-style analysis. Your file is analysed in memory and not stored.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`mt-5 flex flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-300 dark:border-slate-700"}`}
      >
        <UploadCloud className="h-10 w-10 text-indigo-600" aria-hidden="true" />
        <p className="mt-2 font-semibold">Drag &amp; drop your resume here</p>
        <p className="muted text-sm">PDF, DOCX or TXT · up to 5 MB</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-outline mt-4">Choose file</button>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="sr-only" aria-label="Upload resume" onChange={(e) => pick(e.target.files?.[0])} />
        {file && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800">
            <FileText className="h-4 w-4" /> {file.name}
            <button onClick={() => setFile(null)} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="resume-text" className="label">{needsText ? "We couldn't read the file — paste your resume text here" : "Or paste your resume text (optional)"}</label>
        <textarea id="resume-text" rows={needsText ? 8 : 4} className={`input ${needsText ? "input-error" : ""}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the plain text of your resume…" />
      </div>
      <button onClick={analyse} disabled={busy} className="btn-primary mt-4">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Analyse resume
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="mx-auto text-center">
            <CircularScore value={result.score} size={150} label="ATS score" />
            <p className="muted mt-2 text-xs">{result.wordCount} words</p>
          </div>
          <ul className="space-y-2">
            {result.checks.map((c) => (
              <li key={c.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${c.ok ? "bg-emerald-500" : c.points > 0 ? "bg-amber-500" : "bg-red-500"}`}>
                      {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                    {c.label}
                  </span>
                  <span className="muted text-xs">{c.points}/{c.max}</span>
                </div>
                {!c.ok && <p className="muted mt-1 pl-7 text-xs">{c.tip}</p>}
              </li>
            ))}
            {result.foundSkills.length > 0 && (
              <li className="pt-2 text-xs"><b>Skills detected:</b> {result.foundSkills.join(", ")}</li>
            )}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- Aptitude quiz ---------- */
function AptitudeQuiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = APTITUDE[i];

  const next = () => {
    if (i + 1 >= APTITUDE.length) setDone(true);
    else { setI(i + 1); setPicked(null); }
  };
  const reset = () => { setI(0); setPicked(null); setScore(0); setDone(false); };

  if (done)
    return (
      <div className="card p-8 text-center">
        <CircularScore value={Math.round((score / APTITUDE.length) * 100)} label={`${score}/${APTITUDE.length} correct`} />
        <h3 className="mt-4 text-xl font-bold">{score >= 8 ? "Excellent!" : score >= 5 ? "Good effort!" : "Keep practising!"}</h3>
        <p className="muted mt-1 text-sm">Aim for 8+ before your next online assessment.</p>
        <button onClick={reset} className="btn-primary mt-5"><RotateCcw className="h-4 w-4" /> Try again</button>
      </div>
    );

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold">Question {i + 1} of {APTITUDE.length}</span>
        <span className="muted">Score: {score}</span>
      </div>
      <ProgressBar value={((i + 1) / APTITUDE.length) * 100} label="Quiz progress" />
      <h3 className="mt-6 text-lg font-semibold">{q.q}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Answer options">
        {q.options.map((o, idx) => {
          const state = picked === null ? "" : idx === q.answer ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : idx === picked ? "border-red-500 bg-red-50 dark:bg-red-500/10" : "opacity-60";
          return (
            <button key={o} role="radio" aria-checked={picked === idx} disabled={picked !== null} onClick={() => { setPicked(idx); if (idx === q.answer) setScore((s) => s + 1); }} className={`rounded-xl border border-slate-300 p-4 text-left text-sm font-medium transition hover:border-indigo-400 dark:border-slate-700 ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10" role="status">
          <p className="font-semibold">{picked === q.answer ? "✅ Correct!" : "❌ Not quite."}</p>
          <p className="mt-1">{q.explain}</p>
          <button onClick={next} className="btn-primary mt-3 !py-2">{i + 1 >= APTITUDE.length ? "See results" : "Next question"}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Main tabs ---------- */
const TABS = ["Resume", "Interview prep", "Aptitude practice", "Roadmaps"] as const;

export default function GuidanceTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resume");
  const [roadmap, setRoadmap] = useState(0);
  const [openQ, setOpenQ] = useState<string | null>(null);

  return (
    <div>
      <div role="tablist" aria-label="Guidance sections" className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`chip whitespace-nowrap !px-5 !py-2 text-sm ${tab === t ? "chip-on" : ""}`}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "Resume" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-xl font-bold">Resume tips that get shortlisted</h2>
                {RESUME_TIPS.map((t, i) => (
                  <div key={t.title} className="card flex gap-4 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                    <div>
                      <h3 className="font-semibold">{t.title}</h3>
                      <p className="muted mt-0.5 text-sm">{t.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ResumeChecker />
            </div>
          )}

          {tab === "Interview prep" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {INTERVIEW.map((g) => (
                <div key={g.group} className="card p-5">
                  <h2 className="mb-3 text-lg font-bold">{g.group}</h2>
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {g.items.map((it) => {
                      const id = g.group + it.q;
                      const open = openQ === id;
                      return (
                        <li key={id} className="py-3">
                          <button onClick={() => setOpenQ(open ? null : id)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left text-sm font-semibold">
                            {it.q}
                            <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
                          </button>
                          {open && <p className="muted mt-2 text-sm leading-relaxed">{it.a}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {tab === "Aptitude practice" && (
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-4 text-xl font-bold">Quick aptitude quiz</h2>
              <AptitudeQuiz />
            </div>
          )}

          {tab === "Roadmaps" && (
            <div>
              <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Choose a role">
                {ROADMAPS.map((r, i) => (
                  <button key={r.role} aria-pressed={roadmap === i} onClick={() => setRoadmap(i)} className={`chip !px-4 !py-1.5 text-sm ${roadmap === i ? "chip-on" : ""}`}>{r.role}</button>
                ))}
              </div>
              <ol className="relative max-w-3xl space-y-5 border-l-2 border-indigo-200 pl-8 dark:border-indigo-500/30">
                {ROADMAPS[roadmap].steps.map((s, i) => (
                  <motion.li key={s.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="card relative p-5">
                    <span className="absolute -left-[2.9rem] top-5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ring-4 ring-slate-50 dark:ring-slate-950">{i + 1}</span>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">{s.time}</span>
                    </div>
                    <p className="muted mt-1 text-sm">{s.detail}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
