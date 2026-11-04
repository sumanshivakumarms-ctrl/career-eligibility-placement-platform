import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { createSession, json } from "@/lib/auth";
import { ensureSeeded } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2) return json({ error: "Please enter your full name." }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return json({ error: "An account with this email already exists." }, 409);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await bcrypt.hash(password, 10) })
    .returning();

  await db.insert(notifications).values({
    userId: user.id,
    title: "Welcome to CareerPath 🎉",
    message: "Complete the eligibility checker to see which drives you qualify for.",
    link: "/eligibility",
  });

  await createSession({ id: user.id, name: user.name, email: user.email, role: "student" });
  return json({ user: { id: user.id, name: user.name, email: user.email, role: "student" } });
}
