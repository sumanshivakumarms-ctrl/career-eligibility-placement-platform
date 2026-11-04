/**
 * Eligibility engine (pure functions – runs on both server and client).
 *
 * Weighted scoring (total 100):
 *   CGPA     30  – full marks when >= cut-off, decays to 0 at 2 points below
 *   Skills   40  – proportional to the share of required skills matched
 *   Branch   20  – allowed branch list ("Any" = open to all)
 *   Other    10  – backlogs (4) + passout year (4) + degree (2)
 *
 * Status:
 *   eligible – every hard criterion passes and >= 60% of required skills matched
 *   almost   – no "unfixable" gap (branch / year / degree), CGPA gap <= 0.7,
 *              backlog excess <= 2, >= 25% of skills and score >= 50
 *   not      – everything else
 */
import type {
  DriveDTO,
  EvalResult,
  Profile,
  CheckItem,
  DriveResult,
} from "./types";
import { courseFor } from "./constants";

const norm = (s: string) => s.trim().toLowerCase();

/** Convert percentage to an approximate 10-point CGPA (CBSE formula: % / 9.5). */
export function normalizedCgpa(p: Pick<Profile, "scoreType" | "score">): number {
  const v = Number(p.score) || 0;
  return p.scoreType === "percentage" ? Math.round((v / 9.5) * 100) / 100 : v;
}

export function evaluate(p: Profile, d: DriveDTO): EvalResult {
  const cgpa = normalizedCgpa(p);
  const userSkills = new Set(p.skills.map(norm));
  const matchedSkills = d.skills.filter((s) => userSkills.has(norm(s)));
  const missingSkills = d.skills.filter((s) => !userSkills.has(norm(s)));
  const skillRatio = d.skills.length ? matchedSkills.length / d.skills.length : 1;

  const cgpaOk = cgpa >= d.minCgpa;
  const cgpaGap = Math.max(0, d.minCgpa - cgpa);
  const cgpaPts = cgpaOk ? 30 : Math.max(0, 30 * (1 - cgpaGap / 2));

  const skillPts = 40 * skillRatio;

  const branchOk =
    d.branches.length === 0 ||
    d.branches.some((b) => norm(b) === "any") ||
    d.branches.some((b) => norm(b) === norm(p.branch));
  const branchPts = branchOk ? 20 : 0;

  const backlogOk = p.backlogs <= d.maxBacklogs;
  const backlogExcess = Math.max(0, p.backlogs - d.maxBacklogs);
  const backlogPts = backlogOk ? 4 : 4 * Math.max(0, 1 - backlogExcess / 2);
  const yearOk = d.passoutYears.length === 0 || d.passoutYears.includes(p.gradYear);
  const yearPts = yearOk ? 4 : 0;
  const degreeOk = d.degrees.length === 0 || d.degrees.includes(p.degree);
  const degreePts = degreeOk ? 2 : 0;
  const otherPts = backlogPts + yearPts + degreePts;

  const score = Math.round(cgpaPts + skillPts + branchPts + otherPts);

  const checks: CheckItem[] = [
    {
      key: "cgpa",
      label: "Minimum CGPA",
      ok: cgpaOk,
      detail: `Required ${d.minCgpa.toFixed(1)} · You have ${cgpa.toFixed(2)}`,
    },
    {
      key: "skills",
      label: "Required skills",
      ok: skillRatio >= 0.6,
      detail: d.skills.length
        ? `${matchedSkills.length} of ${d.skills.length} matched`
        : "No specific skills required",
    },
    {
      key: "branch",
      label: "Branch",
      ok: branchOk,
      detail: d.branches.some((b) => norm(b) === "any")
        ? "Open to all branches"
        : `Allowed: ${d.branches.join(", ")}`,
    },
    {
      key: "backlogs",
      label: "Backlogs",
      ok: backlogOk,
      detail: `Max ${d.maxBacklogs} allowed · You have ${p.backlogs}`,
    },
    {
      key: "year",
      label: "Passout year",
      ok: yearOk,
      detail: d.passoutYears.length
        ? `Eligible batches: ${d.passoutYears.join(", ")} · Yours: ${p.gradYear}`
        : "All batches",
    },
    {
      key: "degree",
      label: "Degree",
      ok: degreeOk,
      detail: d.degrees.length ? `Allowed: ${d.degrees.join(", ")}` : "All degrees",
    },
  ];

  const unfixable = !branchOk || !yearOk || !degreeOk;
  const allHard = cgpaOk && backlogOk && !unfixable;
  let status: EvalResult["status"] = "not";
  if (allHard && skillRatio >= 0.6) status = "eligible";
  else if (
    !unfixable &&
    cgpaGap <= 0.7 &&
    backlogExcess <= 2 &&
    skillRatio >= 0.25 &&
    score >= 50
  )
    status = "almost";

  // ---- Actionable suggestions ----
  const suggestions: string[] = [];
  if (!degreeOk)
    suggestions.push(
      `This drive accepts only ${d.degrees.join(", ")}. Look for drives that accept ${p.degree}.`,
    );
  if (!branchOk)
    suggestions.push(
      `Your branch (${p.branch || "—"}) isn't listed. Filter drives that are open to all branches.`,
    );
  if (!yearOk)
    suggestions.push(
      `This drive is for the ${d.passoutYears.join("/")} batch. Watch for next year's drive from ${d.company.name}.`,
    );
  if (!cgpaOk)
    suggestions.push(
      `Raise your CGPA by ${cgpaGap.toFixed(1)} points (cut-off ${d.minCgpa.toFixed(1)}) — or target drives with a lower cut-off.`,
    );
  if (!backlogOk)
    suggestions.push(
      `Clear ${backlogExcess} backlog${backlogExcess > 1 ? "s" : ""} — ${d.company.name} allows at most ${d.maxBacklogs}.`,
    );
  missingSkills.slice(0, 4).forEach((s) => {
    const c = courseFor(s);
    suggestions.push(`Learn ${s}: try “${c.title}” (${c.provider}).`);
  });
  if (status === "eligible" && suggestions.length === 0)
    suggestions.push("You meet every criterion — polish your resume and apply early!");

  // ---- Preference matches (informational / used for filters) ----
  const roleMatch =
    !p.preferredRole || p.preferredRole === "Any" || d.category === p.preferredRole;
  const loc = d.location.toLowerCase();
  const locationMatch =
    p.preferredLocations.length === 0 ||
    loc.includes("pan india") ||
    loc.includes("remote") ||
    p.preferredLocations.some((l) => loc.includes(l.toLowerCase()));
  const salaryMatch = !p.expectedSalary || d.packageLpa >= p.expectedSalary;

  return {
    score,
    status,
    breakdown: {
      cgpa: Math.round(cgpaPts),
      skills: Math.round(skillPts),
      branch: Math.round(branchPts),
      other: Math.round(otherPts),
    },
    matchedSkills,
    missingSkills,
    checks,
    suggestions,
    roleMatch,
    locationMatch,
    salaryMatch,
  };
}

/** Evaluate a profile against all drives and aggregate overall insights. */
export function evaluateAll(p: Profile, drives: DriveDTO[]) {
  const results: DriveResult[] = drives
    .map((drive) => ({ drive, evaluation: evaluate(p, drive) }))
    .sort((a, b) => b.evaluation.score - a.evaluation.score);

  const top = results.slice(0, 5);
  const overall = top.length
    ? Math.round(top.reduce((s, r) => s + r.evaluation.score, 0) / top.length)
    : 0;

  // Skill gap: missing skills across drives that are within reach
  const gapMap = new Map<string, number>();
  results
    .filter((r) => r.evaluation.score >= 40)
    .forEach((r) =>
      r.evaluation.missingSkills.forEach((s) => gapMap.set(s, (gapMap.get(s) ?? 0) + 1)),
    );
  const gaps = [...gapMap.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const counts = {
    eligible: results.filter((r) => r.evaluation.status === "eligible").length,
    almost: results.filter((r) => r.evaluation.status === "almost").length,
    not: results.filter((r) => r.evaluation.status === "not").length,
  };
  return { results, overall, gaps, counts };
}

/** Profile completeness helper (0-100) used by the dashboard. */
export function profileCompletion(p: Partial<Profile> | null | undefined) {
  const items = [
    { label: "Personal info", done: !!(p?.fullName && p?.email) },
    { label: "Education details", done: !!(p?.degree && p?.branch && p?.score) },
    { label: "Skills added (3+)", done: (p?.skills?.length ?? 0) >= 3 },
    { label: "Preferences set", done: !!(p?.preferredRole && p?.preferredLocations?.length) },
    { label: "Certifications or internships", done: (p?.certifications?.length ?? 0) > 0 || (p?.internships ?? 0) > 0 },
    { label: "Resume ATS score ≥ 70", done: (p?.resumeScore ?? 0) >= 70 },
  ];
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { items, pct };
}
