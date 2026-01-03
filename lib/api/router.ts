import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { submitRepo } from "@/lib/repos";
import { os } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import * as z from "zod";

const SkillAuthorSchema = z
  .object({
    name: z.string(),
    url: z.string().url().optional(),
    avatarUrl: z.string().url().optional(),
  })
  .optional();

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()),
  author: SkillAuthorSchema,
});

const listSkills = os.handler(async () => {
  const rows = await db
    .select()
    .from(skillsTable)
    .orderBy(desc(skillsTable.updatedAt));
  return rows.map(mapSkillRow);
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
    const token =
      headers?.get("x-github-token") ?? process.env.GITHUB_TOKEN ?? undefined;
    return submitRepo(input.url, token);
  });

export const router = {
  skills: {
    list: listSkills,
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
