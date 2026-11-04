/**
 * Basic ATS-style resume analysis.
 * Text extraction: plain text directly; PDF via a lightweight stream parser
 * (works for most text-based PDFs). Anything else falls back to pasted text.
 */
import { inflateSync } from "zlib";
import { SKILLS } from "./constants";

export function extractPdfText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  const out: string[] = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    let content = m[1];
    try {
      content = inflateSync(Buffer.from(content, "latin1")).toString("latin1");
    } catch {
      /* stream not compressed – use as-is */
    }
    if (!/BT[\s\S]*ET/.test(content)) continue;
    const blocks = content.match(/BT[\s\S]*?ET/g) ?? [];
    for (const b of blocks) {
      const parts = b.match(/\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f]+>/g) ?? [];
      for (const p of parts) {
        if (p.startsWith("(")) {
          out.push(
            p
              .slice(1, -1)
              .replace(/\\([()\\])/g, "$1")
              .replace(/\\n/g, " ")
              .replace(/\\\d{3}/g, " "),
          );
        }
      }
      out.push(" ");
    }
  }
  return out.join("").replace(/\s+/g, " ").trim();
}

const ACTION_VERBS = [
  "built", "developed", "designed", "led", "created", "implemented", "improved", "optimized",
  "managed", "launched", "analyzed", "automated", "delivered", "reduced", "increased",
  "collaborated", "deployed", "engineered", "organized", "achieved", "mentored", "migrated",
];

export type ResumeCheck = { label: string; ok: boolean; points: number; max: number; tip: string };

export function scoreResume(text: string) {
  const t = text.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const checks: ResumeCheck[] = [];
  const add = (label: string, ok: boolean, max: number, tip: string, partial = ok ? 1 : 0) =>
    checks.push({ label, ok, max, points: Math.round(max * partial), tip });

  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(t);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(t);
  add("Contact details", hasEmail && hasPhone, 10, "Add a professional email and a phone number at the top.", (Number(hasEmail) + Number(hasPhone)) / 2);
  add("LinkedIn / GitHub link", /linkedin\.com|github\.com/.test(t), 5, "Link your LinkedIn and GitHub so recruiters can verify your work.");
  add("Education section", /education|b\.?tech|b\.?e\b|bachelor|degree|cgpa|university|college/.test(t), 10, "Include an Education section with degree, college, CGPA and year.");
  add("Experience / internships", /experience|intern|employment|work history/.test(t), 10, "Add internships, part-time work or freelance experience.");
  add("Projects", /project/.test(t), 10, "List 2–3 projects with the tech stack and your impact.");
  add("Skills section", /skills|technologies|tech stack|tools/.test(t), 10, "Add a clear Skills section — ATS systems scan for it.");
  add("Summary / objective", /summary|objective|profile|about me/.test(t), 5, "Start with a 2-line professional summary tailored to the role.");

  const verbs = new Set(ACTION_VERBS.filter((v) => t.includes(v)));
  add("Action verbs", verbs.size >= 5, 10, "Start bullet points with verbs like built, optimized, led, automated.", Math.min(1, verbs.size / 5));
  const numbers = (text.match(/\d+(\.\d+)?\s?(%|x|k\b|\+|users|lpa|ms)/gi) ?? []).length;
  add("Quantified achievements", numbers >= 3, 10, "Add numbers: “reduced load time by 40%”, “served 5k users”.", Math.min(1, numbers / 3));
  const lenOk = words.length >= 250 && words.length <= 900;
  add("Length (250–900 words)", lenOk, 10, words.length < 250 ? "Too short — add detail about projects and impact." : "Too long — keep it to one page for freshers.", lenOk ? 1 : 0.4);
  const found = SKILLS.filter((s) => t.includes(s.toLowerCase().replace(/ \/ .*/, "")));
  add("Keyword coverage", found.length >= 6, 10, "Mirror the skills from the job description (aim for 6+ relevant keywords).", Math.min(1, found.length / 6));

  const score = Math.min(100, checks.reduce((s, c) => s + c.points, 0));
  return { score, checks, foundSkills: found, wordCount: words.length };
}
