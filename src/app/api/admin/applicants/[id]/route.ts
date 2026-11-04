import { forbidden, json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SHORTLISTED",
] as const;

type ApplicationStatus = (typeof ALLOWED_STATUSES)[number];

/** Update an application's status (database-free version). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return forbidden();
  }

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid or missing JSON payload." }, 400);
  }

  const { status } = body;

  if (!status || !ALLOWED_STATUSES.includes(status as ApplicationStatus)) {
    return json(
      { 
        error: `Invalid status. Allowed values are: ${ALLOWED_STATUSES.join(", ")}` 
      }, 
      400
    );
  }

  return json({
    ok: true,
    message: "Status received. No database is configured.",
    applicantId: id,
    status,
  });
}