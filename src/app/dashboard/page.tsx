"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Bell, Bookmark, BriefcaseBusiness, CalendarClock, Check, Lock, Medal, Rocket, Send, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { BookmarkButton } from "@/components/DriveCard";
import { CompanyLogo, EmptyState, ErrorState, ProgressBar, Skeleton, daysLeft, formatDate } from "@/components/ui";
import { useAuth } from "@/components/Providers";
import { profileCompletion } from "@/lib/eligibility";
import { loadProfile } from "@/lib/profile-store";
import { APPLICATION_STATUSES, type DriveDTO, type Profile } from "@/lib/types";

type AppRow = { id: number; status: string; matchScore: number | null; createdAt: string; updatedAt: string; drive: DriveDTO };
type Note = { id: number; title: string; message: string; link: string | null; read: boolean; createdAt: string };
type Data = { profile: Partial<Profile> | null; saved: DriveDTO[]; applications: AppRow[]; notifications: Note[] };

const FLOW = ["Applied", "Shortlisted", "Interview", "Selected"];

function StatusTracker({ status }: { status: string }) {
  if (status === "Rejected")
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-300">Not selected this time — keep going, check other drives!</p>;
  const idx = Math.max(0, FLOW.indexOf(status));
  return (
    <ol className="flex items-center" aria-label={`Status: ${status}`}>
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <span className="flex flex-col items-center gap-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= idx ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"} ${status === "Selected" && i === idx ? "!bg-emerald-500" : ""}`}>
              {i < idx || (status === "Selected" && i === idx) ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`text-[11px] ${i === idx ? "font-semibold" : "muted"}`}>{s}</span>
          </span>
          {i < FLOW.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 ${i < idx ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`} />}
        </li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load your dashboard.");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login?next=/dashboard");
    else load();
  }, [authLoading, user, router, load]);

  const profile = useMemo(() => (data ? ((data.profile?.degree ? data.profile : loadProfile()) as Partial<Profile> | null) : null), [data]);
  const completion = profileCompletion(profile ? { ...profile, resumeScore: data?.profile?.resumeScore } : null);

  const upcoming = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, DriveDTO>();
    [...data.saved, ...data.applications.map((a) => a.drive)].forEach((d) => map.set(d.id, d));
    return [...map.values()].filter((d) => daysLeft(d.deadline) >= 0 && daysLeft(d.deadline) <= 30).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
  }, [data]);

  const markRead = async () => {
    await fetch("/api/dashboard", { method: "PATCH" });
    setData((d) => d && { ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) });
    toast.success("All notifications marked as read");
  };

  if (authLoading || (user && !data && !error))
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  if (!user) return null;
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error} onRetry={load} /></div>;

  const apps = data.applications;
  const resumeScore = (data.profile?.resumeScore as number | undefined) ?? 0;
  const badges = [
    { name: "Profile Starter", desc: "Completed the eligibility checker", icon: Rocket, earned: !!profile?.degree },
    { name: "Skill Builder", desc: "Added 5+ skills", icon: Star, earned: (profile?.skills?.length ?? 0) >= 5 },
    { name: "Resume Ready", desc: "ATS score 70+", icon: Medal, earned: resumeScore >= 70 },
    { name: "First Step", desc: "Applied to a drive", icon: Send, earned: apps.length >= 1 },
    { name: "Go-Getter", desc: "Applied to 3+ drives", icon: Trophy, earned: apps.length >= 3 },
    { name: "Shortlisted", desc: "Got shortlisted", icon: Award, earned: apps.some((a) => ["Shortlisted", "Interview", "Selected"].includes(a.status)) },
  ];
  const earned = badges.filter((b) => b.earned).length;
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="muted mt-2">Track your profile, saved jobs and applications.</p>
        </div>
        <Link href="/eligibility" className="btn-primary">{profile?.degree ? "Update profile" : "Complete profile"}</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile completion */}
        <section className="card p-6" aria-labelledby="pc">
          <h2 id="pc" className="font-bold">Profile strength</h2>
          <p className="mt-3 text-4xl font-extrabold">{completion.pct}%</p>
          <div className="mt-2"><ProgressBar value={completion.pct} color={completion.pct >= 80 ? "bg-emerald-500" : "bg-indigo-600"} label="Profile completion" height="h-2.5" /></div>
          <ul className="mt-4 space-y-2 text-sm">
            {completion.items.map((i) => (
              <li key={i.label} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${i.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800"}`}>{i.done ? <Check className="h-3 w-3" /> : null}</span>
                <span className={i.done ? "" : "muted"}>{i.label}</span>
              </li>
            ))}
          </ul>
          <p className="muted mt-4 text-xs">Tip: check your resume on <Link href="/guidance" className="font-semibold text-indigo-700 underline dark:text-indigo-300">Career Guidance</Link>.</p>
        </section>

        {/* Badges */}
        <section className="card p-6" aria-labelledby="bd">
          <div className="flex items-center justify-between">
            <h2 id="bd" className="font-bold">Badges &amp; milestones</h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">{earned}/{badges.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <motion.div key={b.name} whileHover={{ scale: 1.05 }} title={b.desc} className={`flex flex-col items-center rounded-xl p-3 text-center ${b.earned ? "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200" : "bg-slate-100 text-slate-500 dark:bg-slate-800/60"}`}>
                {b.earned ? <b.icon className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
                <span className="mt-1.5 text-[11px] font-semibold leading-tight">{b.name}</span>
                <span className="sr-only">{b.earned ? "Earned" : "Locked"}: {b.desc}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
            <div><p className="text-xl font-bold">{apps.length}</p><p className="muted text-xs">Applied</p></div>
            <div><p className="text-xl font-bold">{data.saved.length}</p><p className="muted text-xs">Saved</p></div>
            <div><p className="text-xl font-bold">{apps.filter((a) => a.status === "Selected").length}</p><p className="muted text-xs">Selected</p></div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card flex flex-col p-6" aria-labelledby="nt">
          <div className="flex items-center justify-between">
            <h2 id="nt" className="flex items-center gap-2 font-bold"><Bell className="h-5 w-5" /> Notifications {unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread}</span>}</h2>
            {unread > 0 && <button onClick={markRead} className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Mark all read</button>}
          </div>
          <ul className="mt-4 max-h-72 flex-1 space-y-2 overflow-y-auto">
            {data.notifications.length === 0 && <li className="muted text-sm">You&apos;re all caught up.</li>}
            {data.notifications.map((n) => (
              <li key={n.id} className={`rounded-xl p-3 text-sm ${n.read ? "bg-slate-50 dark:bg-slate-800/40" : "bg-indigo-50 dark:bg-indigo-500/10"}`}>
                <p className="font-semibold">{n.title}</p>
                <p className="muted text-xs">{n.message}</p>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="muted">{formatDate(n.createdAt)}</span>
                  {n.link && <Link href={n.link} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Open</Link>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Upcoming deadlines */}
      <section className="mt-8" aria-labelledby="dl">
        <h2 id="dl" className="mb-4 flex items-center gap-2 text-xl font-bold"><CalendarClock className="h-5 w-5 text-indigo-600" /> Upcoming deadlines</h2>
        {upcoming.length === 0 ? (
          <p className="muted card p-5 text-sm">No deadlines in the next 30 days among your saved and applied drives.</p>
        ) : (
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {upcoming.map((d) => {
              const left = daysLeft(d.deadline);
              return (
                <Link key={d.id} href={`/companies/${d.id}`} className="card card-hover w-64 shrink-0 p-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo initials={d.company.initials} color={d.company.color} size="sm" name={d.company.name} />
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{d.company.name}</p><p className="muted truncate text-xs">{d.role}</p></div>
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${left <= 7 ? "text-amber-700 dark:text-amber-400" : ""}`}>{left === 0 ? "Due today" : `${left} day${left === 1 ? "" : "s"} left`}</p>
                  <p className="muted text-xs">{formatDate(d.deadline)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Applications */}
      <section className="mt-10" aria-labelledby="ap">
        <h2 id="ap" className="mb-4 flex items-center gap-2 text-xl font-bold"><BriefcaseBusiness className="h-5 w-5 text-indigo-600" /> Applied drives</h2>
        {apps.length === 0 ? (
          <EmptyState title="No applications yet" message="Apply to a drive and track every stage right here." action={<Link href="/companies" className="btn-primary">Browse drives</Link>} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {apps.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <CompanyLogo initials={a.drive.company.initials} color={a.drive.company.color} name={a.drive.company.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/companies/${a.drive.id}`} className="block truncate font-semibold hover:text-indigo-600">{a.drive.role}</Link>
                    <p className="muted truncate text-sm">{a.drive.company.name} · Applied {formatDate(a.createdAt)}</p>
                  </div>
                  {a.matchScore != null && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">{a.matchScore}% match</span>}
                </div>
                <StatusTracker status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved */}
      <section className="mt-10" aria-labelledby="sv">
        <h2 id="sv" className="mb-4 flex items-center gap-2 text-xl font-bold"><Bookmark className="h-5 w-5 text-indigo-600" /> Saved jobs</h2>
        {data.saved.length === 0 ? (
          <EmptyState icon={<Bookmark className="h-7 w-7" />} title="Nothing saved yet" message="Tap the bookmark on any drive to keep it here for later." action={<Link href="/companies" className="btn-outline">Find drives</Link>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.saved.map((d) => (
              <div key={d.id} className="card card-hover flex items-center gap-3 p-4">
                <CompanyLogo initials={d.company.initials} color={d.company.color} name={d.company.name} />
                <Link href={`/companies/${d.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.role}</p>
                  <p className="muted truncate text-sm">{d.company.name} · {d.packageLpa} LPA</p>
                </Link>
                <BookmarkButton driveId={d.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
