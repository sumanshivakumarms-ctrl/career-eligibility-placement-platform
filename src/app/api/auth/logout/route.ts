import { clearSession, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession();
  return json({ ok: true });
}
