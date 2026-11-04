"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, GraduationCap, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import StepForm, { type Step } from "./StepForm";
import TagSelector from "./TagSelector";
import { Tooltip } from "./ui";
import { useAuth } from "./Providers";
import { BRANCHES, DEGREES, GRAD_YEARS, LOCATIONS, ROLE_CATEGORIES, SKILLS } from "@/lib/constants";
import { loadProfile, saveProfile } from "@/lib/profile-store";
import type { Profile } from "@/lib/types";

type F = {
  fullName: string; email: string; phone: string; city: string;
  degree: string; branch: string; scoreType: "cgpa" | "percentage"; score: string;
  backlogs: string; gradYear: string; certifications: string[]; internships: string;
  skills: string[];
  preferredRole: string; preferredLocations: string[]; expectedSalary: string;
};
type Errors = Partial<Record<keyof F, string>>;

const STEPS: Step[] = [
  { id: "personal", title: "Personal", icon: <User className="h-4 w-4" /> },
  { id: "education", title: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "skills", title: "Skills", icon: <Sparkles className="h-4 w-4" /> },
  { id: "prefs", title: "Preferences", icon: <Briefcase className="h-4 w-4" /> },
];

const STEP_FIELDS: (keyof F)[][] = [
  ["fullName", "email", "phone", "city"],
  ["degree", "branch", "score", "backlogs", "gradYear", "internships", "certifications"],
  ["skills"],
  ["preferredRole", "preferredLocations", "expectedSalary"],
];

const INITIAL: F = {
  fullName: "", email: "", phone: "", city: "",
  degree: "", branch: "", scoreType: "cgpa", score: "", backlogs: "0",
  gradYear: String(new Date().getFullYear() + 1), certifications: [], internships: "0",
  skills: [],
  preferredRole: "", preferredLocations: [], expectedSalary: "6",
};

function validate(f: F): Errors {
  const e: Errors = {};
  if (f.fullName.trim().length < 2) e.fullName = "Enter your full name (at least 2 characters).";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email, e.g. name@college.edu.";
  if (f.phone && !/^\d{10}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Phone must be 10 digits.";
  if (!f.degree) e.degree = "Select your degree.";
  if (!f.branch) e.branch = "Select your branch.";
  const s = Number(f.score);
  if (f.score === "" || isNaN(s)) e.score = "Enter your score.";
  else if (f.scoreType === "cgpa" && (s < 0 || s > 10)) e.score = "CGPA must be between 0 and 10.";
  else if (f.scoreType === "percentage" && (s < 0 || s > 100)) e.score = "Percentage must be between 0 and 100.";
  const b = Number(f.backlogs);
  if (f.backlogs === "" || !Number.isInteger(b) || b < 0 || b > 30) e.backlogs = "Enter a whole number from 0 to 30.";
  if (!GRAD_YEARS.includes(Number(f.gradYear))) e.gradYear = "Select your graduation year.";
  const i = Number(f.internships);
  if (f.internships === "" || !Number.isInteger(i) || i < 0 || i > 10) e.internships = "Enter a whole number from 0 to 10.";
  if (f.skills.length === 0) e.skills = "Add at least one skill (3+ recommended).";
  if (!f.preferredRole) e.preferredRole = "Choose a preferred role.";
  if (f.preferredLocations.length === 0) e.preferredLocations = "Pick at least one location.";
  const sal = Number(f.expectedSalary);
  if (f.expectedSalary === "" || isNaN(sal) || sal < 0 || sal > 100) e.expectedSalary = "Enter a salary between 0 and 100 LPA.";
  return e;
}

function Field({ id, label, tip, error, hint, children }: { id: string; label: string; tip?: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {tip && <Tooltip text={tip} />}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="muted mt-1.5 text-xs">{hint}</p>
      )}
    </div>
  );
}

export default function EligibilityForm() {
  const router = useRouter();
  const { user, profile: savedProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<keyof F, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Prefill from last session / saved account profile
  useEffect(() => {
    const p = loadProfile() ?? (savedProfile?.degree ? (savedProfile as Profile) : null);
    if (p) {
      setF({
        fullName: p.fullName ?? "", email: p.email ?? "", phone: p.phone ?? "", city: p.city ?? "",
        degree: p.degree ?? "", branch: p.branch ?? "", scoreType: p.scoreType ?? "cgpa", score: String(p.score ?? ""),
        backlogs: String(p.backlogs ?? 0), gradYear: String(p.gradYear ?? INITIAL.gradYear),
        certifications: p.certifications ?? [], internships: String(p.internships ?? 0),
        skills: p.skills ?? [], preferredRole: p.preferredRole ?? "",
        preferredLocations: p.preferredLocations ?? [], expectedSalary: String(p.expectedSalary ?? 6),
      });
    } else if (user) {
      setF((x) => ({ ...x, fullName: x.fullName || user.name, email: x.email || user.email }));
    }
  }, [user, savedProfile]);

  const errors = useMemo(() => validate(f), [f]);
  const set = <K extends keyof F>(k: K, v: F[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const err = (k: keyof F) => (touched[k] ? errors[k] : undefined);
  const cls = (k: keyof F) => `input ${err(k) ? "input-error" : ""}`;
  const aria = (k: keyof F) => ({ "aria-invalid": !!err(k), "aria-describedby": err(k) ? `${k}-err` : undefined });

  const stepErrors = (s: number) => STEP_FIELDS[s].filter((k) => errors[k]);

  const next = () => {
    const bad = stepErrors(step);
    if (bad.length) {
      setTouched((t) => ({ ...t, ...Object.fromEntries(STEP_FIELDS[step].map((k) => [k, true])) }));
      toast.error("Please fix the highlighted fields to continue.");
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    const bad = stepErrors(step);
    if (bad.length) {
      setTouched((t) => ({ ...t, ...Object.fromEntries(STEP_FIELDS[step].map((k) => [k, true])) }));
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const firstBadStep = STEP_FIELDS.findIndex((_, i) => stepErrors(i).length);
    if (firstBadStep !== -1) {
      setStep(firstBadStep);
      toast.error("Some earlier fields need attention.");
      return;
    }
    setSubmitting(true);
    const profile: Profile = {
      fullName: f.fullName.trim(), email: f.email.trim(), phone: f.phone.trim(), city: f.city.trim(),
      degree: f.degree, branch: f.branch, scoreType: f.scoreType, score: Number(f.score),
      backlogs: Number(f.backlogs), gradYear: Number(f.gradYear), skills: f.skills,
      certifications: f.certifications, internships: Number(f.internships),
      preferredRole: f.preferredRole, preferredLocations: f.preferredLocations,
      expectedSalary: Number(f.expectedSalary),
    };
    saveProfile(profile);
    if (user) {
      fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }) }).catch(() => {});
    }
    toast.success("Profile saved — calculating your matches…");
    router.push("/results");
  };

  return (
    <StepForm steps={STEPS} current={step} onBack={() => setStep((s) => Math.max(0, s - 1))} onNext={next} onSubmit={submit} submitting={submitting} submitLabel="See my results">
      {step === 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label="Full name" error={err("fullName")}>
            <input id="fullName" className={cls("fullName")} value={f.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" {...aria("fullName")} />
          </Field>
          <Field id="email" label="Email" error={err("email")} tip="We'll use this for drive alerts and your report.">
            <input id="email" type="email" className={cls("email")} value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" {...aria("email")} />
          </Field>
          <Field id="phone" label="Phone (optional)" error={err("phone")} hint="10-digit mobile number">
            <input id="phone" inputMode="numeric" className={cls("phone")} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" {...aria("phone")} />
          </Field>
          <Field id="city" label="Current city (optional)">
            <input id="city" className="input" value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="degree" label="Degree" error={err("degree")}>
            <select id="degree" className={cls("degree")} value={f.degree} onChange={(e) => set("degree", e.target.value)} {...aria("degree")}>
              <option value="">Select degree</option>
              {DEGREES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field id="branch" label="Branch / stream" error={err("branch")}>
            <select id="branch" className={cls("branch")} value={f.branch} onChange={(e) => set("branch", e.target.value)} {...aria("branch")}>
              <option value="">Select branch</option>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field id="score" label={f.scoreType === "cgpa" ? "CGPA (out of 10)" : "Percentage"} error={err("score")} tip="Use your aggregate up to the latest completed semester. Percentages are converted to CGPA (÷ 9.5).">
            <div className="flex gap-2">
              <input id="score" type="number" step="0.01" min="0" className={cls("score")} value={f.score} onChange={(e) => set("score", e.target.value)} {...aria("score")} />
              <div role="group" aria-label="Score type" className="flex shrink-0 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                {(["cgpa", "percentage"] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={f.scoreType === t} onClick={() => set("scoreType", t)} className={`px-3 text-xs font-semibold ${f.scoreType === t ? "bg-indigo-600 text-white" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>
                    {t === "cgpa" ? "CGPA" : "%"}
                  </button>
                ))}
              </div>
            </div>
          </Field>
          <Field id="backlogs" label="Active backlogs" error={err("backlogs")} tip="Number of subjects you still need to clear.">
            <input id="backlogs" type="number" min="0" className={cls("backlogs")} value={f.backlogs} onChange={(e) => set("backlogs", e.target.value)} {...aria("backlogs")} />
          </Field>
          <Field id="gradYear" label="Graduation year" error={err("gradYear")}>
            <select id="gradYear" className={cls("gradYear")} value={f.gradYear} onChange={(e) => set("gradYear", e.target.value)} {...aria("gradYear")}>
              {GRAD_YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
          <Field id="internships" label="Internships completed" error={err("internships")}>
            <input id="internships" type="number" min="0" className={cls("internships")} value={f.internships} onChange={(e) => set("internships", e.target.value)} {...aria("internships")} />
          </Field>
          <div className="sm:col-span-2">
            <span className="label">Certifications (optional) <Tooltip text="Type a certification and press Enter, e.g. AWS Cloud Practitioner." /></span>
            <TagSelector label="Certifications" value={f.certifications} onChange={(v) => set("certifications", v)} options={["AWS Cloud Practitioner", "Google Data Analytics", "Azure Fundamentals", "NPTEL – DSA", "Oracle Java SE"]} placeholder="Add certification and press Enter" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <span className="label">
            Your skills <Tooltip text="Pick the skills you can confidently use. Required skills make up 40% of your match score." />
          </span>
          <TagSelector label="Skills" value={f.skills} onChange={(v) => set("skills", v)} options={SKILLS} placeholder="Search skills — e.g. Python, SQL, React" />
          {err("skills") && <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{err("skills")}</p>}
          <p className="muted mt-4 text-sm">Popular picks:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SKILLS.filter((s) => !f.skills.includes(s)).slice(0, 12).map((s) => (
              <button key={s} type="button" className="chip" onClick={() => set("skills", [...f.skills, s])}>+ {s}</button>
            ))}
          </div>
          <p className="muted mt-4 text-xs">{f.skills.length} selected</p>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="preferredRole" label="Preferred role" error={err("preferredRole")}>
            <select id="preferredRole" className={cls("preferredRole")} value={f.preferredRole} onChange={(e) => set("preferredRole", e.target.value)} {...aria("preferredRole")}>
              <option value="">Select role</option>
              <option value="Any">Open to any role</option>
              {ROLE_CATEGORIES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field id="expectedSalary" label={`Expected salary: ${f.expectedSalary || 0} LPA`} error={err("expectedSalary")} tip="Annual package in lakhs per annum (LPA). Used to highlight drives that meet your expectation.">
            <div className="flex items-center gap-3">
              <input id="expectedSalary" type="range" min="0" max="50" step="0.5" className="w-full accent-indigo-600" value={f.expectedSalary || 0} onChange={(e) => set("expectedSalary", e.target.value)} {...aria("expectedSalary")} />
              <input aria-label="Expected salary in LPA" type="number" min="0" max="100" step="0.5" className="input !w-24" value={f.expectedSalary} onChange={(e) => set("expectedSalary", e.target.value)} />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <span className="label">Preferred locations</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred locations">
              {LOCATIONS.map((l) => {
                const on = f.preferredLocations.includes(l);
                return (
                  <button key={l} type="button" aria-pressed={on} onClick={() => set("preferredLocations", on ? f.preferredLocations.filter((x) => x !== l) : [...f.preferredLocations, l])} className={`chip !px-4 !py-1.5 ${on ? "chip-on" : ""}`}>
                    {l}
                  </button>
                );
              })}
            </div>
            {err("preferredLocations") && <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{err("preferredLocations")}</p>}
          </div>
        </div>
      )}
    </StepForm>
  );
}
