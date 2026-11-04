import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, notifications, users } from "@/db/schema";
import { getSession, json, unauthorized } from "@/lib/auth";
import { getDrive } from "@/lib/data";
import { evaluate } from "@/lib/eligibility";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Apply / register for a drive. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return unauthorized();
  const { driveId } = await req.json().catch(() => ({}));
  const drive = await getDrive(Number(driveId));
  if (!drive) return json({ error: "Drive not found." }, 404);
  if (new Date(drive.deadline) < new Date()) return json({ error: "The deadline for this drive has passed." }, 400);

  const dup = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, s.id), eq(applications.driveId, drive.id)))
    .limit(1);
  if (dup.length) return json({ error: "You have already applied to this drive." }, 409);

  // Record the match score if the user has a saved profile
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  const p = u?.profile as Partial<Profile> | null;
  const matchScore = p?.degree && typeof p.score === "number" ? evaluate(p as Profile, drive).score : null;

  await db.insert(applications).values({ userId: s.id, driveId: drive.id, matchScore });
  await db.insert(notifications).values({
    userId: s.id,
    title: "Application submitted",
    message: `You applied for ${drive.role} at ${drive.company.name}. We'll notify you about status updates.`,
    link: `/companies/${drive.id}`,
  });
  return json({ ok: true });
}
