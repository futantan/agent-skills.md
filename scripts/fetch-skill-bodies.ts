// Fetches SKILL.md for candidate skills from raw.githubusercontent.com and
// writes the selection. Rerun to resume: rows with bodyFetchedAt are skipped, and
// the selection is only written once every candidate has an outcome.
//
//   pnpm skills:fetch                       fetch everything, then select
//   pnpm skills:fetch --dry-run --limit 50  fetch an even sample, write nothing
//   pnpm skills:fetch --retry-missing       also retry rows that found no body
//
// Repo file lists come from a blobless git clone (anonymous, cached in the OS
// temp dir): skill ids hold the frontmatter name, not the path, and the GitHub
// API is off limits here.

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { reposTable, skillsTable } from "@/db/schema";
import type { RepoTreeEntry } from "@/lib/github-files";
import { resolveSkillFilePath, resolveSkillsPath } from "@/lib/skill-path";
import {
  countWords,
  hashBody,
  rankCandidates,
  selectIndexable,
  stripFrontmatter,
  type SkillBody,
  type SkillRow,
} from "@/lib/skill-selection";
import { parseFrontmatter } from "@/lib/skills-parser";

const FETCH_CONCURRENCY = 5;
const CLONE_CONCURRENCY = 4;
const CLONE_TIMEOUT_MS = 120_000;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const MAX_CONSECUTIVE_429 = 6;
const MAX_BACKOFF_MS = 300_000;
const MAX_TRANSIENT_RATE = 0.2;
const MIN_ATTEMPTS_FOR_RATE = 100;
const TREE_CACHE_DIR = join(tmpdir(), "agent-skills-trees");

const exec = promisify(execFile);
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

type Candidate = SkillRow & { skillsPath: string };
type Tree = RepoTreeEntry[] | "repo-gone" | "clone-failed";
type Outcome =
  | "fetched"
  | "repo-gone"
  | "path-unresolved"
  | "http-404"
  | "name-mismatch"
  | "transient";

class RateLimitedError extends Error {}

const stats = { requests: 0, rateLimited: 0, retried: 0 };
const rateLimit = { consecutive: 0, pausedUntil: 0 };

function parseArgs(argv: string[]) {
  const limitIndex = argv.indexOf("--limit");
  return {
    dryRun: argv.includes("--dry-run"),
    retryMissing: argv.includes("--retry-missing"),
    limit: limitIndex === -1 ? null : Number(argv[limitIndex + 1]),
  };
}

async function forEachConcurrent<T>(
  items: T[],
  limit: number,
  handle: (item: T) => Promise<void>
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await handle(item);
      }
    })
  );
}

function everyNth<T>(items: T[], count: number) {
  const step = Math.max(1, Math.floor(items.length / count));
  return items.filter((_, index) => index % step === 0).slice(0, count);
}

async function cloneTree(repoKey: string): Promise<Tree> {
  const dir = await mkdtemp(join(tmpdir(), "agent-skills-clone-"));
  const git = (args: string[]) =>
    exec("git", ["-c", "credential.helper=", ...args], {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: CLONE_TIMEOUT_MS,
      maxBuffer: 512 * 1024 * 1024,
    });
  try {
    await git([
      "clone",
      "-q",
      "--depth=1",
      "--filter=blob:none",
      "--no-checkout",
      `https://github.com/${repoKey}.git`,
      dir,
    ]);
    const { stdout } = await git(["-C", dir, "ls-tree", "-r", "-z", "HEAD"]);
    return stdout
      .split("\0")
      .filter(Boolean)
      .map((line) => line.match(/^100\d{3} blob (\w+)\t([\s\S]+)$/))
      .filter((match) => match !== null)
      .filter(([, , path]) => path === "SKILL.md" || path.endsWith("/SKILL.md"))
      .map(([, sha, path]) => ({ path, type: "blob" as const, sha }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return /not found|could not read Username/i.test(message)
      ? "repo-gone"
      : "clone-failed";
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function loadTree(repoKey: string): Promise<Tree> {
  const cachePath = join(TREE_CACHE_DIR, `${repoKey.replace("/", "__")}.json`);
  const cached = await readFile(cachePath, "utf8").catch(() => null);
  if (cached) {
    return JSON.parse(cached) as Tree;
  }
  const tree = await cloneTree(repoKey);
  if (tree !== "clone-failed") {
    await writeFile(cachePath, JSON.stringify(tree));
  }
  return tree;
}

async function loadTrees(candidates: Candidate[]) {
  await mkdir(TREE_CACHE_DIR, { recursive: true });
  const repoKeys = [
    ...new Set(candidates.map((row) => row.repoId.toLowerCase())),
  ];
  const trees = new Map<string, Tree>();
  await forEachConcurrent(repoKeys, CLONE_CONCURRENCY, async (repoKey) => {
    trees.set(repoKey, await loadTree(repoKey));
  });
  return trees;
}

async function backOff(response: Response) {
  stats.rateLimited += 1;
  rateLimit.consecutive += 1;
  if (rateLimit.consecutive >= MAX_CONSECUTIVE_429) {
    throw new RateLimitedError("Too many consecutive 429 responses.");
  }
  const retryAfter = Number(response.headers.get("retry-after")) * 1000;
  const exponential = 5000 * 2 ** rateLimit.consecutive;
  const delay = Math.min(retryAfter || exponential, MAX_BACKOFF_MS);
  rateLimit.pausedUntil = Math.max(rateLimit.pausedUntil, Date.now() + delay);
  console.warn(`429 from raw.githubusercontent.com, pausing ${delay}ms`);
}

// Returns the file, null for a definite 404, or undefined when it should be
// retried on a later run.
async function fetchRawFile(repoId: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${repoId}/HEAD/${encodedPath}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; ) {
    const wait = rateLimit.pausedUntil - Date.now();
    if (wait > 0) {
      await sleep(wait);
      continue;
    }

    stats.requests += 1;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "agent-skills" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (response.status === 429) {
        await backOff(response);
        continue;
      }
      rateLimit.consecutive = 0;
      if (response.ok) {
        return (await response.text()).replaceAll("\0", "");
      }
      if (response.status === 404) {
        return null;
      }
    } catch (error) {
      if (error instanceof RateLimitedError) {
        throw error;
      }
    }

    stats.retried += 1;
    await sleep(1000 * 2 ** attempt);
    attempt += 1;
  }
  return undefined;
}

async function fetchCandidate(
  row: Candidate,
  tree: Tree,
  { dryRun }: { dryRun: boolean }
): Promise<{ outcome: Outcome; path?: string; contents?: string }> {
  const markFetched = async (values: {
    body?: string;
    bodyPath?: string;
    bodyHash?: string;
  }) => {
    if (dryRun) {
      return;
    }
    await db
      .update(skillsTable)
      .set({ ...values, bodyFetchedAt: new Date() })
      .where(eq(skillsTable.id, row.id));
  };

  if (tree === "clone-failed") {
    return { outcome: "transient" };
  }
  if (tree === "repo-gone") {
    await markFetched({});
    return { outcome: "repo-gone" };
  }

  const path = resolveSkillFilePath({
    entries: tree,
    basePath: resolveSkillsPath(row.skillsPath),
    skillName: row.name,
  });
  if (!path) {
    await markFetched({});
    return { outcome: "path-unresolved" };
  }

  const contents = await fetchRawFile(row.repoId, path);
  if (contents === undefined) {
    return { outcome: "transient", path };
  }
  if (contents === null) {
    await markFetched({});
    return { outcome: "http-404", path };
  }

  const fileName = parseFrontmatter(contents).name;
  if (fileName?.toLowerCase() !== row.name.toLowerCase()) {
    await markFetched({});
    return { outcome: "name-mismatch", path };
  }

  await markFetched({
    body: contents,
    bodyPath: path,
    bodyHash: hashBody(stripFrontmatter(contents)),
  });
  return { outcome: "fetched", path, contents };
}

async function writeSelection(
  selected: string[],
  canonical: Map<string, string>
) {
  const selectedJson = JSON.stringify(selected);
  const canonicalJson = JSON.stringify(Object.fromEntries(canonical));

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      update skills set "indexable" = false
      where "indexable"
        and id not in (select jsonb_array_elements_text(${selectedJson}::jsonb))
    `);
    await tx.execute(sql`
      update skills set "indexable" = true
      where not "indexable"
        and id in (select jsonb_array_elements_text(${selectedJson}::jsonb))
    `);
    await tx.execute(sql`
      update skills set "canonicalSkillId" = null
      where "canonicalSkillId" is not null
        and id not in (select key from jsonb_each_text(${canonicalJson}::jsonb))
    `);
    await tx.execute(sql`
      update skills s set "canonicalSkillId" = copy.value
      from jsonb_each_text(${canonicalJson}::jsonb) copy
      where s.id = copy.key
        and s."canonicalSkillId" is distinct from copy.value
    `);
  });
}

async function loadBodies() {
  const rows = await db
    .select({ id: skillsTable.id, body: skillsTable.body })
    .from(skillsTable)
    .where(isNotNull(skillsTable.bodyHash));

  return new Map<string, SkillBody>(
    rows.map(({ id, body }) => {
      const text = stripFrontmatter(body ?? "");
      return [id, { hash: hashBody(text), words: countWords(text) }];
    })
  );
}

async function main() {
  const { dryRun, retryMissing, limit } = parseArgs(process.argv.slice(2));

  const rows = await db
    .select({
      id: skillsTable.id,
      repoId: skillsTable.repoId,
      name: skillsTable.name,
      description: skillsTable.description,
      createdAt: skillsTable.createdAt,
      stars: reposTable.stars,
      forks: reposTable.forks,
      skillsPath: reposTable.skillsPath,
      bodyHash: skillsTable.bodyHash,
      bodyFetchedAt: skillsTable.bodyFetchedAt,
    })
    .from(skillsTable)
    .innerJoin(reposTable, eq(reposTable.id, skillsTable.repoId));

  const { candidates, primaryOf } = rankCandidates(rows);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const pending = candidates
    .map((candidate) => byId.get(candidate.id)!)
    .filter(
      (row) => !row.bodyFetchedAt || (retryMissing && row.bodyHash === null)
    );
  const batch = limit ? everyNth(pending, limit) : pending;

  console.log({
    skills: rows.length,
    candidates: candidates.length,
    pending: pending.length,
    batch: batch.length,
    dryRun,
  });

  const trees = await loadTrees(batch);
  const treeStates = [...trees.values()];
  console.log({
    repos: trees.size,
    repoGone: treeStates.filter((tree) => tree === "repo-gone").length,
    cloneFailed: treeStates.filter((tree) => tree === "clone-failed").length,
  });

  const outcomes = new Map<Outcome, string[]>();
  const samples: Array<Record<string, unknown>> = [];
  let aborted: string | null = null;
  let done = 0;

  await forEachConcurrent(batch, FETCH_CONCURRENCY, async (row) => {
    if (aborted) {
      return;
    }
    try {
      const result = await fetchCandidate(
        row,
        trees.get(row.repoId.toLowerCase())!,
        { dryRun }
      );
      outcomes.set(result.outcome, [
        ...(outcomes.get(result.outcome) ?? []),
        row.id,
      ]);
      if (dryRun) {
        const text = stripFrontmatter(result.contents ?? "");
        samples.push({
          id: row.id,
          outcome: result.outcome,
          path: result.path,
          words: countWords(text),
        });
      }
    } catch (error) {
      if (error instanceof RateLimitedError) {
        aborted = error.message;
        return;
      }
      throw error;
    }

    done += 1;
    if (done % 250 === 0) {
      console.log({ done, ...stats });
    }
    const transient = outcomes.get("transient")?.length ?? 0;
    if (
      done >= MIN_ATTEMPTS_FOR_RATE &&
      transient / done > MAX_TRANSIENT_RATE
    ) {
      aborted = `Transient failure rate too high: ${transient}/${done}.`;
    }
  });

  if (dryRun) {
    console.table(samples);
  }
  console.log({
    done,
    ...stats,
    outcomes: Object.fromEntries(
      [...outcomes].map(([outcome, ids]) => [outcome, ids.length])
    ),
  });
  for (const outcome of [
    "path-unresolved",
    "http-404",
    "name-mismatch",
  ] as const) {
    console.log(outcome, (outcomes.get(outcome) ?? []).slice(0, 15));
  }

  if (aborted) {
    console.error(`Stopped: ${aborted} Rerun to resume.`);
    process.exitCode = 1;
    return;
  }

  if (dryRun || limit) {
    return;
  }

  const unresolved = outcomes.get("transient")?.length ?? 0;
  if (unresolved > 0) {
    console.error(
      `${unresolved} candidates left to retry; selection not written.`
    );
    process.exitCode = 1;
    return;
  }

  const { selected, dropped, canonical } = selectIndexable(
    candidates,
    primaryOf,
    await loadBodies()
  );
  await writeSelection(selected, canonical);
  console.log({
    selected: selected.length,
    dropped: Object.fromEntries(
      Object.entries(dropped).map(([reason, ids]) => [reason, ids.length])
    ),
    canonical: canonical.size,
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown failure");
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
