import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { env } from "@/env";
import { submitRepo } from "@/lib/repos";
import { os } from "@orpc/server";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import * as z from "zod";

const listSkills = os.handler(async () => {
  return db
    .select()
    .from(skillsTable)
    .orderBy(desc(skillsTable.updatedAt))
    .then(v => v.map(mapSkillRow));
});

const searchSkills = os
  .input(
    z.object({
      query: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const query = input.query?.trim() ?? "";
    if (!query) {
      return db
        .select()
        .from(skillsTable)
        .orderBy(desc(skillsTable.updatedAt))
        .then(v => v.map(mapSkillRow));
    }

    const escaped = query.replace(/[%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    return db
      .select()
      .from(skillsTable)
      .where(
        or(
          ilike(skillsTable.name, pattern),
          ilike(skillsTable.description, pattern),
          ilike(sql<string>`array_to_string(${skillsTable.tags}, ',')`, pattern)
        )
      )
      .orderBy(desc(skillsTable.updatedAt))
      .then(v => v.map(mapSkillRow))
  });

const findSkill = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const [row] = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.id, input.id))
      .limit(1);
    return row ? mapSkillRow(row) : null;
  });

const submitRepoHandler = os
  .input(
    z.object({
      url: z.string().min(1),
    })
  )
  .handler(async ({ input, context }) => {
    const headers = (context as { headers?: Headers })?.headers;
    const token = headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;
    return submitRepo(input.url, token);
  });

export const router = {
  skills: {
    list: listSkills,
    search: searchSkills,
    find: findSkill,
  },
  repos: {
    submit: submitRepoHandler,
  },
};

function mapSkillRow(row: typeof skillsTable.$inferSelect) {
  const author = row.authorName
    ? {
      name: row.authorName,
      url: row.authorUrl ?? undefined,
      avatarUrl: row.authorAvatarUrl ?? undefined,
    }
    : undefined;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category ?? "Uncategorized",
    tags: row.tags ?? [],
    author,
  };
}
