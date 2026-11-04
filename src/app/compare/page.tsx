"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";
import { CompanyLogo, EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge, formatDate } from "@/components/ui";
import { evaluate } from "@/lib/eligibility";
import { loadProfile } from "@/lib/profile-store";
import type { DriveDTO, Profile } from "@/lib/types";

function Compare() {
  const ids = (useSearchParams().get("ids") ?? "").split(",").map(Number).filter(Boolean).slice(0, 3);
  const [drives, setDrives] = useState<DriveDTO[] | null>(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    setProfile(loadProfile());
    fetch("/api/drives")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load drives"))))
      .then((d) => setDrives((d.drives as DriveDTO[]).filter((x) => key.split(",").map(Number).includes(x.id))))
      .catch((e) => setError(e.message));
  }, [key]);

  if (error) return <ErrorState message={error} />;
  if (!drives) return <Skeleton className="h-96 w-full" />;
  if (drives.length < 2)
    return <EmptyState icon={<Scale className="h-7 w-7" />} title="Pick at least two drives" message="Add drives to your comparison from the Companies page." action={<Link href="/companies" className="btn-primary">Browse drives</Link>} />;

  const best = (fn: (d: DriveDTO) => number, dir: "max" | "min") => {
    const vals = drives.map(fn);
    return dir === "max" ? Math.max(...vals) : Math.min(...vals);
  };
  const bestPkg = best((d) => d.packageLpa, "max");
  const easiestCgpa = best((d) => d.minCgpa, "min");

  const rows: { label: string; render: (d: DriveDTO) => React.ReactNode; highlight?: (d: DriveDTO) => boolean }[] = [
    { label: "Role", render: (d) => <b>{d.role}</b> },
    { label: "Package", render: (d) => `${d.packageLpa} LPA`, highlight: (d) => d.packageLpa === bestPkg },
    { label: "Location", render: (d) => d.location },
    { label: "Job type", render: (d) => d.jobType },
    { label: "Deadline", render: (d) => formatDate(d.deadline) },
    { label: "Min CGPA", render: (d) => (d.minCgpa === 0 ? "No cut-off" : d.minCgpa.toFixed(1)), highlight: (d) => d.minCgpa === easiestCgpa },
    { label: "Max backlogs", render: (d) => d.maxBacklogs },
    { label: "Branches", render: (d) => d.branches.join(", ") },
    { label: "Batches", render: (d) => d.passoutYears.join(", ") || "All" },
    { label: "Skills", render: (d) => d.skills.join(", ") },
    { label: "Selection rounds", render: (d) => d.process.length },
    { label: "Openings", render: (d) => d.openings },
    { label: "Company rating", render: (d) => `${d.company.rating.toFixed(1)} ★` },
  ];
  if (profile) {
    rows.push({
      label: "Your match",
      render: (d) => {
        const ev = evaluate(profile, d);
        return (
          <div className="space-y-1">
            <span className="font-bold">{ev.score}%</span>
            <div><StatusBadge status={ev.status} /></div>
          </div>
        );
      },
    });
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Side by side comparison of selected drives</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th scope="col" className="w-36 p-4 text-left"><span className="sr-only">Criteria</span></th>
            {drives.map((d) => (
              <th scope="col" key={d.id} className="p-4 text-left align-top">
                <div className="flex items-center gap-3">
                  <CompanyLogo initials={d.company.initials} color={d.company.color} name={d.company.name} />
                  <div>
                    <p className="font-semibold">{d.company.name}</p>
                    <Link href={`/companies/${d.id}`} className="text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300">View &amp; apply</Link>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
              <th scope="row" className="muted p-4 text-left font-medium">{r.label}</th>
              {drives.map((d) => (
                <td key={d.id} className={`p-4 align-top ${r.highlight?.(d) ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}`}>
                  {r.render(d)}
                  {r.highlight?.(d) && <span className="ml-1 text-xs">✓ best</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="Compare drives" subtitle="Side-by-side view of package, criteria and your personal match.">
        <Link href="/companies" className="btn-outline">Change selection</Link>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Compare />
      </Suspense>
    </div>
  );
}
