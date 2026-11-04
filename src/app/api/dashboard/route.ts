import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, notifications, savedJobs, users } from "@/db/schema";
import { getSession, json, unauthorized } from "@/lib/auth";
import { listDrives } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return unauthorized();
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  const drives = await listDrives();
  const byId = new Map(drives.map((d) => [d.id, d]));

  const saved = await db.select().from(savedJobs).where(eq(savedJobs.userId, s.id)).orderBy(desc(savedJobs.createdAt));
  const apps = await db.select().from(applications).where(eq(applications.userId, s.id)).orderBy(desc(applications.createdAt));
  const notes = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, s.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  return json({
    profile: u?.profile ?? null,
    saved: saved.map((r) => byId.get(r.driveId)).filter(Boolean),
    applications: apps
      .map((a) => ({
        id: a.id,
        status: a.status,
        matchScore: a.matchScore,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        drive: byId.get(a.driveId),
      }))
      .filter((a) => a.drive),
    notifications: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
  });
}

/** Mark notifications as read. */
export async function PATCH() {
  const s = await getSession();
  if (!s) return unauthorized();
  const ids = (await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.userId, s.id))).map((r) => r.id);
  if (ids.length) await db.update(notifications).set({ read: true }).where(inArray(notifications.id, ids));
  return json({ ok: true });
}
