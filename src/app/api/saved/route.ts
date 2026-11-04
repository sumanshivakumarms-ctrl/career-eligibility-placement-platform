import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedJobs } from "@/db/schema";
import { getSession, json, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Toggle bookmark for a drive. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return unauthorized();
  const { driveId } = await req.json().catch(() => ({}));
  const id = Number(driveId);
  if (!id) return json({ error: "Invalid drive." }, 400);

  const existing = await db
    .select()
    .from(savedJobs)
    .where(and(eq(savedJobs.userId, s.id), eq(savedJobs.driveId, id)))
    .limit(1);
  if (existing.length) {
    await db.delete(savedJobs).where(eq(savedJobs.id, existing[0].id));
    return json({ saved: false });
  }
  await db.insert(savedJobs).values({ userId: s.id, driveId: id });
  return json({ saved: true });
}
