export const SKILL_HUB_PAGE_SIZE = 100;

export function skillPath(id: string) {
  return `/skills/${id.split("/").map(encodeURIComponent).join("/")}`;
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
