import { db } from "@/db";
import { reposTable } from "@/db/schema";
import { env } from "@/env";
import { submitRepo } from "@/lib/repos";
import { asc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RepoSelection = {
  owner: string;
  name: string;
  skillsPath: string;
  lastParsedAt: Date | null;
  createdAt: Date;
};

async function selectRepoForSync(): Promise<RepoSelection | null> {
  const [repo] = await db
    .select({
      owner: reposTable.owner,
      name: reposTable.name,
      skillsPath: reposTable.skillsPath,
      lastParsedAt: reposTable.lastParsedAt,
      createdAt: reposTable.createdAt,
    })
    .from(reposTable)
    .orderBy(
      asc(sql`coalesce(${reposTable.lastParsedAt}, ${reposTable.createdAt})`)
    )
    .limit(1);

  return repo ?? null;
}

function buildRepoInput(repo: RepoSelection) {
  const base = `${repo.owner}/${repo.name}`;
  return repo.skillsPath ? `${base}/${repo.skillsPath}` : base;
}

export async function GET() {
  const repo = await selectRepoForSync();
  if (!repo) {
    return NextResponse.json(
      { ok: false, error: "No repositories available to sync." },
      { status: 404 }
    );
  }

  try {
    const repoInput = buildRepoInput(repo);
    const result = await submitRepo(repoInput, env.GITHUB_TOKEN);
    return NextResponse.json({
      ok: true,
      strategy: "oldest",
      selectedRepo: `${repo.owner}/${repo.name}`,
      lastParsedAt: repo.lastParsedAt,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    const status = message.includes("Invalid GitHub repository URL")
      ? 400
      : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
