import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: { default: "CareerPath – Career Eligibility & Placement Platform", template: "%s | CareerPath" },
  description:
    "Check your eligibility for companies and placement drives, find your skill gaps, get career guidance and apply — all in one place.",
  keywords: ["placement", "eligibility checker", "campus drives", "jobs for freshers", "career guidance"],
  openGraph: {
    title: "CareerPath – Career Eligibility & Placement Platform",
    description: "Find out which companies you're eligible for and how to improve your chances.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

// Restore the saved theme after hydration.
const themeScript = `try{var t=localStorage.getItem('cp_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="theme-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <Providers>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
