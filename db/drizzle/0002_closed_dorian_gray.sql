CREATE INDEX "repos_stars_idx" ON "repos" USING btree ("stars");--> statement-breakpoint
CREATE INDEX "skills_repo_id_idx" ON "skills" USING btree ("repoId");--> statement-breakpoint
CREATE INDEX "skills_updated_at_idx" ON "skills" USING btree ("updatedAt");