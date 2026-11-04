import { listDrives } from "@/lib/data";
import { evaluateAll } from "@/lib/eligibility";
import { json } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Evaluate a profile against every active drive. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const p = body?.profile as Profile | undefined;
  if (!p || !p.degree || typeof p.score !== "number") {
    return json({ error: "Incomplete profile." }, 400);
  }
  const profile: Profile = {
    ...p,
    skills: Array.isArray(p.skills) ? p.skills : [],
    certifications: Array.isArray(p.certifications) ? p.certifications : [],
    preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
    backlogs: Number(p.backlogs) || 0,
    gradYear: Number(p.gradYear) || new Date().getFullYear(),
  };
  const drives = await listDrives();
  return json(evaluateAll(profile, drives));
}
