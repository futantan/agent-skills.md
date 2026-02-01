import { env } from "@/env";
import { submitRepo } from "@/lib/repos";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repo: string | string[] }> }
) {
  const { repo } = await params;
  const combined = Array.isArray(repo) ? repo.join("/") : repo;
  const repoInput = decodeURIComponent(combined ?? "").trim();

  if (!repoInput) {
    return NextResponse.json(
      {
        error: "Missing repository URL.",
        example:
          "/api/add/https%3A%2F%2Fgithub.com%2Fowner%2Frepo%2Ftree%2Fmain%2Fskills",
      },
      { status: 400 }
    );
  }

  try {
    const result = await submitRepo(repoInput, env.GITHUB_TOKEN);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submit failed.";
    const status = message.includes("Invalid GitHub repository URL")
      ? 400
      : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
