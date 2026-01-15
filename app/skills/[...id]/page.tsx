import { CodeBlockCommand } from "@/components/code-block-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillFilesExplorer } from "@/components/skill-files-explorer";
import { client } from "@/lib/api/orpc";
import { getAuthorSlug } from "@/lib/author-utils";
import { GitFork, Github, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type SkillDetailPageProps = {
  params: Promise<{ id: string | string[] }>;
};

async function fetchSkillMarkdown(skillId: string) {
  const preview = (await client.skills.markdown({ id: skillId })) as {
    path: string;
    content: string;
  } | null;
  if (!preview?.content) {
    return null;
  }
  const { frontmatter, content } = parseFrontmatter(preview.content);
  return {
    path: preview.path,
    content,
    title: extractMarkdownTitle(content),
    frontmatter,
  };
}

type SkillFrontmatter = {
  name?: string;
  description?: string;
  license?: string;
};

function parseFrontmatter(value: string): {
  frontmatter: SkillFrontmatter;
  content: string;
} {
  const frontmatterPattern = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = value.match(frontmatterPattern);

  if (!match) {
    return { frontmatter: {}, content: value };
  }

  const yamlContent = match[1];
  const content = value.replace(frontmatterPattern, "");
  const frontmatter: SkillFrontmatter = {};

  for (const line of yamlContent.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const val = line.slice(colonIndex + 1).trim();

    if (key === "name") frontmatter.name = val;
    else if (key === "description") frontmatter.description = val;
  }

  return { frontmatter, content };
}

function extractMarkdownTitle(value: string) {
  const match = value.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export async function generateMetadata({
  params,
}: SkillDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const rawId = Array.isArray(id) ? id.join("/") : id;
  const decodedId = decodeURIComponent(rawId);
  const normalizedId = decodedId.replace(/^\/?skills\//, "");
  const [skill, markdownPreview] = await Promise.all([
    client.skills.find({ id: normalizedId }),
    fetchSkillMarkdown(normalizedId),
  ]);
  const displayTitle =
    markdownPreview?.title ?? skill?.name ?? normalizedId.replace(/[-_]/g, " ");
  const title = displayTitle
    ? `${displayTitle} Skill | Agent Skills`
    : "Agent Skills";
  const description =
    skill?.description ??
    "Discover production-ready AI skills shared by the community.";

  return {
    title,
    description,
    alternates: {
      canonical: `/skills/${normalizedId}`,
    },
    openGraph: {
      title,
      description,
      url: `/skills/${normalizedId}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SkillDetailPage({
  params,
}: SkillDetailPageProps) {
  const { id } = await params;
  const rawId = Array.isArray(id) ? id.join("/") : id;
  const decodedId = decodeURIComponent(rawId);
  // decodedId is /skills/anthropics/skills/algorithmic-art
  // but the id in db is anthropics/skills/algorithmic-art
  const normalizedId = decodedId.replace(/^\/?skills\//, "");
  const skill = await client.skills.find({ id: normalizedId });

  if (!skill) {
    notFound();
  }

  const markdownPreview = await fetchSkillMarkdown(normalizedId);
  const displayTitle =
    markdownPreview?.title ?? skill.name ?? normalizedId.replace(/[-_]/g, " ");

  const repoLabel =
    skill.repoOwner && skill.repoName
      ? `${skill.repoOwner}/${skill.repoName}`
      : skill.repoId;
  const repoStars = skill.repoStars ?? 0;
  const repoForks = skill.repoForks ?? 0;
  const showRepoStats = repoStars > 0;
  const authorSlug = getAuthorSlug({
    name: skill.authorName,
    url: skill.authorUrl,
    avatarUrl: skill.authorAvatarUrl,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto container flex-1 px-4 py-8 sm:px-6 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 sm:p-10 shadow-xl shadow-primary/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_100%_at_0%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Agent Skills: {displayTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
                {skill.description}
              </p>

              {skill.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-6">
                  {skill.tags.map((tag) => (
                    <Link
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-primary sm:px-3 sm:py-1 sm:text-xs"
                      href={`/tags/${encodeURIComponent(tag)}`}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
                {skill.category ? (
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-3 sm:py-1 sm:text-xs sm:tracking-widest">
                    {skill.category}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-3 sm:py-1 sm:text-xs sm:tracking-widest">
                  ID: {skill.id}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs sm:tracking-[0.25em]">
                      Author
                    </p>
                    {skill.authorName ? (
                      <>
                        <div className="mt-3 flex items-center gap-3 text-foreground">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-background/60 text-xs font-semibold text-foreground">
                            {skill.authorAvatarUrl ? (
                              <img
                                alt={skill.authorName}
                                className="h-full w-full object-cover"
                                src={skill.authorAvatarUrl}
                              />
                            ) : (
                              skill.authorName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {authorSlug ? (
                            <Link
                              className="text-lg font-semibold transition-colors hover:text-primary"
                              href={`/authors/${authorSlug}`}
                            >
                              {skill.authorName}
                            </Link>
                          ) : (
                            <span className="text-lg font-semibold">
                              {skill.authorName}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {skill.authorUrl ? (
                            <a
                              className="inline-flex max-w-[240px] items-center truncate rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-primary"
                              href={skill.authorUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {skill.authorUrl}
                            </a>
                          ) : null}
                          {authorSlug ? (
                            <Link
                              className="inline-flex items-center rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-primary"
                              href={`/authors/${authorSlug}`}
                            >
                              View all skills
                            </Link>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                        No author information provided.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs sm:tracking-[0.25em]">
                      Repository
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-foreground">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f2328] bg-[#24292f] shadow-sm shadow-black/30">
                        <Github className="h-4 w-4 text-white" />
                      </div>

                      {skill.repoUrl ? (
                        <a
                          className="text-lg font-semibold transition-colors hover:text-primary"
                          href={skill.repoUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {repoLabel}
                        </a>
                      ) : (
                        <span className="text-lg font-semibold">
                          {repoLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {skill.repoOwnerName ? (
                        <span className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
                          {skill.repoOwnerName}
                        </span>
                      ) : null}
                      {skill.repoLicense ? (
                        <span className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                          License: {skill.repoLicense}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {showRepoStats ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2.5 py-1">
                        <Star className="h-3.5 w-3.5" />
                        {repoStars.toLocaleString()}
                      </span>
                      {repoForks > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2.5 py-1">
                          <GitFork className="h-3.5 w-3.5" />
                          {repoForks.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="py-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            Install this agent skill to your local
          </h3>
          <CodeBlockCommand
            __bun__={`bunx add-skill https://github.com/${skill.id}`}
            __npm__={`npx add-skill https://github.com/${skill.id}`}
            __pnpm__={`pnpm dlx add-skill https://github.com/${skill.id}`}
            __yarn__={`yarn dlx add-skill https://github.com/${skill.id}`}
          />
        </section>

        <SkillFilesExplorer
          skillId={skill.id}
          skillName={skill.name}
          initialPreview={
            markdownPreview
              ? {
                  kind: "text",
                  path: markdownPreview.path,
                  size: markdownPreview.content.length,
                  content: markdownPreview.content,
                }
              : null
          }
          initialSelectedPath={markdownPreview?.path ?? null}
          initialFrontmatter={markdownPreview?.frontmatter ?? null}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
