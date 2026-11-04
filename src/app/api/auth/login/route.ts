import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, json } from "@/lib/auth";
import { ensureSeeded } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return json({ error: "Incorrect email or password." }, 401);
  }
  const role = user.role === "admin" ? "admin" : "student";
  await createSession({ id: user.id, name: user.name, email: user.email, role });
  return json({ user: { id: user.id, name: user.name, email: user.email, role } });
}
