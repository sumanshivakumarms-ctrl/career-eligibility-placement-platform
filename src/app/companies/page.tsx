import type { Metadata } from "next";
import { Suspense } from "react";
import CompaniesBrowser from "@/components/CompaniesBrowser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Companies & Drives",
  description: "Search and filter placement drives by role, package, location and eligibility criteria. Compare companies side by side.",
};

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader title="Companies & Drives" subtitle="Search, filter and compare live placement drives. Add up to 3 to compare side by side." />
      <Suspense fallback={<div className="skeleton h-40 w-full" />}>
        <CompaniesBrowser />
      </Suspense>
    </div>
  );
}
