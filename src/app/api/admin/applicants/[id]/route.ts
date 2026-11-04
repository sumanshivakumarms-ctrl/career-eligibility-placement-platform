import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, notifications } from "@/db/schema";
import { forbidden, json, requireAdmin } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/types";
import { getDrive } from "@/lib/data";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Update an application's status and notify the applicant. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!APPLICATION_STATUSES.includes(status)) return json({ error: "Invalid status." }, 400);

  const [row] = await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, Number(id)))
    .returning();
  if (!row) return json({ error: "Not found." }, 404);

  const drive = await getDrive(row.driveId);
  await db.insert(notifications).values({
    userId: row.userId,
    title: `Application ${status.toLowerCase()}`,
    message: `Your application for ${drive?.role ?? "a drive"} at ${drive?.company.name ?? ""} is now “${status}”.`,
    link: "/dashboard",
  });
  return json({ ok: true });
}
