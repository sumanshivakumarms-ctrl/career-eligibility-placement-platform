/**
 * Database schema (Drizzle ORM / PostgreSQL).
 * Apply with: npx drizzle-kit push
 */
import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("student"), // student | admin
  googleId: text("google_id"),
  // Eligibility profile (see Profile type in lib/types.ts) + resume score etc.
  profile: jsonb("profile").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default("Technology"),
  initials: text("initials").notNull(),
  color: text("color").notNull().default("#4f46e5"),
  description: text("description").notNull().default(""),
  website: text("website").notNull().default(""),
  headquarters: text("headquarters").notNull().default(""),
  employees: text("employees").notNull().default(""),
  rating: doublePrecision("rating").notNull().default(4),
  featured: boolean("featured").notNull().default(false),
  placedCount: integer("placed_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drives = pgTable("drives", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  category: text("category").notNull().default("Software Engineer"),
  jobType: text("job_type").notNull().default("Full-time"),
  packageLpa: doublePrecision("package_lpa").notNull().default(0),
  location: text("location").notNull().default("Pan India"),
  description: text("description").notNull().default(""),
  deadline: timestamp("deadline").notNull(),
  // ---- Eligibility criteria ----
  minCgpa: doublePrecision("min_cgpa").notNull().default(0),
  maxBacklogs: integer("max_backlogs").notNull().default(0),
  branches: text("branches").array().notNull().default([]),
  degrees: text("degrees").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  passoutYears: integer("passout_years").array().notNull().default([]),
  process: jsonb("process")
    .$type<{ title: string; description: string }[]>()
    .notNull()
    .default([]),
  openings: integer("openings").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    driveId: integer("drive_id")
      .notNull()
      .references(() => drives.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("saved_user_drive").on(t.userId, t.driveId)],
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    driveId: integer("drive_id")
      .notNull()
      .references(() => drives.id, { onDelete: "cascade" }),
    // Applied | Shortlisted | Interview | Selected | Rejected
    status: text("status").notNull().default("Applied"),
    matchScore: integer("match_score"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("app_user_drive").on(t.userId, t.driveId)],
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
});
