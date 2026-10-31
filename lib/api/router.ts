import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import { env } from "@/env";
import { getAuthorDisplayName } from "@/lib/author-utils";
import {
  buildFileTree,
  fetchFileContent,
  fetchRepoTree,
} from "@/lib/github-files";
import { submitRepo } from "@/lib/repos";
import {
  joinSkillsPath,
  parseSkillId,
  resolveSkillPrefixFromTree,
  resolveSkillsPath,
} from "@/lib/skill-path";
import { SKILL_HUB_PAGE_SIZE } from "@/lib/skill-seo";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import { os } from "@orpc/server";
import {
  and,
  desc,
  eq,
  ilike,
  ne,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as z from "zod";

const paginationInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(60).default(DEFAULT_PAGE_SIZE),
});

const authorInput = z.object({
  author: z.string().min(1),
});

const authorPaginationInput = authorInput.merge(paginationInput);

const tagInput = z.object({
  tag: z.string().min(1),
});

const tagPaginationInput = tagInput.merge(paginationInput);

const categoryInput = z.object({
  category: z.string().min(1),
});

const categoryPaginationInput = categoryInput.merge(paginationInput);

const buildAuthorMatch = (normalizedAuthor: string) => {
  // Use indexed authorSlug column for efficient lookups
  return eq(skillsTable.authorSlug, normalizedAuthor);
};

const buildTagMatch = (normalizedTag: string) =>
  sql`array_position(${skillsTable.tags}, ${normalizedTag}) is not null`;

const buildCategoryMatch = (normalizedCategory: string) =>
  eq(skillsTable.category, normalizedCategory);

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
    .orderBy(
      desc(sql`coalesce(${reposTable.stars}, 0)`),
      desc(skillsTable.updatedAt),
      skillsTable.id
    )
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

const listIndexableSkills = os
  .input(z.object({ page: z.number().int().min(1) }))
  .handler(async ({ input }) => {
    return fetchSkillsPage({
      where: eq(skillsTable.indexable, true),
      page: input.page,
      pageSize: SKILL_HUB_PAGE_SIZE,
    });
  });

const primarySkills = alias(skillsTable, "primary_skills");

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
        body: skillsTable.body,
        bodyPath: skillsTable.bodyPath,
        indexable: skillsTable.indexable,
        primaryId: primarySkills.id,
      })
      .from(skillsTable)
      .leftJoin(reposTable, eq(skillsTable.repoId, reposTable.id))
      .leftJoin(
        primarySkills,
        and(
          eq(primarySkills.id, skillsTable.canonicalSkillId),
          eq(primarySkills.indexable, true)
        )
      )
      .where(eq(skillsTable.id, input.id))
      .limit(1);
    return row;
  });

const RELATED_SKILLS_LIMIT = 6;

const relatedSkills = os
  .input(
    z.object({
      id: z.string(),
      repoId: z.string(),
      tags: z.array(z.string()),
    })
  )
  .handler(async ({ input }) => {
    // Hashing with the page id spreads links across the set; the same page
    // always gets the same picks.
    const query = (where: SQL | undefined, limit: number) =>
      db
        .select({
          id: skillsTable.id,
          name: skillsTable.name,
          description: skillsTable.description,
        })
        .from(skillsTable)
        .where(
          and(
            eq(skillsTable.indexable, true),
            ne(skillsTable.id, input.id),
            where
          )
        )
        .orderBy(sql`md5(${skillsTable.id} || ${input.id})`)
        .limit(limit);

    const sameRepo = await query(
      eq(skillsTable.repoId, input.repoId),
      RELATED_SKILLS_LIMIT
    );
    const otherRepos = ne(skillsTable.repoId, input.repoId);
    const sharedTag =
      sameRepo.length < RELATED_SKILLS_LIMIT && input.tags.length > 0
        ? await query(
            and(
              otherRepos,
              sql`${skillsTable.tags} && ${sql.param(input.tags, skillsTable.tags)}`
            ),
            RELATED_SKILLS_LIMIT - sameRepo.length
          )
        : [];
    const related = [...sameRepo, ...sharedTag];

    // Few skills have tags, so fill up to keep every page linking onward.
    const seen = related.map(({ id }) => id);
    const filler =
      related.length < RELATED_SKILLS_LIMIT
        ? await query(
            and(otherRepos, notInArray(skillsTable.id, seen)),
            RELATED_SKILLS_LIMIT - related.length
          )
        : [];
    return [...related, ...filler];
  });

const authorSummary = os.input(authorInput).handler(async ({ input }) => {
  const normalizedAuthor = input.author.trim().toLowerCase();
  const authorMatch = buildAuthorMatch(normalizedAuthor);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillsTable)
    .where(authorMatch);

  const [sample] = await db
    .select({
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
    })
    .from(skillsTable)
    .where(authorMatch)
    .limit(1);

  const totalCount = Number(count ?? 0);
  const displayName =
    getAuthorDisplayName({
      name: sample?.authorName ?? input.author,
      url: sample?.authorUrl ?? undefined,
    }) ?? input.author;

  console.info("[author-summary] count", totalCount);

  return {
    totalCount,
    displayName,
    authorUrl: sample?.authorUrl ?? null,
    authorAvatarUrl: sample?.authorAvatarUrl ?? null,
  };
});

const authorSkills = os
  .input(authorPaginationInput)
  .handler(async ({ input }) => {
    const normalizedAuthor = input.author.trim().toLowerCase();
    const authorMatch = buildAuthorMatch(normalizedAuthor);
    const offset = (input.page - 1) * input.pageSize;

    const items = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
        category: skillsTable.category,
        tags: skillsTable.tags,
        authorName: skillsTable.authorName,
        authorUrl: skillsTable.authorUrl,
        authorAvatarUrl: skillsTable.authorAvatarUrl,
      })
      .from(skillsTable)
      .where(authorMatch)
      .limit(input.pageSize)
      .offset(offset);

    return { items, page: input.page, pageSize: input.pageSize };
  });

const tagSummary = os.input(tagInput).handler(async ({ input }) => {
  const normalizedTag = input.tag.trim();
  const tagMatch = buildTagMatch(normalizedTag);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillsTable)
    .where(tagMatch);

  return {
    totalCount: Number(count ?? 0),
    tag: normalizedTag,
  };
});

const tagSkills = os
  .input(tagPaginationInput)
  .handler(async ({ input }) => {
    const normalizedTag = input.tag.trim();
    const tagMatch = buildTagMatch(normalizedTag);
    const offset = (input.page - 1) * input.pageSize;

    const items = await db
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
      .where(tagMatch)
      .orderBy(desc(skillsTable.updatedAt))
      .limit(input.pageSize)
      .offset(offset);

    return { items, page: input.page, pageSize: input.pageSize };
  });

const categorySummary = os
  .input(categoryInput)
  .handler(async ({ input }) => {
    const normalizedCategory = input.category.trim();
    const categoryMatch = buildCategoryMatch(normalizedCategory);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skillsTable)
      .where(categoryMatch);

    return {
      totalCount: Number(count ?? 0),
      category: normalizedCategory,
    };
  });

const categorySkills = os
  .input(categoryPaginationInput)
  .handler(async ({ input }) => {
    const normalizedCategory = input.category.trim();
    const categoryMatch = buildCategoryMatch(normalizedCategory);
    const offset = (input.page - 1) * input.pageSize;

    const items = await db
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
      .where(categoryMatch)
      .orderBy(desc(skillsTable.updatedAt))
      .limit(input.pageSize)
      .offset(offset);

    return { items, page: input.page, pageSize: input.pageSize };
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
      headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;
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
    const token =
      headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;

    const { owner, repo, skillDir } = params;
    const repoId = `${owner}/${repo}`;
    const [repoRow] = await db
      .select({ skillsPath: reposTable.skillsPath })
      .from(reposTable)
      .where(eq(reposTable.id, repoId))
      .limit(1);
    const basePath = resolveSkillsPath(repoRow?.skillsPath);
    const configuredPrefix = joinSkillsPath(basePath, skillDir);
    try {
      const entries = await fetchRepoTree(owner, repo, token);
      const prefix = resolveSkillPrefixFromTree({
        entries,
        basePath,
        skillDir,
      });
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
        prefix: configuredPrefix,
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
    const configuredPrefix = joinSkillsPath(basePath, skillDir);
    const configuredPrefixWithSlash = configuredPrefix
      ? `${configuredPrefix}/`
      : "";

    const headers = (context as { headers?: Headers })?.headers;
    const token =
      headers?.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;

    let resolvedPrefix = configuredPrefix;
    if (
      configuredPrefixWithSlash &&
      !decodedPath.startsWith(configuredPrefixWithSlash)
    ) {
      const entries = await fetchRepoTree(owner, repo, token);
      resolvedPrefix = resolveSkillPrefixFromTree({
        entries,
        basePath,
        skillDir,
      });
    }
    const resolvedPrefixWithSlash = resolvedPrefix ? `${resolvedPrefix}/` : "";
    if (
      !resolvedPrefixWithSlash ||
      !decodedPath.startsWith(resolvedPrefixWithSlash)
    ) {
      throw new Error("Path must be inside the skill folder.");
    }

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
        ? (name.split(".").pop()?.toLowerCase() ?? "")
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
    listIndexable: listIndexableSkills,
    search: searchSkills,
    find: findSkill,
    related: relatedSkills,
    tree: skillTree,
    file: skillFile,
  },
  authors: {
    summary: authorSummary,
    skills: authorSkills,
  },
  tags: {
    summary: tagSummary,
    skills: tagSkills,
  },
  categories: {
    summary: categorySummary,
    skills: categorySkills,
  },
  repos: {
    submit: submitRepoHandler,
  },
};
