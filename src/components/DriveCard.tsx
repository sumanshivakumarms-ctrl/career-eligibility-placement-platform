"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, CalendarClock, Check, ChevronDown, MapPin, Minus, Plus, Scale, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import type { DriveDTO, EvalResult } from "@/lib/types";
import { Badge, CompanyLogo, ProgressBar, StatusBadge, daysLeft, formatDate } from "./ui";
import { useAuth } from "./Providers";

export function BookmarkButton({ driveId, className = "" }: { driveId: number; className?: string }) {
  const { user, savedIds, toggleSaved } = useAuth();
  const router = useRouter();
  const saved = savedIds.includes(driveId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved jobs" : "Save job"}
      className={`rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${saved ? "text-indigo-600" : "text-slate-500"} ${className}`}
      onClick={async () => {
        if (!user) {
          toast.info("Log in to save jobs.");
          router.push("/login?next=" + encodeURIComponent(window.location.pathname));
          return;
        }
        const r = await toggleSaved(driveId);
        if (r === null) toast.error("Couldn't update saved jobs.");
        else toast.success(r ? "Saved to your dashboard" : "Removed from saved jobs");
      }}
    >
      <Bookmark className={`h-5 w-5 ${saved ? "fill-indigo-600" : ""}`} />
    </button>
  );
}

/** "Why?" section – matched vs missing criteria and suggestions. */
export function WhyPanel({ ev }: { ev: EvalResult }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        {ev.checks.map((c) => (
          <div key={c.key} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-emerald-500" : "bg-red-500"} text-white`}>
              {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            <div>
              <p className="font-semibold">{c.label}</p>
              <p className="muted text-xs">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {(ev.matchedSkills.length > 0 || ev.missingSkills.length > 0) && (
        <div className="space-y-2">
          {ev.matchedSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Matched:</span>
              {ev.matchedSkills.map((s) => (
                <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{s}</span>
              ))}
            </div>
          )}
          {ev.missingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">Missing:</span>
              {ev.missingSkills.map((s) => (
                <span key={s} className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-500/10 dark:text-red-300">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="muted">Score breakdown:</span>
        <span>CGPA <b>{ev.breakdown.cgpa}</b>/30</span>
        <span>Skills <b>{ev.breakdown.skills}</b>/40</span>
        <span>Branch <b>{ev.breakdown.branch}</b>/20</span>
        <span>Other <b>{ev.breakdown.other}</b>/10</span>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="mb-1.5 font-semibold text-indigo-900 dark:text-indigo-200">How to improve</p>
        <ul className="list-disc space-y-1 pl-5 text-slate-800 dark:text-slate-200">
          {ev.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DriveCard({
  drive,
  evaluation,
  compared,
  onCompareToggle,
  compareDisabled,
}: {
  drive: DriveDTO;
  evaluation?: EvalResult;
  compared?: boolean;
  onCompareToggle?: () => void;
  compareDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dl = daysLeft(drive.deadline);
  const closed = dl < 0;
  const barColor = !evaluation ? "bg-indigo-600" : evaluation.status === "eligible" ? "bg-emerald-500" : evaluation.status === "almost" ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.article layout initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} className="card card-hover flex flex-col p-5">
      <div className="flex items-start gap-3">
        <CompanyLogo initials={drive.company.initials} color={drive.company.color} name={drive.company.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold leading-tight">{drive.role}</h3>
          <p className="muted truncate text-sm">{drive.company.name}</p>
        </div>
        <BookmarkButton driveId={drive.id} className="-mr-2 -mt-1" />
      </div>

      {evaluation && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <StatusBadge status={evaluation.status} />
            <span className="text-sm font-bold">{evaluation.score}% match</span>
          </div>
          <ProgressBar value={evaluation.score} color={barColor} label={`${evaluation.score}% match`} />
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <dt className="sr-only">Package</dt>
          <dd className="font-semibold">{drive.packageLpa} LPA</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">{drive.location}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <dt className="sr-only">Deadline</dt>
          <dd className={closed ? "text-red-600" : dl <= 7 ? "font-medium text-amber-700 dark:text-amber-400" : ""}>
            {closed ? "Closed" : `${formatDate(drive.deadline)} · ${dl}d`}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge>{drive.jobType}</Badge>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>CGPA ≥ {drive.minCgpa.toFixed(1)}</Badge>
        <Badge>Backlogs ≤ {drive.maxBacklogs}</Badge>
        {drive.skills.slice(0, 3).map((s) => (
          <Badge key={s} className="!bg-indigo-50 !text-indigo-800 dark:!bg-indigo-500/10 dark:!text-indigo-300">{s}</Badge>
        ))}
        {drive.skills.length > 3 && <Badge>+{drive.skills.length - 3}</Badge>}
      </div>

      {evaluation && (
        <>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            Why? <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3">
                  <WhyPanel ev={evaluation} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link href={`/companies/${drive.id}`} className="btn-primary flex-1 !py-2">
          {closed ? "View details" : "View & Apply"}
        </Link>
        {onCompareToggle && (
          <button
            onClick={onCompareToggle}
            disabled={compareDisabled && !compared}
            aria-pressed={compared}
            title={compared ? "Remove from comparison" : "Add to comparison"}
            className={`btn-outline !px-3 !py-2 ${compared ? "!border-indigo-600 !bg-indigo-50 !text-indigo-700 dark:!bg-indigo-500/10" : ""}`}
          >
            {compared ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <Scale className="h-4 w-4" />
            <span className="sr-only">{compared ? "Remove from comparison" : "Compare"}</span>
          </button>
        )}
      </div>
    </motion.article>
  );
}

export function DriveCardSkeleton() {
  return (
    <div className="card space-y-4 p-5" aria-hidden="true">
      <div className="flex gap-3">
        <div className="skeleton h-12 w-12" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-2 w-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton h-4" />
        <div className="skeleton h-4" />
      </div>
      <div className="skeleton h-9 w-full" />
    </div>
  );
}
