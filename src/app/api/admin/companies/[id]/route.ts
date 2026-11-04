import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { forbidden, json, requireAdmin } from "@/lib/auth";
import { parseCompany } from "@/lib/admin-parse";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();
  const { id } = await params;
  const parsed = parseCompany(await req.json().catch(() => ({})));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const [row] = await db.update(companies).set(parsed.value).where(eq(companies.id, Number(id))).returning();
  return row ? json({ company: row }) : json({ error: "Not found." }, 404);
}

/** Deleting a company also removes its drives and applications (cascade). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();
  const { id } = await params;
  await db.delete(companies).where(eq(companies.id, Number(id)));
  return json({ ok: true });
}
