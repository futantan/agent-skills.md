import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AUTHORS_PAGE_SIZE, fetchAuthorsPage } from "@/lib/browse-queries";
import { siteConfig } from "@/lib/site-config";
import { parseHubPage } from "@/lib/skill-seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const DESCRIPTION =
  "Browse every GitHub author we have indexed, and explore their published Agent Skills.";

const authorsPath = (page: number) =>
  page > 1 ? `/authors?page=${page}` : "/authors";

type AuthorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: AuthorsPageProps): Promise<Metadata> {
  const page = parseHubPage((await searchParams).page);
  if (!page) {
    return { robots: { index: false, follow: true } };
  }

  const title =
    page > 1
      ? `Agent Skills Authors, Page ${page} | Agent Skills`
      : "Agent Skills Authors | Agent Skills";
  const url = authorsPath(page);

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: DESCRIPTION, url, type: "website" },
  };
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const page = parseHubPage((await searchParams).page);
  if (!page) {
    notFound();
  }

  const { authors, total } = await fetchAuthorsPage(page);
  if (page > 1 && authors.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="relative mx-auto container flex-1 px-6 pt-12 pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_65%)]" />
          <div className="absolute right-10 top-24 h-32 w-32 rounded-full border border-border/50 bg-muted/30 blur-2xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Agent Skills Authors
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Every creator who shared a skill
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Discover the authors behind {siteConfig.site.title}. Each profile is
            a shareable landing page for their Agent Skills.
          </p>
        </div>

        {authors.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/50 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No GitHub authors have been indexed yet.
          </div>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author) => (
              <a
                key={author.slug}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-foreground/20"
                href={`/authors/${author.slug}`}
              >
                {author.avatarUrl ? (
                  <img
                    alt=""
                    className="h-10 w-10 rounded-full border border-border/70 object-cover"
                    loading="lazy"
                    src={author.avatarUrl}
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-sm font-semibold text-foreground">
                    {author.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {author.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {author.skillCount} Skills
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}

        <PaginationNav
          buildHref={authorsPath}
          currentPage={page}
          totalItems={total}
          totalPages={Math.ceil(total / AUTHORS_PAGE_SIZE)}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
