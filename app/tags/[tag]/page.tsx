import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { client } from "@/lib/api/orpc";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const summary = await client.tags.summary({ tag: decodedTag });
  const description = summary.totalCount
    ? `Explore ${summary.totalCount} Agent Skills tagged with ${decodedTag}.`
    : "Discover production-ready AI skills shared by the community.";

  return {
    title: `${decodedTag} | Agent Skills`,
    description,
    alternates: {
      canonical: `/tags/${decodedTag}`,
    },
    openGraph: {
      title: `${decodedTag} | Agent Skills`,
      description,
      url: `/tags/${decodedTag}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${decodedTag} | Agent Skills`,
      description,
    },
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const resolvedSearchParams = await searchParams;
  const pageParam =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : "";
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const summary = await client.tags.summary({ tag: decodedTag });

  if (!summary.totalCount) {
    notFound();
  }

  const totalPages = Math.max(
    1,
    Math.ceil(summary.totalCount / DEFAULT_PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const skillsPage = await client.tags.skills({
    tag: decodedTag,
    page: currentPage,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const buildPageHref = (value: number) =>
    value > 1
      ? `/tags/${encodeURIComponent(decodedTag)}?page=${value}`
      : `/tags/${encodeURIComponent(decodedTag)}`;

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
              href="/tags"
            >
              Back to tags
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Tag
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {decodedTag}
              </h1>
            </div>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {summary.totalCount} skills match this tag.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto container px-6 pb-16 flex-1 w-full">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillsPage.items.map((skill) => (
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
                  {skill.tags.map((tagValue) => (
                    <span
                      key={tagValue}
                      className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      {tagValue}
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
          totalItems={summary.totalCount}
          totalPages={totalPages}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
