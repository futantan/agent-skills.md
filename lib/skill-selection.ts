import { createHash } from "node:crypto";

export const MIN_REPO_STARS = 1000;
export const MIN_DESCRIPTION_LENGTH = 40;
export const MAX_PER_REPO = 100;
export const MIN_BODY_WORDS = 200;
export const MAX_INDEXABLE = 5000;

export type SkillRow = {
  id: string;
  repoId: string;
  name: string;
  description: string;
  createdAt: Date;
  stars: number;
  forks: number;
};

export type SkillBody = {
  hash: string;
  words: number;
};

export type Selection = {
  selected: string[];
  dropped: {
    noBody: string[];
    tooShort: string[];
    duplicateBody: string[];
    overCap: string[];
  };
  // Non-primary copy id -> id of its selected primary.
  canonical: Map<string, string>;
};

function compareRank(left: SkillRow, right: SkillRow) {
  return (
    right.stars - left.stars ||
    right.forks - left.forks ||
    left.createdAt.getTime() - right.createdAt.getTime() ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

function groupKey(row: SkillRow) {
  return `${row.name.toLowerCase()}\0${row.description.trim()}`;
}

function characterCount(value: string) {
  return Array.from(value).length;
}

// Ranks every skill once: the first row seen in a group is its primary, and the
// filters and repo cap then apply to primaries only.
export function rankCandidates(rows: SkillRow[]) {
  const primaryByGroup = new Map<string, SkillRow>();
  const primaryOf = new Map<string, string>();
  const repoCounts = new Map<string, number>();
  const candidates: SkillRow[] = [];

  for (const row of [...rows].sort(compareRank)) {
    const key = groupKey(row);
    const primary = primaryByGroup.get(key);
    if (primary) {
      primaryOf.set(row.id, primary.id);
      continue;
    }
    primaryByGroup.set(key, row);

    if (
      row.stars < MIN_REPO_STARS ||
      characterCount(row.description.trim()) < MIN_DESCRIPTION_LENGTH
    ) {
      continue;
    }

    const repoKey = row.repoId.toLowerCase();
    const repoCount = repoCounts.get(repoKey) ?? 0;
    if (repoCount >= MAX_PER_REPO) {
      continue;
    }
    repoCounts.set(repoKey, repoCount + 1);
    candidates.push(row);
  }

  return { candidates, primaryOf };
}

// `candidates` must be in ranked order, as rankCandidates returns them.
export function selectIndexable(
  candidates: SkillRow[],
  primaryOf: Map<string, string>,
  bodies: Map<string, SkillBody>
): Selection {
  const dropped: Selection["dropped"] = {
    noBody: [],
    tooShort: [],
    duplicateBody: [],
    overCap: [],
  };
  const selected: string[] = [];
  const seenHashes = new Set<string>();

  for (const { id } of candidates) {
    const body = bodies.get(id);
    if (!body) {
      dropped.noBody.push(id);
    } else if (body.words < MIN_BODY_WORDS) {
      dropped.tooShort.push(id);
    } else if (seenHashes.has(body.hash)) {
      dropped.duplicateBody.push(id);
    } else if (selected.length >= MAX_INDEXABLE) {
      dropped.overCap.push(id);
    } else {
      seenHashes.add(body.hash);
      selected.push(id);
    }
  }

  const selectedIds = new Set(selected);
  const canonical = new Map(
    [...primaryOf].filter(([, primaryId]) => selectedIds.has(primaryId))
  );

  return { selected, dropped, canonical };
}

export function stripFrontmatter(contents: string) {
  const lines = contents.split("\n");
  if (lines[0]?.trim() !== "---") {
    return contents.trim();
  }
  const end = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );
  if (end === -1) {
    return contents.trim();
  }
  return lines
    .slice(end + 1)
    .join("\n")
    .trim();
}

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function hashBody(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
