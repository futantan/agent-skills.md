/**
 * Backfill Metadata API Endpoint
 *
 * GET /api/backfill-metadata
 *
 * Finds all skills with missing category/tags, generates metadata using AI,
 * and updates the database.
 */

import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { generateSkillMetadata } from "@/lib/ai/generate-skill-metadata";
import { fetchExistingTaxonomy } from "@/lib/ai/taxonomy";
import { eq, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

type SkillRow = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  tags: string[];
};

async function findSkillsMissingMetadata(): Promise<SkillRow[]> {
  return db
    .select({
      id: skillsTable.id,
      name: skillsTable.name,
      description: skillsTable.description,
      category: skillsTable.category,
      tags: skillsTable.tags,
    })
    .from(skillsTable)
    .where(
      or(
        isNull(skillsTable.category),
        eq(skillsTable.category, ""),
        eq(skillsTable.category, "Uncategorized"),
        sql`array_length(${skillsTable.tags}, 1) IS NULL`,
        sql`array_length(${skillsTable.tags}, 1) = 0`
      )
    );
}

async function updateSkillMetadata(
  skillId: string,
  category: string,
  tags: string[]
): Promise<void> {
  await db
    .update(skillsTable)
    .set({
      category,
      tags,
    })
    .where(eq(skillsTable.id, skillId));
}

export async function GET() {
  try {
    console.log("📚 Fetching existing taxonomy...");
    const taxonomy = await fetchExistingTaxonomy();
    console.log(
      `   Found ${taxonomy.categories.length} categories, ${taxonomy.tags.length} tags`
    );

    console.log("🔍 Finding all skills missing metadata...");
    const skills = (await findSkillsMissingMetadata()).slice(0, 10);
    console.log(`   Found ${skills.length} skills to process`);

    if (skills.length === 0) {
      return NextResponse.json({
        message: "No skills need backfilling",
        taxonomy: {
          categoriesCount: taxonomy.categories.length,
          tagsCount: taxonomy.tags.length,
        },
        results: [],
        stats: {
          total: 0,
          success: 0,
          error: 0,
        },
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const skill of skills) {
      console.log(`\n🤖 Processing: ${skill.name}`);
      try {
        const generated = await generateSkillMetadata(
          { name: skill.name, description: skill.description },
          taxonomy
        );

        console.log(`   → Category: ${generated.category}`);
        console.log(`   → Tags: [${generated.tags.join(", ")}]`);

        // Update database
        await updateSkillMetadata(skill.id, generated.category, generated.tags);
        console.log(`   ✅ Database updated`);

        successCount++;
        results.push({
          skill: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            currentCategory: skill.category,
            currentTags: skill.tags,
          },
          generated: {
            category: generated.category,
            tags: generated.tags,
          },
          status: "success",
        });
      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
        errorCount++;
        results.push({
          skill: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
          },
          generated: null,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Backfill completed. ${successCount} skills updated, ${errorCount} errors.`,
      taxonomy: {
        categoriesCount: taxonomy.categories.length,
        tagsCount: taxonomy.tags.length,
        sampleCategories: taxonomy.categories.slice(0, 10),
      },
      stats: {
        total: skills.length,
        success: successCount,
        error: errorCount,
      },
      results,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
