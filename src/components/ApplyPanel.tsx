"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BookmarkButton, WhyPanel } from "./DriveCard";
import CircularScore from "./CircularScore";
import { Modal, StatusBadge, daysLeft, formatDate } from "./ui";
import { useAuth } from "./Providers";
import { evaluate } from "@/lib/eligibility";
import { loadProfile } from "@/lib/profile-store";
import type { DriveDTO, EvalResult } from "@/lib/types";

/** Sticky sidebar on the drive detail page: deadline, eligibility and Apply/Register. */
export default function ApplyPanel({ drive }: { drive: DriveDTO }) {
  const { user, appliedIds, markApplied } = useAuth();
  const router = useRouter();
  const [ev, setEv] = useState<EvalResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (p) setEv(evaluate(p, drive));
  }, [drive]);

  const dl = daysLeft(drive.deadline);
  const closed = dl < 0;
  const applied = appliedIds.includes(drive.id);

  const apply = async () => {
    setBusy(true);
    const res = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driveId: drive.id }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirm(false);
    if (res.ok) {
      markApplied(drive.id);
      toast.success(`Applied to ${drive.company.name}! Track it on your dashboard.`);
    } else if (res.status === 409) {
      markApplied(drive.id);
      toast.info(data.error);
    } else toast.error(data.error ?? "Could not submit your application.");
  };

  const onApplyClick = () => {
    if (!user) {
      toast.info("Please log in to apply.");
      router.push(`/login?next=${encodeURIComponent(`/companies/${drive.id}`)}`);
      return;
    }
    setConfirm(true);
  };

  return (
    <aside className="card sticky top-24 space-y-5 p-5" aria-label="Apply">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-extrabold">{drive.packageLpa} <span className="text-base font-semibold">LPA</span></p>
          <p className="muted text-sm">{drive.openings} openings</p>
        </div>
        <BookmarkButton driveId={drive.id} />
      </div>

      <div className={`flex items-center gap-3 rounded-xl p-3 text-sm ${closed ? "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300" : dl <= 7 ? "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200" : "bg-slate-50 dark:bg-slate-800/60"}`}>
        <CalendarClock className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{closed ? "Applications closed" : `${dl} day${dl === 1 ? "" : "s"} left`}</p>
          <p className="text-xs opacity-80">Deadline: {formatDate(drive.deadline)}</p>
        </div>
      </div>

      {ev ? (
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <CircularScore value={ev.score} size={84} stroke={8} />
            <div>
              <p className="mb-1 text-sm font-semibold">Your match</p>
              <StatusBadge status={ev.status} />
            </div>
          </div>
          <button onClick={() => setShowWhy((s) => !s)} aria-expanded={showWhy} className="mt-3 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            {showWhy ? "Hide details" : "Why? See matched & missing criteria"}
          </button>
          {showWhy && <div className="mt-3"><WhyPanel ev={ev} /></div>}
        </div>
      ) : (
        <Link href="/eligibility" className="block rounded-xl border border-dashed border-indigo-300 p-4 text-sm text-indigo-800 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-200 dark:hover:bg-indigo-500/10">
          <b>Check your eligibility</b> for this drive — it takes 2 minutes.
        </Link>
      )}

      {applied ? (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" /> Applied — <Link href="/dashboard" className="underline">track status</Link>
        </div>
      ) : (
        <button onClick={onApplyClick} disabled={closed} className="btn-primary w-full !py-3">
          {closed ? "Closed" : "Apply / Register"}
        </button>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Apply to ${drive.company.name}`}>
        <p className="muted text-sm">
          You&apos;re registering for <b>{drive.role}</b>. Your saved profile
          {ev ? ` (${ev.score}% match)` : ""} will be shared with the placement team.
        </p>
        {ev && ev.status !== "eligible" && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            Heads up: you don&apos;t meet every criterion. You can still apply, but the recruiter may not shortlist you.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setConfirm(false)} className="btn-ghost">Cancel</button>
          <button onClick={apply} disabled={busy} className="btn-primary">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm application
          </button>
        </div>
      </Modal>
    </aside>
  );
}
