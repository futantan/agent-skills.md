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
import {
  ExistingTaxonomy,
  generateSkillMetadata,
} from "@/lib/ai/generate-skill-metadata";
import { fetchExistingTaxonomy } from "@/lib/ai/taxonomy";
import { eq, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// ============================================================================
// Types
// ============================================================================

type SkillRow = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  tags: string[];
};

type ResultItem = {
  skill: {
    id: string;
    name: string;
    description: string;
    currentCategory?: string | null;
    currentTags?: string[];
  };
  generated: { category: string; tags: string[] } | null;
  status: "success" | "error";
  error?: string;
};

// ============================================================================
// Constants
// ============================================================================

const CONCURRENCY = 100;

// ============================================================================
// Database Operations
// ============================================================================

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
    .set({ category, tags })
    .where(eq(skillsTable.id, skillId));
}

// ============================================================================
// Processing Functions
// ============================================================================

async function processSkill(
  skill: SkillRow,
  taxonomy: ExistingTaxonomy
): Promise<ResultItem> {
  console.log(`🤖 Processing: ${skill.name}`);
  try {
    const generated = await generateSkillMetadata(
      { name: skill.name, description: skill.description },
      taxonomy
    );

    console.log(
      `   → ${skill.name}: ${generated.category} [${generated.tags.join(", ")}]`
    );

    await updateSkillMetadata(skill.id, generated.category, generated.tags);

    return {
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
    };
  } catch (error) {
    console.error(`   ❌ ${skill.name}: ${error}`);
    return {
      skill: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
      },
      generated: null,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function processSkillsInBatches(
  skills: SkillRow[],
  taxonomy: ExistingTaxonomy
): Promise<{ results: ResultItem[]; successCount: number; errorCount: number }> {
  const results: ResultItem[] = [];
  let successCount = 0;
  let errorCount = 0;

  const totalBatches = Math.ceil(skills.length / CONCURRENCY);

  for (let i = 0; i < skills.length; i += CONCURRENCY) {
    const batch = skills.slice(i, i + CONCURRENCY);
    const batchNumber = Math.floor(i / CONCURRENCY) + 1;

    console.log(
      `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} skills)`
    );

    const batchResults = await Promise.all(
      batch.map((skill) => processSkill(skill, taxonomy))
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.status === "success") {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }

  return { results, successCount, errorCount };
}

// ============================================================================
// Response Builders
// ============================================================================

function buildEmptyResponse(taxonomy: ExistingTaxonomy) {
  return NextResponse.json({
    message: "No skills need backfilling",
    taxonomy: {
      categoriesCount: taxonomy.categories.length,
      tagsCount: taxonomy.tags.length,
    },
    results: [],
    stats: { total: 0, success: 0, error: 0 },
  });
}

function buildSuccessResponse(
  taxonomy: ExistingTaxonomy,
  results: ResultItem[],
  stats: { total: number; success: number; error: number }
) {
  return NextResponse.json({
    message: `Backfill completed. ${stats.success} skills updated, ${stats.error} errors.`,
    taxonomy: {
      categoriesCount: taxonomy.categories.length,
      tagsCount: taxonomy.tags.length,
      sampleCategories: taxonomy.categories.slice(0, 10),
    },
    stats,
    results,
  });
}

function buildErrorResponse(error: unknown) {
  console.error("Backfill error:", error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unknown error" },
    { status: 500 }
  );
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET() {
  try {
    console.log("📚 Fetching existing taxonomy...");
    const taxonomy = await fetchExistingTaxonomy();
    console.log(
      `   Found ${taxonomy.categories.length} categories, ${taxonomy.tags.length} tags`
    );

    console.log("🔍 Finding all skills missing metadata...");
    const skills = await findSkillsMissingMetadata();
    console.log(`   Found ${skills.length} skills to process`);

    if (skills.length === 0) {
      return buildEmptyResponse(taxonomy);
    }

    const { results, successCount, errorCount } = await processSkillsInBatches(
      skills,
      taxonomy
    );

    return buildSuccessResponse(taxonomy, results, {
      total: skills.length,
      success: successCount,
      error: errorCount,
    });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
