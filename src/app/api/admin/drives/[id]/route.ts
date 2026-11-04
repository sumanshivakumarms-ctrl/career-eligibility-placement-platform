import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drives } from "@/db/schema";
import { forbidden, json, requireAdmin } from "@/lib/auth";
import { parseDrive } from "@/lib/admin-parse";
import { getDrive } from "@/lib/data";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();
  const { id } = await params;
  const parsed = parseDrive(await req.json().catch(() => ({})));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const [row] = await db.update(drives).set(parsed.value).where(eq(drives.id, Number(id))).returning();
  return row ? json({ drive: await getDrive(row.id) }) : json({ error: "Not found." }, 404);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();
  const { id } = await params;
  await db.delete(drives).where(eq(drives.id, Number(id)));
  return json({ ok: true });
}
