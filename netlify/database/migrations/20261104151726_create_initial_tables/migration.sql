CREATE TABLE "applications" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"drive_id" integer NOT NULL,
	"status" text DEFAULT 'Applied' NOT NULL,
	"match_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_drive" UNIQUE("user_id","drive_id")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"industry" text DEFAULT 'Technology' NOT NULL,
	"initials" text NOT NULL,
	"color" text DEFAULT '#4f46e5' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"headquarters" text DEFAULT '' NOT NULL,
	"employees" text DEFAULT '' NOT NULL,
	"rating" double precision DEFAULT 4 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"placed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drives" (
	"id" serial PRIMARY KEY,
	"company_id" integer NOT NULL,
	"role" text NOT NULL,
	"category" text DEFAULT 'Software Engineer' NOT NULL,
	"job_type" text DEFAULT 'Full-time' NOT NULL,
	"package_lpa" double precision DEFAULT 0 NOT NULL,
	"location" text DEFAULT 'Pan India' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"deadline" timestamp NOT NULL,
	"min_cgpa" double precision DEFAULT 0 NOT NULL,
	"max_backlogs" integer DEFAULT 0 NOT NULL,
	"branches" text[] DEFAULT '{}'::text[] NOT NULL,
	"degrees" text[] DEFAULT '{}'::text[] NOT NULL,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"passout_years" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"process" jsonb DEFAULT '[]' NOT NULL,
	"openings" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"drive_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_user_drive" UNIQUE("user_id","drive_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text,
	"role" text DEFAULT 'student' NOT NULL,
	"google_id" text,
	"profile" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_drive_id_drives_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "drives" ADD CONSTRAINT "drives_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_drive_id_drives_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE CASCADE;