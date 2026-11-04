import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, companies, drives, users } from "@/db/schema";
import { forbidden, json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

/** List applicants as JSON, or as CSV with ?format=csv. Optional ?driveId= filter. */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const url = new URL(req.url);
  const driveId = Number(url.searchParams.get("driveId")) || null;

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      matchScore: applications.matchScore,
      appliedAt: applications.createdAt,
      driveId: drives.id,
      role: drives.role,
      company: companies.name,
      name: users.name,
      email: users.email,
      profile: users.profile,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .innerJoin(drives, eq(applications.driveId, drives.id))
    .innerJoin(companies, eq(drives.companyId, companies.id))
    .where(driveId ? eq(applications.driveId, driveId) : undefined)
    .orderBy(desc(applications.createdAt));

  const data = rows.map((r) => {
    const p = (r.profile ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      status: r.status,
      matchScore: r.matchScore,
      appliedAt: r.appliedAt.toISOString(),
      driveId: r.driveId,
      role: r.role,
      company: r.company,
      name: r.name,
      email: r.email,
      degree: String(p.degree ?? ""),
      branch: String(p.branch ?? ""),
      cgpa: p.score != null ? `${p.score}${p.scoreType === "percentage" ? "%" : ""}` : "",
      skills: Array.isArray(p.skills) ? (p.skills as string[]).join("; ") : "",
    };
  });

  if (url.searchParams.get("format") === "csv") {
    const header = ["Applicant", "Email", "Company", "Role", "Status", "Match %", "Degree", "Branch", "CGPA/Score", "Skills", "Applied At"];
    const lines = data.map((d) =>
      [d.name, d.email, d.company, d.role, d.status, d.matchScore ?? "", d.degree, d.branch, d.cgpa, d.skills, d.appliedAt]
        .map(csvCell)
        .join(","),
    );
    return new Response([header.map(csvCell).join(","), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="applicants.csv"',
      },
    });
  }
  return json({ applicants: data });
}
