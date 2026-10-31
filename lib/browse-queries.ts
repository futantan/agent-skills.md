import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import { getAuthorDisplayName } from "@/lib/author-utils";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const BROWSE_REVALIDATE_SECONDS = 300;
const SITEMAP_REVALIDATE_SECONDS = 3600;

const buildTagMatch = (normalizedTag: string) =>
  sql`array_position(${skillsTable.tags}, ${normalizedTag}) is not null`;

const buildCategoryMatch = (normalizedCategory: string) =>
  eq(skillsTable.category, normalizedCategory);

export const AUTHORS_PAGE_SIZE = 100;

const fetchAuthorsPageUncached = async (page: number) => {
  const rows = await db
    .select({
      slug: sql<string>`${skillsTable.authorSlug}`,
      name: sql<string | null>`mode() within group (order by ${skillsTable.authorName})`,
      avatarUrl: sql<string | null>`max(${skillsTable.authorAvatarUrl})`,
      skillCount: sql<number>`count(*)::int`,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(skillsTable)
    .where(isNotNull(skillsTable.authorSlug))
    .groupBy(skillsTable.authorSlug)
    .orderBy(desc(sql`count(*)`), skillsTable.authorSlug)
    .limit(AUTHORS_PAGE_SIZE)
    .offset((page - 1) * AUTHORS_PAGE_SIZE);

  return {
    authors: rows.map(({ slug, name, avatarUrl, skillCount }) => ({
      slug,
      // Some frontmatter authors are bare URLs.
      name: name?.trim() && !name.startsWith("http") ? name.trim() : slug,
      avatarUrl,
      skillCount,
    })),
    total: rows[0]?.total ?? 0,
  };
};

const fetchAuthorsPageCached = unstable_cache(
  fetchAuthorsPageUncached,
  ["browse:authors-page"],
  { revalidate: BROWSE_REVALIDATE_SECONDS }
);

export async function fetchAuthorsPage(page: number) {
  return fetchAuthorsPageCached(page);
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

// bodyFetchedAt moves when the stored body does; updatedAt moves on every repo
// sync. Strings, because unstable_cache serializes to JSON.
export const fetchSitemapSkills = unstable_cache(
  async () => {
    const rows = await db
      .select({ id: skillsTable.id, bodyFetchedAt: skillsTable.bodyFetchedAt })
      .from(skillsTable)
      .where(eq(skillsTable.indexable, true));
    return rows.map(({ id, bodyFetchedAt }) => ({
      id,
      lastModified: (bodyFetchedAt ?? new Date(0)).toISOString(),
    }));
  },
  ["sitemap-skills"],
  { revalidate: SITEMAP_REVALIDATE_SECONDS }
);
