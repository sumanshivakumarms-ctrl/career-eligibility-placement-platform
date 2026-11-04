import { db } from "@/db";
import { companies } from "@/db/schema";
import { forbidden, json, requireAdmin } from "@/lib/auth";
import { listCompanies } from "@/lib/data";
import { parseCompany } from "@/lib/admin-parse";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return forbidden();
  return json({ companies: await listCompanies() });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const parsed = parseCompany(await req.json().catch(() => ({})));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const [row] = await db.insert(companies).values(parsed.value).returning();
  return json({ company: row }, 201);
}
