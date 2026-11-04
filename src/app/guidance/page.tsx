import type { Metadata } from "next";
import GuidanceTabs from "@/components/GuidanceTabs";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Career Guidance",
  description: "Resume tips with an ATS score, interview preparation, aptitude practice and role-based roadmaps. Ask our career assistant anything.",
};

export default function GuidancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader title="Career Guidance" subtitle="Resume, interview and aptitude prep plus step-by-step roadmaps. Need help? Tap the chat bubble in the corner." />
      <GuidanceTabs />
    </div>
  );
}
