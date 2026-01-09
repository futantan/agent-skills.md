import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import { env } from "@/env";
import { buildFileTree, fetchFileContent, fetchRepoTree } from "@/lib/github-files";
import { submitRepo } from "@/lib/repos";
import { joinSkillsPath, parseSkillId, resolveSkillsPath } from "@/lib/skill-path";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import { os } from "@orpc/server";
import { desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import * as z from "zod";

const paginationInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(60).default(DEFAULT_PAGE_SIZE),
});

async function fetchSkillsPage({
  where,
  page,
  pageSize,
}: {
  where?: SQL;
  page: number;
  pageSize: number;
}) {
  const offset = (page - 1) * pageSize;
  const listQuery = db
    .select({
      id: skillsTable.id,
      repoId: skillsTable.repoId,
      name: skillsTable.name,
      description: skillsTable.description,
      category: skillsTable.category,
      tags: skillsTable.tags,
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
      createdAt: skillsTable.createdAt,
      updatedAt: skillsTable.updatedAt,
      repoStars: reposTable.stars,
      repoForks: reposTable.forks,
    })
    .from(skillsTable)
    .leftJoin(reposTable, eq(skillsTable.repoId, reposTable.id))
    .orderBy(desc(skillsTable.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(skillsTable);

  const list = where ? listQuery.where(where) : listQuery;
  const count = where ? countQuery.where(where) : countQuery;

  const [items, countRows] = await Promise.all([list, count]);
  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

const listSkills = os
  .input(paginationInput)
  .handler(async ({ input }) => {
    return fetchSkillsPage({
      page: input.page,
      pageSize: input.pageSize,
    });
  });

const searchSkills = os
  .input(
    z.object({
      query: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(60).default(DEFAULT_PAGE_SIZE),
    })
  )
  .handler(async ({ input }) => {
    const query = input.query?.trim() ?? "";
    if (!query) {
      return fetchSkillsPage({
        page: input.page,
        pageSize: input.pageSize,
      });
    }

    const escaped = query.replace(/[%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    return fetchSkillsPage({
      page: input.page,
      pageSize: input.pageSize,
      where: or(
        ilike(skillsTable.name, pattern),
        ilike(skillsTable.description, pattern),
        ilike(sql<string>`array_to_string(${skillsTable.tags}, ',')`, pattern)
      ),
    });
  });

const findSkill = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const [row] = await db
      .select({
        id: skillsTable.id,
        repoId: skillsTable.repoId,
        name: skillsTable.name,
        description: skillsTable.description,
        category: skillsTable.category,
        tags: skillsTable.tags,
        authorName: skillsTable.authorName,
        authorUrl: skillsTable.authorUrl,
        authorAvatarUrl: skillsTable.authorAvatarUrl,
        createdAt: skillsTable.createdAt,
        updatedAt: skillsTable.updatedAt,
        repoOwner: reposTable.owner,
        repoName: reposTable.name,
        repoUrl: reposTable.url,
        repoLicense: reposTable.license,
        repoStars: reposTable.stars,
        repoForks: reposTable.forks,
        repoOwnerName: reposTable.ownerName,
        repoOwnerUrl: reposTable.ownerUrl,
        repoOwnerAvatarUrl: reposTable.ownerAvatarUrl,
      })
      .from(skillsTable)
      .leftJoin(reposTable, eq(skillsTable.repoId, reposTable.id))
      .where(eq(skillsTable.id, input.id))
      .limit(1);
    return row
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

const skillTree = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const params = parseSkillId(input.id);
    if (!params) {
      throw new Error("Invalid skill id.");
    }

    const headers = (context as { headers?: Headers })?.headers;
    const token = headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;

    const { owner, repo, skillDir } = params;
    const repoId = `${owner}/${repo}`;
    const [repoRow] = await db
      .select({ skillsPath: reposTable.skillsPath })
      .from(reposTable)
      .where(eq(reposTable.id, repoId))
      .limit(1);
    const basePath = resolveSkillsPath(repoRow?.skillsPath);
    const prefix = joinSkillsPath(basePath, skillDir);
    try {
      const entries = await fetchRepoTree(owner, repo, token);
      const root = buildFileTree(entries, prefix);
      if (!root.children?.length) {
        throw new Error("Skill folder not found.");
      }
      return { root };
    } catch (error) {
      console.error("skills.tree failed", {
        id: input.id,
        owner,
        repo,
        prefix,
        error,
      });
      throw error;
    }
  });

const skillFile = os
  .input(z.object({ id: z.string(), path: z.string() }))
  .handler(async ({ input, context }) => {
    const params = parseSkillId(input.id);
    if (!params) {
      throw new Error("Invalid skill id.");
    }

    const decodedPath = decodeURIComponent(input.path);
    const { owner, repo, skillDir } = params;
    const repoId = `${owner}/${repo}`;
    const [repoRow] = await db
      .select({ skillsPath: reposTable.skillsPath })
      .from(reposTable)
      .where(eq(reposTable.id, repoId))
      .limit(1);
    const basePath = resolveSkillsPath(repoRow?.skillsPath);
    const prefixRoot = joinSkillsPath(basePath, skillDir);
    const prefix = prefixRoot ? `${prefixRoot}/` : "";
    if (!decodedPath.startsWith(prefix)) {
      throw new Error("Path must be inside the skill folder.");
    }

    const headers = (context as { headers?: Headers })?.headers;
    const token = headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;

    const MAX_PREVIEW_BYTES = 512 * 1024;
    const TEXT_EXTENSIONS = new Set([
      "md",
      "mdx",
      "txt",
      "json",
      "yaml",
      "yml",
      "toml",
      "js",
      "jsx",
      "ts",
      "tsx",
      "css",
      "html",
      "csv",
      "env",
      "py",
      "go",
      "rs",
      "sh",
      "bash",
      "zsh",
    ]);

    try {
      const response = await fetchFileContent(owner, repo, decodedPath, token);
      if (response.type !== "file") {
        throw new Error("Path is not a file.");
      }

      if (response.size > MAX_PREVIEW_BYTES) {
        return {
          kind: "too_large",
          path: decodedPath,
          size: response.size,
          maxBytes: MAX_PREVIEW_BYTES,
        };
      }

      const name = decodedPath.split("/").pop() ?? decodedPath;
      const extension = name.includes(".")
        ? name.split(".").pop()?.toLowerCase() ?? ""
        : "";
      const isText = !extension || TEXT_EXTENSIONS.has(extension);

      if (!isText || !response.content || response.encoding !== "base64") {
        return {
          kind: "binary",
          path: decodedPath,
          size: response.size,
        };
      }

      const decoded = Buffer.from(response.content, "base64").toString("utf-8");
      return {
        kind: "text",
        path: decodedPath,
        size: response.size,
        content: decoded,
      };
    } catch (error) {
      console.error("skills.file failed", {
        id: input.id,
        owner,
        repo,
        path: decodedPath,
        error,
      });
      throw error;
    }
  });

export const router = {
  skills: {
    list: listSkills,
    search: searchSkills,
    find: findSkill,
    tree: skillTree,
    file: skillFile,
  },
  repos: {
    submit: submitRepoHandler,
  },
};
