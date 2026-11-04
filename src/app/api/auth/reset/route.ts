import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { json } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const [r] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.token, token), eq(passwordResets.used, false), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!r) return json({ error: "This reset link is invalid or has expired." }, 400);

  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, r.userId));
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, r.id));
  return json({ ok: true });
}
