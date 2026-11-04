"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Download, Pencil, SearchX } from "lucide-react";
import { toast } from "sonner";
import CircularScore from "@/components/CircularScore";
import DriveCard, { DriveCardSkeleton } from "@/components/DriveCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useTheme } from "@/components/Providers";
import { courseFor, LOCATIONS } from "@/lib/constants";
import { loadProfile } from "@/lib/profile-store";
import type { DriveResult, EligibilityStatus, Profile } from "@/lib/types";

type Payload = {
  results: DriveResult[];
  overall: number;
  gaps: { skill: string; count: number }[];
  counts: Record<EligibilityStatus, number>;
};

const TABS: { key: "all" | EligibilityStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "eligible", label: "✅ Eligible" },
  { key: "almost", label: "⚠️ Almost" },
  { key: "not", label: "❌ Not eligible" },
];

export default function ResultsPage() {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const [tab, setTab] = useState<"all" | EligibilityStatus>("all");
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [sort, setSort] = useState("match");
  const [prefOnly, setPrefOnly] = useState(false);

  const run = useCallback(async (p: Profile) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/eligibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: p }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setReady(true);
    if (p) run(p);
    else setLoading(false);
  }, [run]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const list = data.results.filter((r) => {
      if (tab !== "all" && r.evaluation.status !== tab) return false;
      const text = `${r.drive.role} ${r.drive.company.name} ${r.drive.category}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (loc && !r.drive.location.toLowerCase().includes(loc.toLowerCase()) && !/pan india|remote/i.test(r.drive.location)) return false;
      if (r.drive.packageLpa < minSalary) return false;
      if (prefOnly && !(r.evaluation.roleMatch && r.evaluation.locationMatch)) return false;
      return true;
    });
    list.sort((a, b) =>
      sort === "salary" ? b.drive.packageLpa - a.drive.packageLpa
      : sort === "deadline" ? +new Date(a.drive.deadline) - +new Date(b.drive.deadline)
      : sort === "role" ? a.drive.role.localeCompare(b.drive.role)
      : b.evaluation.score - a.evaluation.score,
    );
    return list;
  }, [data, tab, q, loc, minSalary, sort, prefOnly]);

  const downloadPdf = async () => {
    if (!data || !profile) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 18;
      const line = (t: string, size = 10, bold = false, gap = 6) => {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.splitTextToSize(t, 180).forEach((l: string) => { doc.text(l, 15, y); y += gap; });
      };
      line("CareerPath – Eligibility Report", 18, true, 9);
      line(`${profile.fullName} · ${profile.email} · Generated ${new Date().toLocaleDateString("en-IN")}`, 9);
      y += 2;
      line(`Profile: ${profile.degree} (${profile.branch}) · ${profile.scoreType === "cgpa" ? "CGPA" : "Score"} ${profile.score}${profile.scoreType === "percentage" ? "%" : ""} · Backlogs ${profile.backlogs} · Batch ${profile.gradYear}`);
      line(`Skills: ${profile.skills.join(", ")}`);
      y += 2;
      line(`Overall readiness: ${data.overall}%  |  Eligible: ${data.counts.eligible}  Almost: ${data.counts.almost}  Not eligible: ${data.counts.not}`, 11, true, 7);
      y += 3;
      line("Top matches", 13, true, 8);
      data.results.slice(0, 10).forEach((r) => {
        const status = r.evaluation.status === "eligible" ? "Eligible" : r.evaluation.status === "almost" ? "Almost eligible" : "Not eligible";
        line(`${r.drive.company.name} – ${r.drive.role}: ${r.evaluation.score}% (${status}) · ${r.drive.packageLpa} LPA`, 10, true);
        if (r.evaluation.missingSkills.length) line(`   Missing skills: ${r.evaluation.missingSkills.join(", ")}`, 9);
        r.evaluation.suggestions.slice(0, 2).forEach((s) => line(`   - ${s}`, 9));
        y += 1;
      });
      y += 3;
      line("Skill gap priorities", 13, true, 8);
      data.gaps.forEach((g) => line(`${g.skill} (needed by ${g.count} drives) – ${courseFor(g.skill).title}, ${courseFor(g.skill).provider}`, 9));
      doc.save("eligibility-report.pdf");
      toast.success("Report downloaded");
    } catch {
      toast.error("Could not generate the PDF.");
    }
  };

  if (!ready) return <div className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="h-64 w-full" /></div>;

  if (!profile)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="No profile yet" message="Fill in the eligibility checker first and we'll show your personalised matches here." action={<Link href="/eligibility" className="btn-primary">Start the checker</Link>} />
      </div>
    );

  const axisColor = theme === "dark" ? "#94a3b8" : "#475569";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Your results, {profile.fullName.split(" ")[0]}</h1>
          <p className="muted mt-2">Based on {profile.degree} · {profile.branch} · {profile.skills.length} skills</p>
        </div>
        <div className="flex gap-2">
          <Link href="/eligibility" className="btn-outline"><Pencil className="h-4 w-4" /> Edit profile</Link>
          <button onClick={downloadPdf} disabled={!data} className="btn-primary"><Download className="h-4 w-4" /> Download report (PDF)</button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => run(profile)} />}

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <DriveCardSkeleton key={i} />)}</div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Score summary */}
          <section className="card mb-8 grid items-center gap-8 p-6 md:grid-cols-[auto_1fr]" aria-label="Eligibility summary">
            <div className="mx-auto"><CircularScore value={data.overall} size={170} label="overall readiness" /></div>
            <div>
              <h2 className="text-xl font-bold">
                {data.overall >= 75 ? "You're in great shape 🎉" : data.overall >= 50 ? "You're close — a few gaps to fix" : "Let's build your foundation"}
              </h2>
              <p className="muted mt-1 text-sm">Average match across your top 5 drives (weights: CGPA 30%, skills 40%, branch 20%, other 10%).</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {([["eligible", "Eligible", "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300"], ["almost", "Almost", "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300"], ["not", "Not eligible", "text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-300"]] as const).map(([k, l, c]) => (
                  <div key={k} className={`rounded-xl p-4 ${c}`}>
                    <p className="text-3xl font-extrabold">{data.counts[k]}</p>
                    <p className="text-xs font-semibold">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Filters */}
          <section aria-label="Filters" className="card mb-6 p-4">
            <div role="tablist" aria-label="Eligibility status" className="mb-4 flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`chip !px-4 !py-1.5 ${tab === t.key ? "chip-on" : ""}`}>
                  {t.label}{t.key !== "all" && ` (${data.counts[t.key]})`}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input aria-label="Search role or company" className="input" placeholder="Search role or company" value={q} onChange={(e) => setQ(e.target.value)} />
              <select aria-label="Location" className="input" value={loc} onChange={(e) => setLoc(e.target.value)}>
                <option value="">All locations</option>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <span className="whitespace-nowrap">Min {minSalary} LPA</span>
                <input type="range" min="0" max="40" step="1" value={minSalary} onChange={(e) => setMinSalary(Number(e.target.value))} className="w-full accent-indigo-600" aria-label="Minimum salary in LPA" />
              </label>
              <select aria-label="Sort by" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="match">Sort: Best match</option>
                <option value="salary">Sort: Highest salary</option>
                <option value="deadline">Sort: Nearest deadline</option>
                <option value="role">Sort: Role (A–Z)</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={prefOnly} onChange={(e) => setPrefOnly(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
                Match my role &amp; location
              </label>
            </div>
          </section>

          <p className="muted mb-4 text-sm" aria-live="polite">{filtered.length} of {data.results.length} drives</p>
          {filtered.length === 0 ? (
            <EmptyState icon={<SearchX className="h-7 w-7" />} title="No drives match these filters" message="Try clearing a filter or lowering the minimum salary." action={<button className="btn-outline" onClick={() => { setTab("all"); setQ(""); setLoc(""); setMinSalary(0); setPrefOnly(false); }}>Reset filters</button>} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => <DriveCard key={r.drive.id} drive={r.drive} evaluation={r.evaluation} />)}
            </div>
          )}

          {/* Skill gap analysis */}
          <section className="mt-14" aria-labelledby="gap-title">
            <h2 id="gap-title" className="section-title">Skill-gap analysis</h2>
            <p className="muted mt-2">The skills you&apos;re missing that unlock the most drives within your reach.</p>
            {data.gaps.length === 0 ? (
              <div className="card mt-6 p-8 text-center">🎉 No major skill gaps — you cover the skills for all drives within reach.</div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card p-5">
                  <h3 className="mb-4 font-semibold">Drives requiring each missing skill</h3>
                  <div className="h-72" role="img" aria-label={`Bar chart of missing skills: ${data.gaps.map((g) => `${g.skill} ${g.count}`).join(", ")}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.gaps} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
                        <XAxis type="number" allowDecimals={false} stroke={axisColor} fontSize={12} />
                        <YAxis type="category" dataKey="skill" width={110} stroke={axisColor} fontSize={12} />
                        <RTooltip contentStyle={{ borderRadius: 12 }} />
                        <Bar dataKey="count" name="Drives" fill="#6366f1" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold"><BookOpen className="h-5 w-5 text-indigo-600" /> Recommended courses</h3>
                  <ul className="space-y-3">
                    {data.gaps.slice(0, 5).map((g) => {
                      const c = courseFor(g.skill);
                      return (
                        <li key={g.skill} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                          <div>
                            <p className="text-sm font-semibold">{g.skill}</p>
                            <p className="muted text-xs">{c.title} · {c.provider}</p>
                          </div>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn-outline !px-3 !py-1.5 text-xs">Open<span className="sr-only"> {c.title} (new tab)</span></a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
