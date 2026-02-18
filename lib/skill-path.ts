import type { RepoTreeEntry } from "@/lib/github-files";

export function parseSkillId(rawId: string) {
  const decoded = decodeURIComponent(rawId);
  const normalized = decoded.replace(/^\/?skills\//, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }
  const owner = parts[0];
  const repo = parts[1];
  const skillDir = parts.slice(2).join("/");
  return { owner, repo, skillDir };
}

export function resolveSkillsPath(input?: string | null) {
  if (input === undefined || input === null) {
    return "skills";
  }
  const trimmed = input.trim();
  if (trimmed === "") {
    return "";
  }
  if (trimmed === "/" || trimmed === ".") {
    return "";
  }
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function joinSkillsPath(basePath: string, skillDir: string) {
  if (!basePath) {
    return skillDir;
  }
  if (!skillDir) {
    return basePath;
  }
  return `${basePath}/${skillDir}`;
}

export function resolveSkillPrefixFromTree({
  entries,
  basePath,
  skillDir,
}: {
  entries: RepoTreeEntry[];
  basePath: string;
  skillDir: string;
}) {
  const preferredPrefix = joinSkillsPath(basePath, skillDir);
  if (hasSkillDirectory(entries, preferredPrefix)) {
    return preferredPrefix;
  }

  const candidates = findSkillDirectoryCandidates(entries, skillDir);
  if (!candidates.length) {
    return preferredPrefix;
  }

  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, { basePath, skillDir }),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.length - right.candidate.length ||
        left.candidate.localeCompare(right.candidate)
    );

  return ranked[0].candidate;
}

function hasSkillDirectory(entries: RepoTreeEntry[], prefix: string) {
  const normalizedPrefix = normalizePath(prefix);
  if (!normalizedPrefix) {
    return false;
  }

  const skillFilePath = `${normalizedPrefix}/SKILL.md`;
  if (entries.some((entry) => entry.type === "blob" && entry.path === skillFilePath)) {
    return true;
  }

  const dirPrefix = `${normalizedPrefix}/`;
  return entries.some((entry) => entry.path.startsWith(dirPrefix));
}

function findSkillDirectoryCandidates(entries: RepoTreeEntry[], skillDir: string) {
  const normalizedSkillDir = normalizePath(skillDir);
  if (!normalizedSkillDir) {
    return [];
  }

  const exact = `${normalizedSkillDir}/SKILL.md`;
  const suffix = `/${normalizedSkillDir}/SKILL.md`;
  const candidates = new Set<string>();

  for (const entry of entries) {
    if (entry.type !== "blob") {
      continue;
    }

    if (entry.path === exact || entry.path.endsWith(suffix)) {
      candidates.add(entry.path.slice(0, -"SKILL.md".length - 1));
    }
  }

  return Array.from(candidates);
}

function scoreCandidate(
  candidate: string,
  { basePath, skillDir }: { basePath: string; skillDir: string }
) {
  const normalizedCandidate = normalizePath(candidate);
  const normalizedBasePath = normalizePath(basePath);
  const normalizedSkillDir = normalizePath(skillDir);
  let score = 0;

  if (normalizedCandidate === normalizedSkillDir) {
    score += 100;
  } else if (normalizedCandidate.endsWith(`/${normalizedSkillDir}`)) {
    score += 70;
  }

  if (normalizedBasePath) {
    if (normalizedCandidate === normalizedBasePath) {
      score += 25;
    } else if (normalizedCandidate.startsWith(`${normalizedBasePath}/`)) {
      score += 20;
    }
  }

  if (
    normalizedCandidate.includes("/skills/") ||
    normalizedCandidate.endsWith("/skills")
  ) {
    score += 10;
  }

  score -= normalizedCandidate.split("/").length;
  return score;
}

function normalizePath(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}
