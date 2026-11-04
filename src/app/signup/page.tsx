import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
