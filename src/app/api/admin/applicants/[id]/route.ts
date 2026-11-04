
import { forbidden, json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

/** Update an application's status (database-free version). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return forbidden();

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  const allowedStatuses = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "SHORTLISTED",
  ];

  if (!allowedStatuses.includes(status)) {
    return json({ error: "Invalid status." }, 400);
  }

  return json({
    ok: true,
    message: "Status received. No database is configured.",
    applicantId: id,
    status,
  });
}
