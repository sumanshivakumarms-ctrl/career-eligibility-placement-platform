import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, savedJobs, applications } from "@/db/schema";
import { getSession, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Current user + bookmark/applied ids + saved eligibility profile. */
export async function GET() {
  const s = await getSession();
  if (!s) return json({ user: null, savedIds: [], appliedIds: [], profile: null });
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  if (!u) return json({ user: null, savedIds: [], appliedIds: [], profile: null });
  const saved = await db.select({ id: savedJobs.driveId }).from(savedJobs).where(eq(savedJobs.userId, s.id));
  const applied = await db.select({ id: applications.driveId }).from(applications).where(eq(applications.userId, s.id));
  return json({
    user: { id: u.id, name: u.name, email: u.email, role: u.role === "admin" ? "admin" : "student" },
    savedIds: saved.map((r) => r.id),
    appliedIds: applied.map((r) => r.id),
    profile: u.profile ?? null,
  });
}
