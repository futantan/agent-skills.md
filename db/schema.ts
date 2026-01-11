import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const reposTable = pgTable(
  "repos",
  {
    id: varchar({ length: 255 }).primaryKey(),
    owner: varchar({ length: 128 }).notNull(),
    name: varchar({ length: 128 }).notNull(),
    url: varchar({ length: 512 }).notNull(),
    license: varchar({ length: 128 }),
    stars: integer().notNull().default(0),
    forks: integer().notNull().default(0),
    ownerName: varchar({ length: 128 }),
    ownerUrl: varchar({ length: 512 }),
    ownerAvatarUrl: varchar({ length: 512 }),
    skillsPath: varchar({ length: 255 }).notNull().default("skills"),
    lastParsedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("repos_owner_name_unique").on(table.owner, table.name),
    index("repos_stars_idx").on(table.stars),
  ]
);

export const skillsTable = pgTable(
  "skills",
  {
    id: varchar({ length: 255 }).primaryKey(),
    repoId: varchar({ length: 255 })
      .notNull()
      .references(() => reposTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 128 }).notNull(),
    description: text().notNull(),
    category: varchar({ length: 64 }),
    tags: text().array().notNull().default(sql`'{}'::text[]`),
    authorName: varchar({ length: 128 }),
    authorUrl: varchar({ length: 512 }),
    authorAvatarUrl: varchar({ length: 512 }),
    // Normalized author slug for indexed lookups (computed on insert/update)
    authorSlug: varchar({ length: 128 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("skills_category_idx").on(table.category),
    index("skills_repo_id_idx").on(table.repoId),
    index("skills_updated_at_idx").on(table.updatedAt),
    index("skills_tags_gin_idx").using("gin", table.tags),
    // Index for author slug lookups - eliminates full table scans
    index("skills_author_slug_idx").on(table.authorSlug),
    // Index for name searches - partial optimization for LIKE 'prefix%'
    index("skills_name_idx").on(table.name),
  ]
);

