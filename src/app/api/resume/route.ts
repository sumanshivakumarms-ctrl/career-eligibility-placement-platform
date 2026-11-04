import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, json } from "@/lib/auth";
import { extractPdfText, scoreResume } from "@/lib/resume";

export const dynamic = "force-dynamic";

/** Accepts multipart (file) or JSON ({ text }) and returns an ATS-style score. */
export async function POST(req: Request) {
  let text = "";
  let fileName = "";
  let note: string | undefined;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file instanceof File) {
      if (file.size > 5 * 1024 * 1024) return json({ error: "File is larger than 5 MB." }, 400);
      fileName = file.name;
      const buf = Buffer.from(await file.arrayBuffer());
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".pdf")) text = extractPdfText(buf);
      else if (lower.endsWith(".txt") || lower.endsWith(".md")) text = buf.toString("utf8");
      else if (lower.endsWith(".docx") || lower.endsWith(".doc"))
        note = "DOCX text extraction isn't supported here — paste your resume text below for a full analysis.";
      else return json({ error: "Upload a PDF, DOCX or TXT file." }, 400);
    }
    const pasted = form.get("text");
    if (!text && typeof pasted === "string") text = pasted;
  } else {
    const body = await req.json().catch(() => ({}));
    text = String(body.text ?? "");
  }

  if (text.trim().length < 80) {
    return json(
      {
        error:
          note ??
          "We couldn't read enough text from this file. Paste your resume text in the box for analysis.",
        needsText: true,
      },
      422,
    );
  }

  const result = scoreResume(text);
  const s = await getSession();
  if (s) {
    const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
    if (u) {
      await db
        .update(users)
        .set({ profile: { ...(u.profile ?? {}), resumeScore: result.score } })
        .where(eq(users.id, s.id));
    }
  }
  return json({ ...result, fileName });
}
