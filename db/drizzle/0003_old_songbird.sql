ALTER TABLE "skills" ADD COLUMN "authorSlug" varchar(128);--> statement-breakpoint
CREATE INDEX "skills_author_slug_idx" ON "skills" USING btree ("authorSlug");--> statement-breakpoint
CREATE INDEX "skills_name_idx" ON "skills" USING btree ("name");