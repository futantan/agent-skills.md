CREATE TABLE "repos" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"owner" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"url" varchar(512) NOT NULL,
	"license" varchar(128),
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"ownerName" varchar(128),
	"ownerUrl" varchar(512),
	"ownerAvatarUrl" varchar(512),
	"lastParsedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"repoId" varchar(255) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64),
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"authorName" varchar(128),
	"authorUrl" varchar(512),
	"authorAvatarUrl" varchar(512),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_repoId_repos_id_fk" FOREIGN KEY ("repoId") REFERENCES "public"."repos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "repos_owner_name_unique" ON "repos" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "skills_tags_gin_idx" ON "skills" USING gin ("tags");