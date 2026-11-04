import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            CareerPath
          </div>
          <p className="muted mt-3 max-w-sm text-sm">
            Check your eligibility, close your skill gaps and apply to placement drives with confidence.
          </p>
          <p className="muted mt-3 text-xs">Company names and criteria shown are sample data for demonstration.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Explore</h3>
          <ul className="muted space-y-2 text-sm">
            <li><Link href="/eligibility" className="hover:text-indigo-600">Eligibility Checker</Link></li>
            <li><Link href="/companies" className="hover:text-indigo-600">Companies &amp; Drives</Link></li>
            <li><Link href="/guidance" className="hover:text-indigo-600">Career Guidance</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Account</h3>
          <ul className="muted space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-indigo-600">Log in</Link></li>
            <li><Link href="/signup" className="hover:text-indigo-600">Sign up</Link></li>
            <li><Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} CareerPath. Built with Next.js, PostgreSQL &amp; Tailwind.
      </div>
    </footer>
  );
}
