import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { getAuthorDisplayName, isAuthorMatch } from "@/lib/author-utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AuthorPageProps = {
  params: Promise<{ author: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { author } = await params;
  const decodedAuthor = decodeURIComponent(author);
  const rows = await db
    .select({
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
    })
    .from(skillsTable);
  const skills = rows.filter((row) =>
    isAuthorMatch(
      {
        name: row.authorName,
        url: row.authorUrl,
        avatarUrl: row.authorAvatarUrl,
      },
      decodedAuthor
    )
  );
  const displayName =
    getAuthorDisplayName({
      name: skills[0]?.authorName ?? decodedAuthor,
      url: skills[0]?.authorUrl ?? undefined,
    }) ?? decodedAuthor;
  const description = skills.length
    ? `Explore ${skills.length} Agent Skills shared by ${displayName}.`
    : "Discover production-ready AI skills shared by the community.";

  return {
    title: `${displayName} | Agent Skills`,
    description,
    alternates: {
      canonical: `/authors/${decodedAuthor}`,
    },
    openGraph: {
      title: `${displayName} | Agent Skills`,
      description,
      url: `/authors/${decodedAuthor}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} | Agent Skills`,
      description,
    },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { author } = await params;
  const decodedAuthor = decodeURIComponent(author);
  const resolvedSearchParams = await searchParams;
  const pageParam =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : "";
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rows = await db
    .select({
      id: skillsTable.id,
      name: skillsTable.name,
      description: skillsTable.description,
      category: skillsTable.category,
      tags: skillsTable.tags,
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
    })
    .from(skillsTable);
  const skills = rows.filter((row) =>
    isAuthorMatch(
      {
        name: row.authorName,
        url: row.authorUrl,
        avatarUrl: row.authorAvatarUrl,
      },
      decodedAuthor
    )
  );

  if (skills.length === 0) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(skills.length / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const pagedSkills = skills.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  const displayName =
    getAuthorDisplayName({
      name: skills[0]?.authorName ?? decodedAuthor,
      url: skills[0]?.authorUrl ?? undefined,
    }) ?? decodedAuthor;
  const authorUrl = skills[0]?.authorUrl ?? null;
  const authorAvatarUrl = skills[0]?.authorAvatarUrl ?? null;
  const shareUrl = `/authors/${decodedAuthor}`;
  const buildPageHref = (value: number) =>
    value > 1
      ? `/authors/${encodeURIComponent(decodedAuthor)}?page=${value}`
      : `/authors/${encodeURIComponent(decodedAuthor)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <section className="relative mx-auto container px-6 pt-12 pb-6">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_65%)]" />
          <div className="absolute left-10 top-24 h-24 w-24 rounded-full border border-border/40 bg-muted/40 blur-2xl" />
          <div className="absolute right-12 top-40 h-32 w-32 rounded-full border border-border/40 bg-muted/40 blur-2xl" />
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Link
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary"
              href="/authors"
            >
              Back to authors
            </Link>
            <div className="mt-6 flex items-center gap-4">
              {authorAvatarUrl ? (
                <img
                  alt={displayName}
                  className="h-16 w-16 rounded-full border border-border/60 object-cover sm:h-20 sm:w-20"
                  src={authorAvatarUrl}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-muted text-base font-semibold text-foreground sm:h-20 sm:w-20">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {skills.length} Skills published on{" "}
                  {authorUrl ? (
                    <a
                      className="font-semibold text-foreground transition hover:text-primary"
                      href={authorUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      GitHub
                    </a>
                  ) : (
                    "Agent Skills"
                  )}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto container px-6 pb-16 flex-1 w-full">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pagedSkills.map((skill) => (
            <Link
              key={skill.id}
              className="group relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-5 shadow-lg shadow-primary/5 transition hover:border-primary/40 hover:bg-card"
              href={`/skills/${skill.id}`}
            >
              <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <h2 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {skill.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-5">
                {skill.description}
              </p>
              {skill.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span>{skill.category ?? "General"}</span>
                <span className="text-primary transition group-hover:translate-x-0.5">
                  View skill →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <PaginationNav
          buildHref={buildPageHref}
          currentPage={currentPage}
          totalItems={skills.length}
          totalPages={totalPages}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
