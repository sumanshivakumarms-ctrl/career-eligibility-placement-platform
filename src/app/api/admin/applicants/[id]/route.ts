import { forbidden, json, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SHORTLISTED",
] as const;

type ApplicationStatus = (typeof ALLOWED_STATUSES)[number];

type Ctx = {
  params: Promise<{ id?: string }>;
};

/** GET: Fetch applicants (database-free version) */
export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return forbidden();
  }

  const url = new URL(req.url);
  const driveId = Number(url.searchParams.get("driveId")) || null;

  // Return a safe mock response or empty array since no database is configured
  return json({
    applicants: [],
    driveId,
    message: "No database is configured. Returning empty applicant list.",
  });
}

/** PATCH: Update an application's status (database-free version) */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return forbidden();
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id || "unknown";

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