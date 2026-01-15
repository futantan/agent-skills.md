import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { getAuthorSlug } from "@/lib/author-utils";
import type { MetadataRoute } from "next";

export const revalidate = 0;

const BASE_URL = "https://agent-skills.md";

const encodePathSegments = (value: string) =>
  value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await db
    .select({
      id: skillsTable.id,
      updatedAt: skillsTable.updatedAt,
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
      tags: skillsTable.tags,
    })
    .from(skillsTable);

  const authorMap = new Map<string, Date>();
  const tagMap = new Map<string, Date>();
  for (const row of rows) {
    const slug = getAuthorSlug({
      name: row.authorName,
      url: row.authorUrl,
      avatarUrl: row.authorAvatarUrl,
    });
    if (!slug) {
      continue;
    }
    const current = authorMap.get(slug.toLowerCase());
    const updatedAt = row.updatedAt ?? new Date();
    if (!current || updatedAt > current) {
      authorMap.set(slug.toLowerCase(), updatedAt);
    }

    for (const rawTag of row.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) {
        continue;
      }
      const key = tag.toLowerCase();
      const existing = tagMap.get(key);
      if (!existing || updatedAt > existing) {
        tagMap.set(key, updatedAt);
      }
    }
  }

  const skillEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${BASE_URL}/skills/${encodePathSegments(row.id)}`,
    lastModified: row.updatedAt ?? new Date(),
  }));

  const authorEntries: MetadataRoute.Sitemap = Array.from(
    authorMap.entries()
  ).map(([slug, updatedAt]) => ({
    url: `${BASE_URL}/authors/${encodeURIComponent(slug)}`,
    lastModified: updatedAt,
  }));

  const tagEntries: MetadataRoute.Sitemap = Array.from(tagMap.entries()).map(
    ([tag, updatedAt]) => ({
      url: `${BASE_URL}/tags/${encodeURIComponent(tag)}`,
      lastModified: updatedAt,
    })
  );

  return [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/authors`, lastModified: new Date() },
    { url: `${BASE_URL}/tags`, lastModified: new Date() },
    { url: `${BASE_URL}/submit`, lastModified: new Date() },
    ...authorEntries,
    ...tagEntries,
    ...skillEntries,
  ];
}
