"use client";

/** Reusable multi-step form shell with an animated progress bar and stepper. */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { ProgressBar } from "./ui";

export type Step = { id: string; title: string; icon: ReactNode };

export default function StepForm({
  steps,
  current,
  onBack,
  onNext,
  onSubmit,
  submitting,
  submitLabel = "Submit",
  children,
}: {
  steps: Step[];
  current: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}) {
  const last = current === steps.length - 1;
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">
            Step {current + 1} of {steps.length}
          </span>
          <span className="muted">{Math.round(pct)}% complete</span>
        </div>
        <ProgressBar value={pct} label="Form progress" />
        <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s.id} aria-current={i === current ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                  i < current
                    ? "bg-emerald-500 text-white"
                    : i === current
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-600/20"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {i < current ? <Check className="h-4 w-4" /> : s.icon}
              </span>
              <span className={`text-xs font-medium ${i === current ? "text-indigo-700 dark:text-indigo-300" : "muted"}`}>{s.title}</span>
            </li>
          ))}
        </ol>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          last ? onSubmit() : onNext();
        }}
      >
        <div className="p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
          <button type="button" onClick={onBack} disabled={current === 0} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </>
            ) : last ? (
              submitLabel
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
