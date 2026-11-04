"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Download, Pencil, Plus, ShieldAlert, Trash2, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";
import TagSelector from "@/components/TagSelector";
import { CompanyLogo, EmptyState, Modal, PageHeader, Skeleton, formatDate } from "@/components/ui";
import { useAuth } from "@/components/Providers";
import { BRANCHES, DEGREES, LOCATIONS, ROLE_CATEGORIES, SKILLS } from "@/lib/constants";
import { APPLICATION_STATUSES, type CompanyDTO, type DriveDTO } from "@/lib/types";

type Applicant = { id: number; status: string; matchScore: number | null; appliedAt: string; driveId: number; role: string; company: string; name: string; email: string; degree: string; branch: string; cgpa: string };

const TABS = ["Overview", "Companies", "Drives", "Applicants"] as const;

/* ---- form models ---- */
const emptyCompany = { id: 0, name: "", industry: "Technology", initials: "", color: "#4f46e5", description: "", website: "", headquarters: "", employees: "", rating: "4", featured: false, placedCount: "0" };
const emptyDrive = {
  id: 0, companyId: "", role: "", category: "Software Engineer", jobType: "Full-time", packageLpa: "", location: "Pan India", description: "",
  deadline: "", minCgpa: "6", maxBacklogs: "0", branches: ["Any"] as string[], degrees: [] as string[], skills: [] as string[], passoutYears: "2026, 2027", openings: "10", process: "Online Assessment | Aptitude and coding\nTechnical Interview | Fundamentals and projects\nHR Interview | Culture fit",
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [drives, setDrives] = useState<DriveDTO[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [driveFilter, setDriveFilter] = useState("");

  const [cForm, setCForm] = useState<typeof emptyCompany | null>(null);
  const [dForm, setDForm] = useState<typeof emptyDrive | null>(null);
  const [del, setDel] = useState<{ type: "company" | "drive"; id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, d, a] = await Promise.all([
        fetch("/api/admin/companies").then((r) => r.json()),
        fetch("/api/drives").then((r) => r.json()),
        fetch("/api/admin/applicants").then((r) => r.json()),
      ]);
      setCompanies(c.companies ?? []);
      setDrives(d.drives ?? []);
      setApplicants(a.applicants ?? []);
    } catch {
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login?next=/admin");
    else if (user.role === "admin") load();
  }, [authLoading, user, router, load]);

  const shownApplicants = useMemo(() => (driveFilter ? applicants.filter((a) => a.driveId === Number(driveFilter)) : applicants), [applicants, driveFilter]);

  if (authLoading || !user) return <div className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="h-96 w-full" /></div>;
  if (user.role !== "admin")
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState icon={<ShieldAlert className="h-7 w-7" />} title="Admins only" message="You need an administrator account to view this page." action={<Link href="/" className="btn-primary">Go home</Link>} />
      </div>
    );

  const saveCompany = async () => {
    if (!cForm) return;
    setBusy(true);
    try {
      const body = { ...cForm, rating: Number(cForm.rating), placedCount: Number(cForm.placedCount) };
      if (cForm.id) await api(`/api/admin/companies/${cForm.id}`, "PUT", body);
      else await api("/api/admin/companies", "POST", body);
      toast.success(cForm.id ? "Company updated" : "Company added");
      setCForm(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const saveDrive = async () => {
    if (!dForm) return;
    setBusy(true);
    try {
      const body = {
        ...dForm,
        companyId: Number(dForm.companyId),
        packageLpa: Number(dForm.packageLpa),
        minCgpa: Number(dForm.minCgpa),
        maxBacklogs: Number(dForm.maxBacklogs),
        openings: Number(dForm.openings),
        deadline: dForm.deadline ? new Date(dForm.deadline + "T23:59:00").toISOString() : "",
        passoutYears: dForm.passoutYears.split(",").map((s) => s.trim()).filter(Boolean),
        process: dForm.process.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
          const [title, ...rest] = l.split("|");
          return { title: title.trim(), description: rest.join("|").trim() };
        }),
      };
      if (dForm.id) await api(`/api/admin/drives/${dForm.id}`, "PUT", body);
      else await api("/api/admin/drives", "POST", body);
      toast.success(dForm.id ? "Drive updated" : "Drive created — students notified");
      setDForm(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api(`/api/admin/${del.type === "company" ? "companies" : "drives"}/${del.id}`, "DELETE");
      toast.success(`${del.name} deleted`);
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: number, status: string) => {
    try {
      await api(`/api/admin/applicants/${id}`, "PATCH", { status });
      setApplicants((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
      toast.success(`Marked ${status} — applicant notified`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const editDrive = (d: DriveDTO) =>
    setDForm({
      id: d.id, companyId: String(d.companyId), role: d.role, category: d.category, jobType: d.jobType, packageLpa: String(d.packageLpa), location: d.location,
      description: d.description, deadline: d.deadline.slice(0, 10), minCgpa: String(d.minCgpa), maxBacklogs: String(d.maxBacklogs), branches: d.branches, degrees: d.degrees,
      skills: d.skills, passoutYears: d.passoutYears.join(", "), openings: String(d.openings), process: d.process.map((p) => `${p.title} | ${p.description}`).join("\n"),
    });

  const csvUrl = `/api/admin/applicants?format=csv${driveFilter ? `&driveId=${driveFilter}` : ""}`;
  const cf = <K extends keyof typeof emptyCompany>(k: K, v: (typeof emptyCompany)[K]) => setCForm((f) => f && { ...f, [k]: v });
  const df = <K extends keyof typeof emptyDrive>(k: K, v: (typeof emptyDrive)[K]) => setDForm((f) => f && { ...f, [k]: v });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader title="Admin panel" subtitle="Manage companies, drives, eligibility criteria and applicants." />

      <div role="tablist" aria-label="Admin sections" className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`chip whitespace-nowrap !px-5 !py-2 text-sm ${tab === t ? "chip-on" : ""}`}>{t}</button>
        ))}
      </div>

      {loading ? <Skeleton className="h-72 w-full" /> : (
        <>
          {tab === "Overview" && (
            <div className="grid gap-5 sm:grid-cols-3">
              {[{ l: "Companies", v: companies.length, i: Building2 }, { l: "Drives", v: drives.length, i: Briefcase }, { l: "Applications", v: applicants.length, i: Users }].map((s) => (
                <div key={s.l} className="card flex items-center gap-4 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><s.i className="h-6 w-6" /></span>
                  <div><p className="text-3xl font-extrabold">{s.v}</p><p className="muted text-sm">{s.l}</p></div>
                </div>
              ))}
              <div className="card p-6 sm:col-span-3">
                <h2 className="font-bold">Applications by status</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {APPLICATION_STATUSES.map((s) => (
                    <div key={s} className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                      <p className="text-2xl font-bold">{applicants.filter((a) => a.status === s).length}</p>
                      <p className="muted text-xs">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Companies" && (
            <div>
              <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => setCForm({ ...emptyCompany })}><Plus className="h-4 w-4" /> Add company</button></div>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead><tr className="border-b border-slate-200 text-left dark:border-slate-800"><th className="p-4">Company</th><th className="p-4">Industry</th><th className="p-4">HQ</th><th className="p-4">Featured</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
                        <td className="p-4"><div className="flex items-center gap-3"><CompanyLogo initials={c.initials} color={c.color} size="sm" name={c.name} /><span className="font-medium">{c.name}</span></div></td>
                        <td className="p-4">{c.industry}</td><td className="p-4">{c.headquarters}</td><td className="p-4">{c.featured ? "Yes" : "—"}</td>
                        <td className="p-4"><div className="flex justify-end gap-1">
                          <button aria-label={`Edit ${c.name}`} className="btn-ghost !p-2" onClick={() => setCForm({ ...c, rating: String(c.rating), placedCount: String(c.placedCount) })}><Pencil className="h-4 w-4" /></button>
                          <button aria-label={`Delete ${c.name}`} className="btn-ghost !p-2 !text-red-600" onClick={() => setDel({ type: "company", id: c.id, name: c.name })}><Trash2 className="h-4 w-4" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "Drives" && (
            <div>
              <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => setDForm({ ...emptyDrive, companyId: String(companies[0]?.id ?? "") })}><Plus className="h-4 w-4" /> Add drive</button></div>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead><tr className="border-b border-slate-200 text-left dark:border-slate-800"><th className="p-4">Role</th><th className="p-4">Company</th><th className="p-4">Package</th><th className="p-4">Criteria</th><th className="p-4">Deadline</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody>
                    {drives.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
                        <td className="p-4 font-medium">{d.role}</td><td className="p-4">{d.company.name}</td><td className="p-4">{d.packageLpa} LPA</td>
                        <td className="muted p-4 text-xs">CGPA ≥ {d.minCgpa} · ≤{d.maxBacklogs} backlogs · {d.skills.length} skills</td>
                        <td className="p-4">{formatDate(d.deadline)}</td>
                        <td className="p-4"><div className="flex justify-end gap-1">
                          <button aria-label={`Edit ${d.role}`} className="btn-ghost !p-2" onClick={() => editDrive(d)}><Pencil className="h-4 w-4" /></button>
                          <button aria-label={`Delete ${d.role}`} className="btn-ghost !p-2 !text-red-600" onClick={() => setDel({ type: "drive", id: d.id, name: d.role })}><Trash2 className="h-4 w-4" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "Applicants" && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <select aria-label="Filter by drive" className="input !w-auto" value={driveFilter} onChange={(e) => setDriveFilter(e.target.value)}>
                  <option value="">All drives</option>
                  {drives.map((d) => <option key={d.id} value={d.id}>{d.company.name} – {d.role}</option>)}
                </select>
                <a href={csvUrl} className="btn-outline"><Download className="h-4 w-4" /> Export CSV</a>
              </div>
              {shownApplicants.length === 0 ? (
                <EmptyState icon={<Users className="h-7 w-7" />} title="No applicants yet" message="Applications will appear here as students apply." />
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead><tr className="border-b border-slate-200 text-left dark:border-slate-800"><th className="p-4">Applicant</th><th className="p-4">Drive</th><th className="p-4">Profile</th><th className="p-4">Match</th><th className="p-4">Applied</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                      {shownApplicants.map((a) => (
                        <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
                          <td className="p-4"><p className="font-medium">{a.name}</p><p className="muted text-xs">{a.email}</p></td>
                          <td className="p-4">{a.company}<p className="muted text-xs">{a.role}</p></td>
                          <td className="muted p-4 text-xs">{a.degree || "—"}{a.branch && ` · ${a.branch}`}{a.cgpa && ` · ${a.cgpa}`}</td>
                          <td className="p-4 font-semibold">{a.matchScore != null ? `${a.matchScore}%` : "—"}</td>
                          <td className="p-4">{formatDate(a.appliedAt)}</td>
                          <td className="p-4">
                            <select aria-label={`Status for ${a.name}`} className="input !w-auto !py-1.5" value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}>
                              {APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- Company modal ---- */}
      <Modal open={!!cForm} onClose={() => setCForm(null)} title={cForm?.id ? "Edit company" : "Add company"}>
        {cForm && (
          <form onSubmit={(e) => { e.preventDefault(); saveCompany(); }} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="c-name">Name *</label><input id="c-name" required className="input" value={cForm.name} onChange={(e) => cf("name", e.target.value)} /></div>
            <div><label className="label" htmlFor="c-ind">Industry</label><input id="c-ind" className="input" value={cForm.industry} onChange={(e) => cf("industry", e.target.value)} /></div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="label" htmlFor="c-ini">Initials</label><input id="c-ini" maxLength={3} className="input" value={cForm.initials} onChange={(e) => cf("initials", e.target.value)} /></div>
              <div><label className="label" htmlFor="c-col">Color</label><input id="c-col" type="color" className="h-[42px] w-14 rounded-xl border border-slate-300 bg-transparent p-1 dark:border-slate-700" value={cForm.color} onChange={(e) => cf("color", e.target.value)} /></div>
            </div>
            <div><label className="label" htmlFor="c-hq">Headquarters</label><input id="c-hq" className="input" value={cForm.headquarters} onChange={(e) => cf("headquarters", e.target.value)} /></div>
            <div><label className="label" htmlFor="c-emp">Employees</label><input id="c-emp" className="input" value={cForm.employees} onChange={(e) => cf("employees", e.target.value)} /></div>
            <div><label className="label" htmlFor="c-web">Website</label><input id="c-web" type="url" className="input" value={cForm.website} onChange={(e) => cf("website", e.target.value)} /></div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="label" htmlFor="c-rat">Rating (0–5)</label><input id="c-rat" type="number" step="0.1" min="0" max="5" className="input" value={cForm.rating} onChange={(e) => cf("rating", e.target.value)} /></div>
              <div className="flex-1"><label className="label" htmlFor="c-pl">Placed</label><input id="c-pl" type="number" min="0" className="input" value={cForm.placedCount} onChange={(e) => cf("placedCount", e.target.value)} /></div>
            </div>
            <div className="sm:col-span-2"><label className="label" htmlFor="c-desc">Description</label><textarea id="c-desc" rows={3} className="input" value={cForm.description} onChange={(e) => cf("description", e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={cForm.featured} onChange={(e) => cf("featured", e.target.checked)} /> Feature on the home page</label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setCForm(null)}>Cancel</button><button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save company"}</button></div>
          </form>
        )}
      </Modal>

      {/* ---- Drive modal ---- */}
      <Modal open={!!dForm} onClose={() => setDForm(null)} title={dForm?.id ? "Edit drive" : "Add drive"} wide>
        {dForm && (
          <form onSubmit={(e) => { e.preventDefault(); saveDrive(); }} className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="d-co">Company *</label>
              <select id="d-co" required className="input" value={dForm.companyId} onChange={(e) => df("companyId", e.target.value)}>
                <option value="">Select company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="label" htmlFor="d-role">Role title *</label><input id="d-role" required className="input" value={dForm.role} onChange={(e) => df("role", e.target.value)} /></div>
            <div><label className="label" htmlFor="d-cat">Category</label><select id="d-cat" className="input" value={dForm.category} onChange={(e) => df("category", e.target.value)}>{ROLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label" htmlFor="d-type">Job type</label><select id="d-type" className="input" value={dForm.jobType} onChange={(e) => df("jobType", e.target.value)}><option>Full-time</option><option>Internship</option></select></div>
            <div><label className="label" htmlFor="d-pkg">Package (LPA)</label><input id="d-pkg" type="number" step="0.1" min="0" required className="input" value={dForm.packageLpa} onChange={(e) => df("packageLpa", e.target.value)} /></div>
            <div><label className="label" htmlFor="d-loc">Location(s)</label><input id="d-loc" className="input" list="locs" value={dForm.location} onChange={(e) => df("location", e.target.value)} /><datalist id="locs">{LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist></div>
            <div><label className="label" htmlFor="d-dl">Deadline *</label><input id="d-dl" type="date" required className="input" value={dForm.deadline} onChange={(e) => df("deadline", e.target.value)} /></div>
            <div><label className="label" htmlFor="d-op">Openings</label><input id="d-op" type="number" min="1" className="input" value={dForm.openings} onChange={(e) => df("openings", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="d-desc">Description</label><textarea id="d-desc" rows={3} className="input" value={dForm.description} onChange={(e) => df("description", e.target.value)} /></div>

            <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:col-span-2 sm:grid-cols-3">
              <legend className="px-2 text-sm font-semibold">Eligibility criteria</legend>
              <div><label className="label" htmlFor="d-cg">Min CGPA</label><input id="d-cg" type="number" step="0.1" min="0" max="10" className="input" value={dForm.minCgpa} onChange={(e) => df("minCgpa", e.target.value)} /></div>
              <div><label className="label" htmlFor="d-bl">Max backlogs</label><input id="d-bl" type="number" min="0" className="input" value={dForm.maxBacklogs} onChange={(e) => df("maxBacklogs", e.target.value)} /></div>
              <div><label className="label" htmlFor="d-yr">Passout years</label><input id="d-yr" className="input" value={dForm.passoutYears} onChange={(e) => df("passoutYears", e.target.value)} placeholder="2026, 2027" /></div>
              <div className="sm:col-span-3"><span className="label">Allowed branches (include “Any” for all)</span><TagSelector label="Branches" value={dForm.branches} onChange={(v) => df("branches", v)} options={["Any", ...BRANCHES]} allowCustom={false} /></div>
              <div className="sm:col-span-3"><span className="label">Allowed degrees (empty = all)</span><TagSelector label="Degrees" value={dForm.degrees} onChange={(v) => df("degrees", v)} options={DEGREES} allowCustom={false} /></div>
              <div className="sm:col-span-3"><span className="label">Required skills</span><TagSelector label="Required skills" value={dForm.skills} onChange={(v) => df("skills", v)} options={SKILLS} /></div>
            </fieldset>

            <div className="sm:col-span-2"><label className="label" htmlFor="d-proc">Selection process (one round per line: Title | description)</label><textarea id="d-proc" rows={4} className="input font-mono text-xs" value={dForm.process} onChange={(e) => df("process", e.target.value)} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setDForm(null)}>Cancel</button><button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save drive"}</button></div>
          </form>
        )}
      </Modal>

      {/* ---- Delete confirm ---- */}
      <Modal open={!!del} onClose={() => setDel(null)} title="Confirm deletion">
        <p className="text-sm">Delete <b>{del?.name}</b>? {del?.type === "company" ? "All of its drives and applications will be removed too." : "Applications for this drive will be removed too."} This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setDel(null)}>Cancel</button><button className="btn-danger" disabled={busy} onClick={confirmDelete}>{busy ? "Deleting…" : "Delete"}</button></div>
      </Modal>
    </div>
  );
}
