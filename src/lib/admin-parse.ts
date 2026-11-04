/** Validation helpers for admin create/update payloads. */

const str = (v: unknown, d = "") => (typeof v === "string" ? v.trim() : d);
const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const strArr = (v: unknown) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

export function parseCompany(b: Record<string, unknown>) {
  const name = str(b.name);
  if (name.length < 2) return { error: "Company name is required." } as const;
  return {
    value: {
      name,
      industry: str(b.industry, "Technology") || "Technology",
      initials: (str(b.initials) || name.slice(0, 2)).toUpperCase().slice(0, 3),
      color: /^#[0-9a-fA-F]{6}$/.test(str(b.color)) ? str(b.color) : "#4f46e5",
      description: str(b.description),
      website: str(b.website),
      headquarters: str(b.headquarters),
      employees: str(b.employees),
      rating: Math.min(5, Math.max(0, num(b.rating, 4))),
      featured: Boolean(b.featured),
      placedCount: Math.max(0, Math.round(num(b.placedCount))),
    },
  } as const;
}

export function parseDrive(b: Record<string, unknown>) {
  const role = str(b.role);
  const companyId = Math.round(num(b.companyId));
  const deadline = new Date(str(b.deadline));
  if (!role) return { error: "Role title is required." } as const;
  if (!companyId) return { error: "Select a company." } as const;
  if (isNaN(deadline.getTime())) return { error: "A valid deadline is required." } as const;
  const process = Array.isArray(b.process)
    ? (b.process as { title?: unknown; description?: unknown }[])
        .map((p) => ({ title: str(p.title), description: str(p.description) }))
        .filter((p) => p.title)
    : [];
  return {
    value: {
      companyId,
      role,
      category: str(b.category, "Software Engineer"),
      jobType: str(b.jobType, "Full-time"),
      packageLpa: Math.max(0, num(b.packageLpa)),
      location: str(b.location, "Pan India") || "Pan India",
      description: str(b.description),
      deadline,
      minCgpa: Math.min(10, Math.max(0, num(b.minCgpa))),
      maxBacklogs: Math.max(0, Math.round(num(b.maxBacklogs))),
      branches: strArr(b.branches).length ? strArr(b.branches) : ["Any"],
      degrees: strArr(b.degrees),
      skills: strArr(b.skills),
      passoutYears: strArr(b.passoutYears).map(Number).filter((n) => n > 1990 && n < 2100),
      process,
      openings: Math.max(1, Math.round(num(b.openings, 10))),
    },
  } as const;
}
