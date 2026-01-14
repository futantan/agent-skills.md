import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { and, isNotNull, ne, sql } from "drizzle-orm";

export type ExistingTaxonomy = {
  categories: string[];
  tags: string[];
};

/**
 * Fetch all unique categories and tags from the database.
 * Executes both queries in parallel for better performance.
 */
export async function fetchExistingTaxonomy(): Promise<ExistingTaxonomy> {
  // Execute both queries in parallel
  const [categoryRows, tagRows] = await Promise.all([
    // Fetch unique categories using Drizzle
    db
      .selectDistinct({ category: skillsTable.category })
      .from(skillsTable)
      .where(
        and(
          isNotNull(skillsTable.category),
          ne(skillsTable.category, ""),
          ne(skillsTable.category, "Uncategorized")
        )
      )
      .limit(10),
    // Fetch unique tags using PostgreSQL's unnest for array columns
    db
      .selectDistinct({
        tag: sql<string>`unnest(${skillsTable.tags})`.as("tag"),
      })
      .from(skillsTable)
      .where(sql`array_length(${skillsTable.tags}, 1) > 0`)
      .limit(10),
  ]);

  const categories = categoryRows
    .map((row) => row.category)
    .filter((c): c is string => c !== null);

  const tags = tagRows.map((row) => row.tag).filter(Boolean);

  return { categories, tags };
}
