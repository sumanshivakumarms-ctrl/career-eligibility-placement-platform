"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./Providers";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="hero-bg flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-7 shadow-xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white"><GraduationCap className="h-6 w-6" /></span>
        <h1 className="mt-4 text-center text-2xl font-bold">{title}</h1>
        <p className="muted mt-1 text-center text-sm">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="muted mt-6 text-center text-sm">{footer}</p>
      </motion.div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, label = "Password", autoComplete }: { id: string; value: string; onChange: (v: string) => void; label?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} required minLength={8} className="input !pr-11" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function GoogleButton() {
  return (
    <a href="/api/auth/google" className="btn-outline w-full">
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H2.4v2.800A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M6 14.1a6.600 6.600 0 0 1 0-4.200V7.100H2.400a11 11 0 0 0 0 9.800L6 14.100z" />
        <path fill="#EA4335" d="M12 5.400c1.600 0 3 .6 4.200 1.600l3.100-3.100A11 11 0 0 0 2.400 7.100L6 9.900c.8-2.600 3.200-4.500 6-4.500z" />
      </svg>
      Continue with Google
    </a>
  );
}

const Divider = () => (
  <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
  </div>
);

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const e = params.get("error");
    if (e === "google_not_configured") setError("Google login isn't configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use email login.");
    else if (e) setError("Google sign-in failed. Please try again.");
  }, [params]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Login failed.");
    await refresh();
    toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
    router.push(data.user.role === "admin" && !params.get("next") ? "/admin" : safeNext(params.get("next")));
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to track applications and saved jobs." footer={<>New here? <Link href="/signup" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">Forgot password?</Link></div>
        <button disabled={busy} className="btn-primary w-full !py-3">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in</button>
      </form>
      <Divider />
      <GoogleButton />
      <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
        <p className="mb-1 font-semibold">Demo accounts</p>
        <p className="muted">Student: student@careerpath.dev / Student@123</p>
        <p className="muted">Admin: admin@careerpath.dev / Admin@123</p>
        <div className="mt-2 flex gap-2">
          <button type="button" className="chip" onClick={() => { setEmail("student@careerpath.dev"); setPassword("Student@123"); }}>Fill student</button>
          <button type="button" className="chip" onClick={() => { setEmail("admin@careerpath.dev"); setPassword("Admin@123"); }}>Fill admin</button>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Sign up failed.");
    await refresh();
    toast.success("Account created! Let's check your eligibility.");
    router.push(params.get("next") ? safeNext(params.get("next")) : "/eligibility");
  };

  return (
    <AuthShell title="Create your account" subtitle="Save your profile, bookmark jobs and apply to drives." footer={<>Already registered? <Link href="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <div aria-live="polite">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200 dark:bg-slate-800"}`} />
            ))}
          </div>
          <p className="muted mt-1 text-xs">Use 8+ characters with a capital letter, number and symbol.</p>
        </div>
        <button disabled={busy} className="btn-primary w-full !py-3">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign up</button>
      </form>
      <Divider />
      <GoogleButton />
    </AuthShell>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ resetUrl?: string } | null>(null);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setDone(data);
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send a reset link." footer={<Link href="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Back to log in</Link>}>
      {done ? (
        <div role="status" className="space-y-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          <p className="font-semibold">If an account exists for {email}, a reset link has been sent.</p>
          {done.resetUrl && (
            <p>
              Demo mode (no mail server configured): <Link href={done.resetUrl} className="font-semibold underline">open your reset link</Link>.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <button disabled={busy} className="btn-primary w-full !py-3">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not reset password.");
    toast.success("Password updated. Please log in.");
    router.push("/login");
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something strong you haven't used before." footer={<Link href="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Back to log in</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!token && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Missing reset token. Use the link from your email.</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <PasswordInput id="password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
        <button disabled={busy || !token} className="btn-primary w-full !py-3">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
      </form>
    </AuthShell>
  );
}
