export const SKILL_HUB_PAGE_SIZE = 100;

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function skillPath(id: string) {
  return `/skills/${encodePath(id)}`;
}

// The folder holding the stored SKILL.md, or the repo when its path is unknown.
export function skillGithubUrl(repoId: string, bodyPath: string | null) {
  const repoUrl = `https://github.com/${encodePath(repoId)}`;
  const folder = bodyPath?.split("/").slice(0, -1).join("/");
  return folder ? `${repoUrl}/tree/HEAD/${encodePath(folder)}` : repoUrl;
}

// A page gets a canonical or noindex, never both.
export function skillIndexing({
  id,
  indexable,
  primaryId,
}: {
  id: string;
  indexable: boolean;
  primaryId: string | null;
}) {
  if (indexable) {
    return { alternates: { canonical: skillPath(id) } };
  }
  if (primaryId) {
    return { alternates: { canonical: skillPath(primaryId) } };
  }
  return { robots: { index: false, follow: true } };
}

export function buildInstallCommands(repo: string, skillName: string) {
  const name = /\s/.test(skillName) ? `"${skillName}"` : skillName;
  const args = `skills add ${repo} --skill ${name}`;
  return {
    npm: `npx ${args}`,
    pnpm: `pnpm dlx ${args}`,
    yarn: `yarn dlx ${args}`,
    bun: `bunx ${args}`,
  };
}

export function summarize(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const cut = trimmed.slice(0, maxLength);
  const wordEnd = cut.lastIndexOf(" ");
  return `${wordEnd > 0 ? cut.slice(0, wordEnd) : cut}…`;
}

export function isRealCategory(category: string | null | undefined) {
  const value = category?.trim().toLowerCase();
  return Boolean(value) && value !== "uncategorized";
}

export function parseHubPage(value: string | string[] | undefined) {
  if (value === undefined) {
    return 1;
  }
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return Number(value);
}

export function skillHubPath(page: number) {
  return page > 1 ? `/skills?page=${page}` : "/skills";
}
