/** JWT session helpers (httpOnly cookie). Server only. */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-secret-change-me-in-production-0123456789",
);
export const SESSION_COOKIE = "cp_session";

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return {
      id: Number(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role === "admin" ? "admin" : "student",
    };
  } catch {
    return null;
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const unauthorized = () => json({ error: "Please log in to continue." }, 401);
export const forbidden = () => json({ error: "Admin access required." }, 403);

/** Returns the session or null; use with `unauthorized()`. */
export async function requireAdmin() {
  const s = await getSession();
  return s && s.role === "admin" ? s : null;
}
