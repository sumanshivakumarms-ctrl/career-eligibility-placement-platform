/**
 * Server-side data access. Also lazily seeds the database on first use so a
 * fresh install works with zero manual steps.
 */
import "server-only";
import bcrypt from "bcryptjs";
import { eq, asc, sql, gt } from "drizzle-orm";
import { db } from "@/db";
import { companies, drives, users } from "@/db/schema";
import { seedCompanies, seedDrives } from "./seed-data";
import type { CompanyDTO, DriveDTO } from "./types";

let seeding: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(companies);
      if (count === 0) {
        const inserted = await db.insert(companies).values(seedCompanies).returning();
        const byName = new Map(inserted.map((c) => [c.name, c.id]));
        const now = Date.now();
        await db.insert(drives).values(
          seedDrives.map((d) => {
            const { company, days, ...rest } = d;
            return {
              ...rest,
              companyId: byName.get(company)!,
              deadline: new Date(now + days * 86400000),
            };
          }),
        );
      }
      const [{ ucount }] = await db.select({ ucount: sql<number>`count(*)::int` }).from(users);
      if (ucount === 0) {
        await db.insert(users).values([
          { name: "Placement Admin", email: "admin@careerpath.dev", role: "admin", passwordHash: await bcrypt.hash("Admin@123", 10) },
          { name: "Demo Student", email: "student@careerpath.dev", role: "student", passwordHash: await bcrypt.hash("Student@123", 10) },
        ]);
      }
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

type CompanyRow = typeof companies.$inferSelect;
type DriveRow = typeof drives.$inferSelect;

export const toCompanyDTO = (c: CompanyRow): CompanyDTO => ({
  id: c.id,
  name: c.name,
  industry: c.industry,
  initials: c.initials,
  color: c.color,
  description: c.description,
  website: c.website,
  headquarters: c.headquarters,
  employees: c.employees,
  rating: c.rating,
  featured: c.featured,
  placedCount: c.placedCount,
});

export const toDriveDTO = (d: DriveRow, c: CompanyRow): DriveDTO => ({
  id: d.id,
  companyId: d.companyId,
  role: d.role,
  category: d.category,
  jobType: d.jobType,
  packageLpa: d.packageLpa,
  location: d.location,
  description: d.description,
  deadline: d.deadline.toISOString(),
  minCgpa: d.minCgpa,
  maxBacklogs: d.maxBacklogs,
  branches: d.branches,
  degrees: d.degrees,
  skills: d.skills,
  passoutYears: d.passoutYears,
  process: d.process,
  openings: d.openings,
  company: toCompanyDTO(c),
});

export async function listDrives(): Promise<DriveDTO[]> {
  await ensureSeeded();
  const rows = await db
    .select({ d: drives, c: companies })
    .from(drives)
    .innerJoin(companies, eq(drives.companyId, companies.id))
    .orderBy(asc(drives.deadline));
  return rows.map((r) => toDriveDTO(r.d, r.c));
}

export async function getDrive(id: number): Promise<DriveDTO | null> {
  await ensureSeeded();
  const rows = await db
    .select({ d: drives, c: companies })
    .from(drives)
    .innerJoin(companies, eq(drives.companyId, companies.id))
    .where(eq(drives.id, id))
    .limit(1);
  return rows[0] ? toDriveDTO(rows[0].d, rows[0].c) : null;
}

export async function listCompanies(): Promise<CompanyDTO[]> {
  await ensureSeeded();
  const rows = await db.select().from(companies).orderBy(asc(companies.name));
  return rows.map(toCompanyDTO);
}

export async function getStats() {
  await ensureSeeded();
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(companies);
  const [p] = await db.select({ n: sql<number>`coalesce(sum(placed_count),0)::int` }).from(companies);
  const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(drives).where(gt(drives.deadline, new Date()));
  return { companies: c.n, placed: p.n, activeDrives: a.n };
}

export async function getFeaturedCompanies(): Promise<CompanyDTO[]> {
  await ensureSeeded();
  const rows = await db.select().from(companies).where(eq(companies.featured, true));
  return rows.map(toCompanyDTO);
}
