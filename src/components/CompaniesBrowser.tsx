"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, Search, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import DriveCard, { DriveCardSkeleton } from "./DriveCard";
import { EmptyState, ErrorState } from "./ui";
import { evaluate } from "@/lib/eligibility";
import { loadProfile } from "@/lib/profile-store";
import { LOCATIONS, ROLE_CATEGORIES } from "@/lib/constants";
import type { DriveDTO, Profile } from "@/lib/types";

export default function CompaniesBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const [drives, setDrives] = useState<DriveDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [showSug, setShowSug] = useState(false);
  const [category, setCategory] = useState("");
  const [loc, setLoc] = useState("");
  const [jobType, setJobType] = useState("");
  const [minPkg, setMinPkg] = useState(0);
  const [maxCgpa, setMaxCgpa] = useState(10);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [hideClosed, setHideClosed] = useState(true);
  const [sort, setSort] = useState("deadline");
  const [compare, setCompare] = useState<number[]>([]);

  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/drives")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load drives"))))
      .then((d) => setDrives(d.drives))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    setProfile(loadProfile());
  }, []);

  // Autocomplete: companies, roles and skills
  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 1) return [];
    const pool = new Set<string>();
    drives.forEach((d) => {
      pool.add(d.company.name);
      pool.add(d.role);
      d.skills.forEach((s) => pool.add(s));
    });
    return [...pool].filter((s) => s.toLowerCase().includes(t) && s.toLowerCase() !== t).slice(0, 6);
  }, [q, drives]);

  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = drives
      .map((d) => ({ d, ev: profile ? evaluate(profile, d) : undefined }))
      .filter(({ d, ev }) => {
        if (t && ![d.company.name, d.role, d.category, d.location, ...d.skills].join(" ").toLowerCase().includes(t)) return false;
        if (category && d.category !== category) return false;
        if (loc && !d.location.toLowerCase().includes(loc.toLowerCase()) && !/pan india|remote/i.test(d.location)) return false;
        if (jobType && d.jobType !== jobType) return false;
        if (d.packageLpa < minPkg) return false;
        if (d.minCgpa > maxCgpa) return false;
        if (hideClosed && new Date(d.deadline) < new Date()) return false;
        if (onlyEligible && ev?.status !== "eligible") return false;
        return true;
      });
    list.sort((a, b) =>
      sort === "package" ? b.d.packageLpa - a.d.packageLpa
      : sort === "match" && a.ev && b.ev ? b.ev.score - a.ev.score
      : sort === "cgpa" ? a.d.minCgpa - b.d.minCgpa
      : +new Date(a.d.deadline) - +new Date(b.d.deadline),
    );
    return list;
  }, [drives, profile, q, category, loc, jobType, minPkg, maxCgpa, onlyEligible, hideClosed, sort]);

  const toggleCompare = (id: number) =>
    setCompare((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) {
        toast.info("You can compare up to 3 drives.");
        return c;
      }
      return [...c, id];
    });

  const reset = () => {
    setQ(""); setCategory(""); setLoc(""); setJobType(""); setMinPkg(0); setMaxCgpa(10); setOnlyEligible(false);
  };

  return (
    <>
      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            role="combobox"
            aria-expanded={showSug && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-label="Search companies, roles or skills"
            className="input !pl-11"
            placeholder="Search companies, roles, skills… e.g. Google, Data Analyst, SQL"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowSug(true); }}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          )}
          {showSug && suggestions.length > 0 && (
            <ul id="search-suggestions" role="listbox" className="card absolute z-20 mt-1 w-full p-1 shadow-xl">
              {suggestions.map((s) => (
                <li key={s} role="option" aria-selected={false}>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(s); setShowSug(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-slate-800">
                    <Search className="h-3.5 w-3.5 text-slate-400" /> {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select aria-label="Role category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All roles</option>
            {ROLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Location" className="input" value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">All locations</option>
            {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select aria-label="Job type" className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">Full-time &amp; internships</option>
            <option>Full-time</option>
            <option>Internship</option>
          </select>
          <select aria-label="Sort by" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="deadline">Sort: Nearest deadline</option>
            <option value="package">Sort: Highest package</option>
            <option value="cgpa">Sort: Lowest CGPA cut-off</option>
            {profile && <option value="match">Sort: Best match for me</option>}
          </select>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-28 whitespace-nowrap">Min {minPkg} LPA</span>
            <input type="range" min="0" max="40" value={minPkg} onChange={(e) => setMinPkg(Number(e.target.value))} className="w-full accent-indigo-600" aria-label="Minimum package in LPA" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-28 whitespace-nowrap">CGPA ≤ {maxCgpa.toFixed(1)}</span>
            <input type="range" min="5" max="10" step="0.5" value={maxCgpa} onChange={(e) => setMaxCgpa(Number(e.target.value))} className="w-full accent-indigo-600" aria-label="Maximum CGPA cut-off" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={hideClosed} onChange={(e) => setHideClosed(e.target.checked)} /> Hide closed drives
          </label>
          <label className={`flex items-center gap-2 text-sm ${profile ? "" : "opacity-60"}`} title={profile ? "" : "Complete the eligibility checker to enable"}>
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" disabled={!profile} checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} /> Only drives I&apos;m eligible for
          </label>
        </div>
        {!profile && !loading && (
          <p className="muted mt-3 text-xs">
            <Link href="/eligibility" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Run the eligibility checker</Link> to see your match on every card.
          </p>
        )}
      </div>

      <p className="muted mb-4 text-sm" aria-live="polite">{loading ? "Loading drives…" : `${items.length} drive${items.length === 1 ? "" : "s"} found`}</p>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <DriveCardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<SearchX className="h-7 w-7" />} title="No drives found" message="Nothing matches your filters. Try widening your search." action={<button onClick={reset} className="btn-outline">Clear filters</button>} />
      ) : (
        <div className="grid gap-5 pb-20 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ d, ev }) => (
            <DriveCard key={d.id} drive={d} evaluation={ev} compared={compare.includes(d.id)} compareDisabled={compare.length >= 3} onCompareToggle={() => toggleCompare(d.id)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white p-3 shadow-2xl dark:border-indigo-500/30 dark:bg-slate-900">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Scale className="h-5 w-5 shrink-0 text-indigo-600" />
              <span className="truncate font-medium">{compare.length} selected for comparison</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCompare([])} className="btn-ghost !py-2">Clear</button>
              <button disabled={compare.length < 2} onClick={() => router.push(`/compare?ids=${compare.join(",")}`)} className="btn-primary !py-2">
                Compare{compare.length < 2 ? " (pick 2+)" : ""}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
