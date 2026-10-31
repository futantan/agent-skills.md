ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "body" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "bodyPath" varchar(512);--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "bodyHash" varchar(64);--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "bodyFetchedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "indexable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "canonicalSkillId" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_indexable_idx" ON "skills" USING btree ("indexable") WHERE "indexable";