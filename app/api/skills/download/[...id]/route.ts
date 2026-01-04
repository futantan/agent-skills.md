import { env } from "@/env";
import { fetchBlobContent, fetchRepoTree } from "@/lib/github-files";
import { parseSkillId } from "@/lib/skill-path";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { PassThrough, Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string | string[] }> }
) {
  const { id } = await params;
  const combined = Array.isArray(id) ? id.join("/") : id;
  const skillParams = parseSkillId(combined);
  if (!skillParams) {
    return NextResponse.json({ error: "Invalid skill id." }, { status: 400 });
  }

  const { owner, repo, skillDir } = skillParams;
  const prefix = `skills/${skillDir}/`;

  try {
    const entries = await fetchRepoTree(owner, repo, env.GITHUB_TOKEN);
    const files = entries.filter(
      (entry) => entry.type === "blob" && entry.path.startsWith(prefix)
    );

    if (!files.length) {
      return NextResponse.json(
        { error: "Skill folder not found." },
        { status: 404 }
      );
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();

    archive.on("error", (error) => {
      console.error("skills.download archive error", {
        owner,
        repo,
        prefix,
        error,
      });
      stream.destroy(error);
    });

    archive.pipe(stream);

    for (const file of files) {
      try {
        const blob = await fetchBlobContent(
          owner,
          repo,
          file.sha,
          env.GITHUB_TOKEN
        );
        const contents = Buffer.from(blob.content, "base64");
        const relativePath = file.path.slice(prefix.length);
        archive.append(contents, { name: relativePath });
      } catch (error) {
        console.error("skills.download file error", {
          owner,
          repo,
          path: file.path,
          error,
        });
        throw error;
      }
    }

    archive.finalize();

    const filename = `${skillDir.split("/").pop() ?? skillDir}.zip`;
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("skills.download failed", {
      owner,
      repo,
      prefix,
      error,
    });
    const message =
      error instanceof Error ? error.message : "Failed to build download.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
