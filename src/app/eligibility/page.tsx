import type { Metadata } from "next";
import EligibilityForm from "@/components/EligibilityForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Eligibility Checker",
  description: "Answer a few questions and instantly see which companies and placement drives you are eligible for.",
};

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Eligibility Checker" subtitle="Four quick steps. We'll score you against every active drive." />
      <EligibilityForm />
    </div>
  );
}
