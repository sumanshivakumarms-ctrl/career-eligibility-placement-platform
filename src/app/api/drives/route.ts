import { listDrives } from "@/lib/data";
import { json } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json({ drives: await listDrives() });
  } catch {
    return json({ error: "Could not load drives." }, 500);
  }
}
