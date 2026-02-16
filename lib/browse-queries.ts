import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import { getAuthorDisplayName, getAuthorSlug } from "@/lib/author-utils";
import { desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const BROWSE_REVALIDATE_SECONDS = 300;

const buildTagMatch = (normalizedTag: string) =>
  sql`array_position(${skillsTable.tags}, ${normalizedTag}) is not null`;

const buildCategoryMatch = (normalizedCategory: string) =>
  eq(skillsTable.category, normalizedCategory);

export type AuthorListItem = {
  slug: string;
  name: string;
  url?: string | null;
  avatarUrl?: string | null;
  skillCount: number;
};

const fetchAuthorsIndexUncached = async (): Promise<AuthorListItem[]> => {
  const rows = await db
    .select({
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
    })
    .from(skillsTable);

  const authorsMap = new Map<string, AuthorListItem>();

  for (const row of rows) {
    const slug = getAuthorSlug({
      name: row.authorName,
      url: row.authorUrl,
      avatarUrl: row.authorAvatarUrl,
    });
    const displayName = getAuthorDisplayName({
      name: row.authorName,
      url: row.authorUrl,
    });

    if (!slug || !displayName) {
      continue;
    }

    const key = slug.toLowerCase();
    const existing = authorsMap.get(key);

    if (!existing) {
      authorsMap.set(key, {
        slug,
        name: displayName,
        url: row.authorUrl ?? null,
        avatarUrl: row.authorAvatarUrl ?? null,
        skillCount: 1,
      });
      continue;
    }

    existing.skillCount += 1;
    if (!existing.url && row.authorUrl) {
      existing.url = row.authorUrl;
    }
    if (!existing.avatarUrl && row.authorAvatarUrl) {
      existing.avatarUrl = row.authorAvatarUrl;
    }
  }

  return Array.from(authorsMap.values()).sort((a, b) => {
    if (b.skillCount !== a.skillCount) {
      return b.skillCount - a.skillCount;
    }
    return a.name.localeCompare(b.name);
  });
};

const fetchAuthorsIndexCached = unstable_cache(
  fetchAuthorsIndexUncached,
  ["browse:authors-index"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchAuthorsIndex() {
  return fetchAuthorsIndexCached();
}

const fetchTagsIndexUncached = async () => {
  const rows = await db.select({ tags: skillsTable.tags }).from(skillsTable);
  const tagMap = new Map<string, { name: string; count: number }>();

  for (const row of rows) {
    for (const rawTag of row.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) {
        continue;
      }
      const key = tag.toLowerCase();
      const existing = tagMap.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      tagMap.set(key, { name: tag, count: 1 });
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
};

const fetchTagsIndexCached = unstable_cache(fetchTagsIndexUncached, ["browse:tags-index"], {
  revalidate: BROWSE_REVALIDATE_SECONDS,
});

export async function fetchTagsIndex() {
  return fetchTagsIndexCached();
}

const fetchCategoriesIndexUncached = async () => {
  const rows = await db
    .select({ category: skillsTable.category })
    .from(skillsTable);
  const categoryMap = new Map<string, { name: string; count: number }>();

  for (const row of rows) {
    const category = row.category?.trim();
    if (!category) {
      continue;
    }
    const key = category.toLowerCase();
    const existing = categoryMap.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    categoryMap.set(key, { name: category, count: 1 });
  }

  return Array.from(categoryMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
};

const fetchCategoriesIndexCached = unstable_cache(
  fetchCategoriesIndexUncached,
  ["browse:categories-index"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchCategoriesIndex() {
  return fetchCategoriesIndexCached();
}

const fetchAuthorSummaryUncached = async (author: string) => {
  const normalizedAuthor = author.trim().toLowerCase();
  const authorMatch = eq(skillsTable.authorSlug, normalizedAuthor);

  const [countRows, sampleRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(skillsTable)
      .where(authorMatch),
    db
      .select({
        authorName: skillsTable.authorName,
        authorUrl: skillsTable.authorUrl,
        authorAvatarUrl: skillsTable.authorAvatarUrl,
      })
      .from(skillsTable)
      .where(authorMatch)
      .limit(1),
  ]);

  const totalCount = Number(countRows[0]?.count ?? 0);
  const sample = sampleRows[0];
  const displayName =
    getAuthorDisplayName({
      name: sample?.authorName ?? author,
      url: sample?.authorUrl ?? undefined,
    }) ?? author;

  return {
    totalCount,
    displayName,
    authorUrl: sample?.authorUrl ?? null,
    authorAvatarUrl: sample?.authorAvatarUrl ?? null,
  };
};

const fetchAuthorSummaryCached = unstable_cache(
  fetchAuthorSummaryUncached,
  ["browse:author-summary"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchAuthorSummary(author: string) {
  return fetchAuthorSummaryCached(author);
}

const fetchAuthorSkillsPageUncached = async ({
  author,
  page,
  pageSize,
}: {
  author: string;
  page: number;
  pageSize: number;
}) => {
  const normalizedAuthor = author.trim().toLowerCase();
  const authorMatch = eq(skillsTable.authorSlug, normalizedAuthor);
  const offset = (page - 1) * pageSize;

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
    .limit(pageSize)
    .offset(offset);

  return { items, page, pageSize };
};

const fetchAuthorSkillsPageCached = unstable_cache(
  fetchAuthorSkillsPageUncached,
  ["browse:author-skills-page"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchAuthorSkillsPage(input: {
  author: string;
  page: number;
  pageSize: number;
}) {
  return fetchAuthorSkillsPageCached(input);
}

const fetchTagSummaryUncached = async (tag: string) => {
  const normalizedTag = tag.trim();
  const tagMatch = buildTagMatch(normalizedTag);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillsTable)
    .where(tagMatch);

  return {
    totalCount: Number(countRow?.count ?? 0),
    tag: normalizedTag,
  };
};

const fetchTagSummaryCached = unstable_cache(fetchTagSummaryUncached, ["browse:tag-summary"], {
  revalidate: BROWSE_REVALIDATE_SECONDS,
});

export async function fetchTagSummary(tag: string) {
  return fetchTagSummaryCached(tag);
}

const fetchTagSkillsPageUncached = async ({
  tag,
  page,
  pageSize,
}: {
  tag: string;
  page: number;
  pageSize: number;
}) => {
  const normalizedTag = tag.trim();
  const tagMatch = buildTagMatch(normalizedTag);
  const offset = (page - 1) * pageSize;

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
    .limit(pageSize)
    .offset(offset);

  return { items, page, pageSize };
};

const fetchTagSkillsPageCached = unstable_cache(
  fetchTagSkillsPageUncached,
  ["browse:tag-skills-page"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchTagSkillsPage(input: {
  tag: string;
  page: number;
  pageSize: number;
}) {
  return fetchTagSkillsPageCached(input);
}

const fetchCategorySummaryUncached = async (category: string) => {
  const normalizedCategory = category.trim();
  const categoryMatch = buildCategoryMatch(normalizedCategory);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillsTable)
    .where(categoryMatch);

  return {
    totalCount: Number(countRow?.count ?? 0),
    category: normalizedCategory,
  };
};

const fetchCategorySummaryCached = unstable_cache(
  fetchCategorySummaryUncached,
  ["browse:category-summary"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchCategorySummary(category: string) {
  return fetchCategorySummaryCached(category);
}

const fetchCategorySkillsPageUncached = async ({
  category,
  page,
  pageSize,
}: {
  category: string;
  page: number;
  pageSize: number;
}) => {
  const normalizedCategory = category.trim();
  const categoryMatch = buildCategoryMatch(normalizedCategory);
  const offset = (page - 1) * pageSize;

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
    .limit(pageSize)
    .offset(offset);

  return { items, page, pageSize };
};

const fetchCategorySkillsPageCached = unstable_cache(
  fetchCategorySkillsPageUncached,
  ["browse:category-skills-page"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchCategorySkillsPage(input: {
  category: string;
  page: number;
  pageSize: number;
}) {
  return fetchCategorySkillsPageCached(input);
}
