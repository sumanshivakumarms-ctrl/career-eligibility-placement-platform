import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const fail = () => NextResponse.redirect(`${origin}/login?error=google_failed`);
  if (!code) return fail();

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return fail();
    const info = await (
      await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
    ).json();
    if (!info.email) return fail();

    const email = String(info.email).toLowerCase();
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ name: info.name ?? email.split("@")[0], email, googleId: info.sub })
        .returning();
    }
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "admin" ? "admin" : "student",
    });
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch {
    return fail();
  }
}
