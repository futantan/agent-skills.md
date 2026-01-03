import { fetchSkillsFromRepo } from "@/lib/skills-parser";
import { env } from "@/env";
import { NextResponse } from "next/server";

// TODO: change to post request
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoInput = searchParams.get("repo") ?? searchParams.get("url");
  const token =
    request.headers.get("x-github-token") ?? env.GITHUB_TOKEN ?? undefined;

  if (!repoInput) {
    return NextResponse.json(
      { error: "Missing repo or url query param" },
      { status: 400 }
    );
  }

  try {
    const skills = await fetchSkillsFromRepo(repoInput, { token });
    return NextResponse.json({ skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
