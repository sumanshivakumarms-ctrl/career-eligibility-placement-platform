# CareerPath – Career Eligibility & Placement Platform

Check eligibility for companies and placement drives, see skill gaps, get career guidance and apply.
Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · PostgreSQL + Drizzle ORM**.

## Features

| Area | What's included |
| --- | --- |
| Home | Hero + CTA, scroll-animated counters (live from DB), how-it-works, featured-companies carousel, testimonials |
| Eligibility Checker | 4-step form (Personal → Education → Skills → Preferences), progress bar, real-time validation, tooltips, tag selector, autosaved profile |
| Results | Circular score meter, Eligible / Almost / Not-eligible cards, expandable “Why?”, suggestions, skill-gap chart + courses, filters & sorting, **PDF report** |
| Companies & Drives | Live search with autocomplete, filters, bookmark, **side-by-side compare**, detail page with JD, criteria, selection timeline, Apply/Register |
| Career Guidance | Resume tips, **resume upload (drag & drop) with ATS score**, interview prep, aptitude quiz, role roadmaps, floating **chatbot** |
| Dashboard | Profile-strength tracker, badges/milestones, saved jobs, application status tracker, notifications, upcoming deadlines |
| Admin | CRUD for companies & drives (incl. eligibility criteria), applicant list with status updates, **CSV export** |
| Auth | Email/password (JWT in httpOnly cookie), Forgot/Reset password, optional Google OAuth |
| UX | Dark/light mode, sticky navbar + collapsible mobile menu, page transitions, skeletons, empty/error states, toasts, ARIA + keyboard support |

## Eligibility logic (`src/lib/eligibility.ts`)

Weighted score out of 100: **CGPA 30 · Skills 40 · Branch 20 · Other 10** (backlogs 4, passout year 4, degree 2).

* **Eligible** – all hard criteria met and ≥ 60 % of required skills matched
* **Almost eligible** – no unfixable gap (branch/year/degree), CGPA gap ≤ 0.7, ≤ 2 extra backlogs, ≥ 25 % skills, score ≥ 50
* **Not eligible** – otherwise

Every result includes per-criterion checks and actionable suggestions (courses for missing skills, CGPA/backlog guidance).

## Folder structure

```
src/
  app/                 # pages + API routes (App Router)
    api/auth|admin|drives|eligibility|applications|saved|dashboard|profile|resume|chat
    eligibility, results, companies, companies/[id], compare, guidance,
    dashboard, admin, login, signup, forgot-password, reset-password
  components/          # Navbar, Footer, StepForm, TagSelector, DriveCard, Modal/ProgressBar (ui.tsx), ...
  db/                  # Drizzle client + schema
  lib/                 # eligibility engine, auth (JWT), data access + seeding, resume parser, constants
```

## Setup & run

```bash
npm install
# .env must contain DATABASE_URL=postgresql://user:pass@host:5432/dbname
# Local PGlite applies checked-in migrations automatically; PostgreSQL servers need `npx drizzle-kit push` once.
npm run dev                 # http://localhost:3000   (or: npm run build && npm start)
```

Sample data (14 companies, 15 drives with varied criteria) and two demo users are **seeded automatically** on first request:

* Student: `student@careerpath.dev` / `Student@123`
* Admin: `admin@careerpath.dev` / `Admin@123`

### Optional environment variables

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Secret for signing session tokens (**set in production**) |
| `COOKIE_SECURE=true` | Mark the session cookie `Secure` (use behind HTTPS) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable “Continue with Google” (redirect URI: `/api/auth/google/callback`) |
| `SHOW_RESET_LINK=false` | Hide the demo reset link in the forgot-password response (plug in your own mailer) |

## Notes

* Company names and criteria are **sample data** for demonstration.
* Resume ATS scoring reads text from PDF/TXT files (best effort); for DOCX or scanned PDFs paste the text instead.
* The chatbot is rule-based (no API key needed); swap `src/app/api/chat/route.ts` for an LLM call if desired.
* No mail server is bundled: password-reset links are shown on screen in demo mode.
