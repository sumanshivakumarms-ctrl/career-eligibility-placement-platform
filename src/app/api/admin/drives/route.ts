import { db } from "@/db";
import { drives, notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { forbidden, json, requireAdmin } from "@/lib/auth";
import { getDrive } from "@/lib/data";
import { parseDrive } from "@/lib/admin-parse";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const parsed = parseDrive(await req.json().catch(() => ({})));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const [row] = await db.insert(drives).values(parsed.value).returning();
  const drive = await getDrive(row.id);

  // Notify every student about the new drive
  const students = await db.select({ id: users.id }).from(users).where(eq(users.role, "student"));
  if (drive && students.length) {
    await db.insert(notifications).values(
      students.map((s) => ({
        userId: s.id,
        title: `New drive: ${drive.company.name}`,
        message: `${drive.role} · ${drive.packageLpa} LPA. Check if you're eligible!`,
        link: `/companies/${drive.id}`,
      })),
    );
  }
  return json({ drive }, 201);
}
