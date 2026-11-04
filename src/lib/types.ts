/** Shared (client + server safe) types. */

export type ProcessStep = { title: string; description: string };

export type CompanyDTO = {
  id: number;
  name: string;
  industry: string;
  initials: string;
  color: string;
  description: string;
  website: string;
  headquarters: string;
  employees: string;
  rating: number;
  featured: boolean;
  placedCount: number;
};

export type DriveDTO = {
  id: number;
  companyId: number;
  role: string;
  category: string;
  jobType: string;
  packageLpa: number;
  location: string;
  description: string;
  deadline: string; // ISO string
  minCgpa: number;
  maxBacklogs: number;
  branches: string[];
  degrees: string[];
  skills: string[];
  passoutYears: number[];
  process: ProcessStep[];
  openings: number;
  company: CompanyDTO;
};

/** Student profile collected by the eligibility checker. */
export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  degree: string;
  branch: string;
  scoreType: "cgpa" | "percentage";
  score: number;
  backlogs: number;
  gradYear: number;
  skills: string[];
  certifications: string[];
  internships: number;
  preferredRole: string;
  preferredLocations: string[];
  expectedSalary: number; // LPA
  resumeScore?: number;
};

export type EligibilityStatus = "eligible" | "almost" | "not";

export type CheckItem = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type EvalResult = {
  score: number; // 0-100 weighted match percentage
  status: EligibilityStatus;
  breakdown: { cgpa: number; skills: number; branch: number; other: number };
  matchedSkills: string[];
  missingSkills: string[];
  checks: CheckItem[];
  suggestions: string[];
  roleMatch: boolean;
  locationMatch: boolean;
  salaryMatch: boolean;
};

export type DriveResult = { drive: DriveDTO; evaluation: EvalResult };

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin";
};

export const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
] as const;
