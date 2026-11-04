import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, json, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return unauthorized();
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  return json({ profile: u?.profile ?? null });
}

export async function PUT(req: Request) {
  const s = await getSession();
  if (!s) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.profile) return json({ error: "Missing profile." }, 400);
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  // Keep server-managed fields such as resumeScore
  const profile = { ...body.profile, resumeScore: (u?.profile as { resumeScore?: number } | null)?.resumeScore };
  await db.update(users).set({ profile }).where(eq(users.id, s.id));
  return json({ ok: true });
}
