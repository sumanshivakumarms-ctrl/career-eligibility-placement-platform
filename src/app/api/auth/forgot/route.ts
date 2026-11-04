import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { json } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Creates a one-hour reset token.
 * No mail server is bundled, so in demo mode the reset link is returned in the
 * response. Set SHOW_RESET_LINK=false and plug in your mailer for production.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const demo = process.env.SHOW_RESET_LINK !== "false";
  if (!user) return json({ ok: true }); // don't reveal whether the account exists

  const token = randomBytes(24).toString("hex");
  await db.insert(passwordResets).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 3600_000),
  });
  return json({ ok: true, resetUrl: demo ? `/reset-password?token=${token}` : undefined });
}
