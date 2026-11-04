import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, MapPin, Star, Users } from "lucide-react";
import ApplyPanel from "@/components/ApplyPanel";
import { Badge, CompanyLogo } from "@/components/ui";
import { getDrive } from "@/lib/data";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = Number(id) ? await getDrive(Number(id)) : null;
  if (!d) return { title: "Drive not found" };
  return {
    title: `${d.role} at ${d.company.name}`,
    description: `${d.role} at ${d.company.name} – ${d.packageLpa} LPA. Eligibility: CGPA ≥ ${d.minCgpa}, max ${d.maxBacklogs} backlogs. ${d.description.slice(0, 100)}`,
  };
}

export default async function DriveDetail({ params }: Props) {
  const { id } = await params;
  const drive = Number(id) ? await getDrive(Number(id)) : null;
  if (!drive) notFound();
  const c = drive.company;

  const criteria = [
    ["Minimum CGPA", drive.minCgpa === 0 ? "No cut-off" : drive.minCgpa.toFixed(1)],
    ["Max backlogs", String(drive.maxBacklogs)],
    ["Branches", drive.branches.join(", ")],
    ["Degrees", drive.degrees.length ? drive.degrees.join(", ") : "All degrees"],
    ["Passout batch", drive.passoutYears.length ? drive.passoutYears.join(", ") : "All batches"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/companies" className="muted mb-6 inline-flex items-center gap-1 text-sm hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to all drives
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <header className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <CompanyLogo initials={c.initials} color={c.color} size="lg" name={c.name} />
              <div className="flex-1">
                <h1 className="text-2xl font-bold sm:text-3xl">{drive.role}</h1>
                <p className="muted mt-1">{c.name} · {c.industry}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge><MapPin className="h-3.5 w-3.5" /> {drive.location}</Badge>
                  <Badge>{drive.jobType}</Badge>
                  <Badge>{drive.category}</Badge>
                </div>
              </div>
            </div>
          </header>

          <section className="card p-6" aria-labelledby="jd">
            <h2 id="jd" className="mb-3 text-lg font-bold">Job description</h2>
            <p className="muted leading-relaxed">{drive.description}</p>
          </section>

          <section className="card p-6" aria-labelledby="crit">
            <h2 id="crit" className="mb-4 text-lg font-bold">Eligibility criteria</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {criteria.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <dt className="muted text-xs font-medium uppercase tracking-wide">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mb-2 mt-5 text-sm font-semibold">Required skills</h3>
            <div className="flex flex-wrap gap-2">
              {drive.skills.length ? drive.skills.map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">{s}</span>
              )) : <span className="muted text-sm">No specific skills</span>}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="process">
            <h2 id="process" className="mb-5 text-lg font-bold">Selection process</h2>
            <ol className="relative space-y-6 border-l-2 border-indigo-200 pl-6 dark:border-indigo-500/30">
              {drive.process.map((s, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[2.15rem] flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white ring-4 ring-white dark:ring-slate-900">{i + 1}</span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="muted mt-0.5 text-sm">{s.description}</p>
                </li>
              ))}
              {drive.process.length === 0 && <li className="muted text-sm">Details will be shared with registered candidates.</li>}
            </ol>
          </section>

          <section className="card p-6" aria-labelledby="about">
            <h2 id="about" className="mb-3 text-lg font-bold">About {c.name}</h2>
            <p className="muted leading-relaxed">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-indigo-600" /> {c.employees || "—"} employees</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-600" /> {c.headquarters || "—"}</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {c.rating.toFixed(1)} rating</span>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
            </div>
          </section>
        </div>

        <ApplyPanel drive={drive} />
      </div>
    </div>
  );
}
