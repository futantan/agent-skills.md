import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

/**
 * Schema for AI-generated skill metadata
 */
const skillMetadataSchema = z.object({
  category: z
    .string()
    .describe(
      "A single category that best describes this skill. Prefer using an existing category if appropriate, or create a new one if none fits."
    ),
  tags: z
    .array(z.string())
    .describe(
      "3-5 relevant tags. Prefer using existing tags when appropriate, but create new ones if needed for accuracy."
    ),
});

export type SkillMetadata = z.infer<typeof skillMetadataSchema>;

export type SkillInput = {
  name: string;
  description: string;
};

export type ExistingTaxonomy = {
  categories: string[];
  tags: string[];
};

/**
 * Generate category and tags for a skill using AI.
 * Takes existing categories and tags as reference for consistency.
 *
 * @param skill - The skill's name and description
 * @param taxonomy - Existing categories and tags from the database
 * @returns Generated category and tags
 */
export async function generateSkillMetadata(
  skill: SkillInput,
  taxonomy: ExistingTaxonomy
): Promise<SkillMetadata> {
  const existingCategoriesStr =
    taxonomy.categories.length > 0
      ? taxonomy.categories.join(", ")
      : "No existing categories";

  const existingTagsStr =
    taxonomy.tags.length > 0
      ? taxonomy.tags.join(", ")
      : "No existing tags";

  const { output } = await generateText({
    model: openai("o4-mini"),
    output: Output.object({ schema: skillMetadataSchema }),
    prompt: `You are a skill categorization expert. Given a skill's name and description, generate an appropriate category and relevant tags.

## Skill Information
- Name: ${skill.name}
- Description: ${skill.description}

## Existing Categories (prefer using these if appropriate)
${existingCategoriesStr}

## Existing Tags (prefer using these if appropriate)
${existingTagsStr}

## Instructions
1. **Category**: Choose ONE category. Prefer an existing category if it fits well. Only create a new category if none of the existing ones are suitable.
2. **Tags**: Choose 3-5 tags. Prefer existing tags when they accurately describe the skill. Create new tags only when existing ones don't capture important aspects.

The goal is to maintain consistency with existing taxonomy while accurately describing this skill.`,
  });

  if (!output) {
    throw new Error("Failed to generate skill metadata: no output returned");
  }

  return output;
}
