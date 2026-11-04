"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, LogOut, Menu, Moon, Sun, X, LayoutDashboard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useTheme } from "./Providers";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/companies", label: "Companies & Drives" },
  { href: "/guidance", label: "Career Guidance" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      active(href)
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const onLogout = async () => {
    await logout();
    setOpen(false);
    toast.success("You've been logged out.");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          CareerPath
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)} aria-current={active(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Link href="/dashboard" className={linkCls("/dashboard")}>
              Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className={linkCls("/admin")}>
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="btn-ghost !p-2.5">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            {!loading &&
              (user ? (
                <>
                  <span className="muted max-w-[8rem] truncate text-sm">Hi, {user.name.split(" ")[0]}</span>
                  <button onClick={onLogout} className="btn-outline !py-2">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">Log in</Link>
                  <Link href="/signup" className="btn-primary !py-2">Sign up</Link>
                </>
              ))}
          </div>
          <button
            className="btn-ghost !p-2.5 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-1 p-4">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkCls(l.href)} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
              {user && (
                <Link href="/dashboard" className={linkCls("/dashboard")} onClick={() => setOpen(false)}>
                  <LayoutDashboard className="mr-2 inline h-4 w-4" /> Dashboard
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/admin" className={linkCls("/admin")} onClick={() => setOpen(false)}>
                  <ShieldCheck className="mr-2 inline h-4 w-4" /> Admin Panel
                </Link>
              )}
              <div className="mt-2 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                {user ? (
                  <button onClick={onLogout} className="btn-outline w-full">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <>
                    <Link href="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>Log in</Link>
                    <Link href="/signup" className="btn-primary flex-1" onClick={() => setOpen(false)}>Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
