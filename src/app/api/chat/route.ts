import { json } from "@/lib/auth";
import { getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Lightweight rule-based career assistant (no external API key needed).
 * Matches keywords to curated guidance; swap in an LLM call here if desired.
 */
const RULES: { keys: RegExp; answer: string }[] = [
  { keys: /\b(hi|hello|hey)\b/, answer: "Hi! 👋 I can help with eligibility, resumes, interviews, aptitude prep, skills and roadmaps. What would you like to know?" },
  { keys: /resume|cv|ats/, answer: "Resume tips: keep it to one page, lead with a 2-line summary, use action verbs + numbers (“cut API latency by 35%”), list 2–3 projects with tech stack, and mirror keywords from the job description. Try the ATS checker on the Career Guidance page for a score." },
  { keys: /interview|hr round|technical round/, answer: "Prepare in three layers: (1) CS fundamentals – DSA, DBMS, OS, networking; (2) your projects – be ready to explain every decision; (3) HR – ‘Tell me about yourself’, strengths/weaknesses, and STAR-format stories. Do 2 mock interviews before the real one." },
  { keys: /aptitude|quant|reasoning/, answer: "Spend 30 min daily: quant (percentages, time & work, profit/loss), logical reasoning and verbal ability. Practise timed sets — speed matters more than perfection. Our Aptitude Practice tab has a quick quiz to start." },
  { keys: /backlog|arrear/, answer: "Many mass recruiters allow 0–2 backlogs, while product companies usually allow none. Clear them at the earliest, and target drives with a higher backlog allowance (Accenture, Cognizant, Zoho) in the meantime." },
  { keys: /cgpa|percentage|marks|cutoff|cut-off/, answer: "Cut-offs range from none (Zoho) to 8.0+ at product companies. If your CGPA is low, compensate with projects, internships, competitive coding and certifications — and use the Eligibility Checker to find drives you already qualify for." },
  { keys: /salary|package|ctc|lpa/, answer: "Fresher packages range from ~4 LPA (mass recruiters) to 30–45 LPA (top product companies). Skills in DSA, system design and cloud move you up the band fastest." },
  { keys: /roadmap|how to become|become a|path/, answer: "Check the Roadmaps tab for Software Engineer, Data Analyst, Data Scientist, Cloud/DevOps and Business Analyst paths — each has 4–5 milestones with timelines." },
  { keys: /skill|learn|course|upskill/, answer: "Run the Eligibility Checker — the results page shows your top skill gaps across all drives with a recommended course for each. Focus on the skills that unlock the most drives first." },
  { keys: /intern/, answer: "Internships are the best differentiator for freshers. Apply on campus portals, LinkedIn and company career pages from 6th semester; even a 2-month internship with measurable output strengthens your resume." },
  { keys: /switch|career change|non[- ]?it|mechanical|civil/, answer: "Career switch plan: pick a target role, learn the 4–5 core skills (see Roadmaps), build 2 portfolio projects, then apply to drives open to ‘any branch’ (TCS, Infosys, Wipro, Zoho, Accenture)." },
  { keys: /placement|drive|company|hiring|deadline/, answer: "" },
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const msg = String(body.message ?? "").toLowerCase().slice(0, 500);
  if (!msg.trim()) return json({ reply: "Ask me anything about careers, placements or interview prep!" });

  const rule = RULES.find((r) => r.keys.test(msg));
  if (rule && rule.answer) return json({ reply: rule.answer });
  if (rule && /placement|drive|company|hiring|deadline/.test(msg)) {
    const st = await getStats();
    return json({
      reply: `There are ${st.activeDrives} active drives from ${st.companies} companies right now. Browse them on the Companies page, or run the Eligibility Checker to see which ones you qualify for.`,
    });
  }
  return json({
    reply:
      "I'm not sure about that one yet. I can help with resumes, interviews, aptitude, backlogs/CGPA rules, skills, internships and roadmaps — try asking about one of those!",
  });
}
