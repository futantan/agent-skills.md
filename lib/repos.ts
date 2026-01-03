import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import { fetchSkillsFromRepo, parseGitHubRepo } from "@/lib/skills-parser";
import { eq } from "drizzle-orm";

type GitHubRepoInfo = {
  html_url?: string;
  stargazers_count?: number;
  forks_count?: number;
  license?: { spdx_id?: string; name?: string } | null;
  owner?: { login?: string; html_url?: string; avatar_url?: string } | null;
};

export async function submitRepo(repoInput: string, token?: string) {
  const parsed = parseGitHubRepo(repoInput);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL.");
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const repoId = `${parsed.owner}/${parsed.repo}`;
  const fallbackUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;

  let repoInfo: GitHubRepoInfo | null = null;
  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers }
    );
    if (response.ok) {
      repoInfo = (await response.json()) as GitHubRepoInfo;
    }
  } catch {
    repoInfo = null;
  }

  const skills = await fetchSkillsFromRepo(repoInput, { token });

  await db.transaction(async (tx) => {
    const repoValues = {
      id: repoId,
      owner: parsed.owner,
      name: parsed.repo,
      url: repoInfo?.html_url ?? fallbackUrl,
      license: repoInfo?.license?.spdx_id ?? repoInfo?.license?.name ?? null,
      stars: repoInfo?.stargazers_count ?? 0,
      forks: repoInfo?.forks_count ?? 0,
      ownerName: repoInfo?.owner?.login ?? parsed.owner,
      ownerUrl: repoInfo?.owner?.html_url ?? `https://github.com/${parsed.owner}`,
      ownerAvatarUrl: repoInfo?.owner?.avatar_url ?? null,
      lastParsedAt: new Date(),
      updatedAt: new Date(),
    };
    const repoUpdate = {
      url: repoValues.url,
      license: repoValues.license,
      stars: repoValues.stars,
      forks: repoValues.forks,
      ownerName: repoValues.ownerName,
      ownerUrl: repoValues.ownerUrl,
      ownerAvatarUrl: repoValues.ownerAvatarUrl,
      lastParsedAt: repoValues.lastParsedAt,
      updatedAt: repoValues.updatedAt,
    };

    await tx
      .insert(reposTable)
      .values(repoValues)
      .onConflictDoUpdate({
        target: [reposTable.owner, reposTable.name],
        set: repoUpdate,
      });

    await tx.delete(skillsTable).where(eq(skillsTable.repoId, repoId));

    if (skills.length) {
      await tx.insert(skillsTable).values(
        skills.map((skill) => ({
          id: skill.id,
          repoId,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          tags: skill.tags,
          authorName: skill.author?.name,
          authorUrl: skill.author?.url,
          authorAvatarUrl: skill.author?.avatarUrl,
          updatedAt: new Date(),
        }))
      );
    }
  });

  return {
    repoId,
    skillsAdded: skills.length,
  };
}
