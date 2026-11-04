"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, ChevronLeft, ChevronRight, ClipboardList, GraduationCap, Quote, Rocket, Send, Sparkles, Star, Target, Users } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import CircularScore from "./CircularScore";
import { CompanyLogo } from "./ui";
import type { CompanyDTO } from "@/lib/types";
import { LANDING_TESTIMONIALS } from "@/lib/constants";

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

const STEPS = [
  { icon: ClipboardList, title: "Fill your profile", text: "Tell us about your education, skills and preferences in a quick 4-step form." },
  { icon: Target, title: "Get your match score", text: "We compare you with every company's criteria using weighted scoring." },
  { icon: Sparkles, title: "Close the gaps", text: "See exactly what's missing and the best courses to fix it." },
  { icon: Send, title: "Apply with confidence", text: "Save jobs, register for drives and track every application." },
];

export default function Landing({
  stats,
  companies,
}: {
  stats: { companies: number; placed: number; activeDrives: number };
  companies: CompanyDTO[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  // Gentle auto-advance (paused on hover/focus, disabled for reduced-motion users)
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = scroller.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: 280, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero-bg">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1 }}>
            <motion.span variants={fade} className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Rocket className="h-3.5 w-3.5" /> Placement season is live
            </motion.span>
            <motion.h1 variants={fade} className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Know exactly which jobs you&apos;re{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">eligible for</span>
            </motion.h1>
            <motion.p variants={fade} className="muted mt-5 max-w-xl text-lg">
              Enter your academics and skills once. Get an instant match score for every company, see what&apos;s missing, and learn how to get there.
            </motion.p>
            <motion.div variants={fade} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/eligibility" className="btn-primary !px-6 !py-3.5 text-base">
                Check My Eligibility <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/companies" className="btn-outline !px-6 !py-3.5 text-base">
                Browse Drives
              </Link>
            </motion.div>
            <motion.p variants={fade} className="muted mt-4 text-sm">Free · No sign-up needed to check</motion.p>
          </motion.div>

          {/* Decorative preview card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="relative mx-auto w-full max-w-md">
            <div className="card relative p-6 shadow-xl">
              <div className="flex items-center gap-5">
                <CircularScore value={82} size={120} stroke={10} label="match" />
                <div>
                  <p className="text-sm font-semibold">Overall readiness</p>
                  <p className="muted text-sm">You&apos;re eligible for 6 drives</p>
                  <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">✅ Eligible</span>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { n: "Amazon · SDE I", s: "88%", c: "bg-emerald-500" },
                  { n: "Razorpay · Frontend", s: "74%", c: "bg-amber-500" },
                  { n: "Goldman · Analyst", s: "41%", c: "bg-red-500" },
                ].map((r, i) => (
                  <motion.div key={r.n} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.c}`} />
                    <span className="flex-1 text-sm font-medium">{r.n}</span>
                    <span className="text-sm font-bold">{r.s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-label="Platform statistics">
        <div className="card -mt-2 grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          {[
            { icon: Building2, label: "Partner companies", value: stats.companies, suffix: "+" },
            { icon: Users, label: "Students placed", value: stats.placed, suffix: "+" },
            { icon: Briefcase, label: "Active drives", value: stats.activeDrives, suffix: "" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-3xl font-extrabold"><AnimatedCounter value={s.value} suffix={s.suffix} /></p>
                <p className="muted text-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-title">How it works</h2>
          <p className="muted mt-3">From profile to application in four simple steps.</p>
        </div>
        <motion.ol initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ staggerChildren: 0.12 }} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li key={s.title} variants={fade} className="card card-hover relative p-6">
              <span className="absolute right-5 top-4 text-5xl font-black text-slate-100 dark:text-slate-800" aria-hidden="true">{i + 1}</span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-4 font-semibold">{s.title}</h3>
              <p className="muted relative mt-1 text-sm">{s.text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      {/* ---------- Featured companies carousel ---------- */}
      <section className="bg-white py-16 dark:bg-slate-900/50" aria-label="Featured companies">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Featured companies</h2>
              <p className="muted mt-2">Top recruiters hiring this season.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollBy(-1)} aria-label="Previous companies" className="btn-outline !p-2.5"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => scrollBy(1)} aria-label="Next companies" className="btn-outline !p-2.5"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
          <div
            ref={scroller}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            tabIndex={0}
            role="region"
            aria-label="Company carousel"
          >
            {companies.map((c) => (
              <Link key={c.id} href={`/companies?q=${encodeURIComponent(c.name)}`} className="card card-hover w-64 shrink-0 snap-start p-5">
                <CompanyLogo initials={c.initials} color={c.color} name={c.name} size="lg" />
                <h3 className="mt-4 font-semibold">{c.name}</h3>
                <p className="muted text-sm">{c.industry}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-medium"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>
                  <span className="muted">{c.placedCount.toLocaleString("en-IN")} placed</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-title">Loved by students &amp; placement teams</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((t, i) => (
            <motion.figure key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card flex flex-col p-6">
              <Quote className="h-7 w-7 text-indigo-500" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{t.name[0]}</span>
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="muted block text-xs">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-600 px-6 py-14 text-center text-white sm:px-12">
          <GraduationCap className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 text-3xl font-bold">Ready to see where you stand?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-50">It takes about two minutes. No sign-up required.</p>
          <Link href="/eligibility" className="btn mt-7 !bg-white !px-6 !py-3 !text-indigo-700 hover:!bg-indigo-50">
            Check My Eligibility <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
