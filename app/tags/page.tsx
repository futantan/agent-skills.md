import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent Skills Tags | Agent Skills",
  description:
    "Browse all Agent Skills tags to find Agent Skills collections by topic, from automation to research and beyond.",
  alternates: {
    canonical: "/tags",
  },
  openGraph: {
    title: "Agent Skills Tags | Agent Skills",
    description:
      "Browse all Agent Skills tags to find Agent Skills collections by topic, from automation to research and beyond.",
    url: "/tags",
    type: "website",
  },
  twitter: {
    title: "Agent Skills Tags | Agent Skills",
    description:
      "Browse all Agent Skills tags to find Agent Skills collections by topic, from automation to research and beyond.",
  },
};

type TagsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : "";
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rows = await db.select({ tags: skillsTable.tags }).from(skillsTable);

  const tagMap = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    for (const rawTag of row.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) {
        continue;
      }
      const key = tag.toLowerCase();
      const existing = tagMap.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      tagMap.set(key, { name: tag, count: 1 });
    }
  }

  const tags = Array.from(tagMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
  const totalTags = tags.length;
  const totalPages = Math.max(1, Math.ceil(totalTags / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const pagedTags = tags.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  const buildPageHref = (value: number) =>
    value > 1 ? `/tags?page=${value}` : "/tags";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Agent Skills Tags",
    description:
      "Browse all Agent Skills tags to find Agent Skills collections by topic.",
    url: "https://agent-skills.md/tags",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pagedTags.map((tag, index) => ({
        "@type": "ListItem",
        position: startIndex + index + 1,
        name: tag.name,
        url: `https://agent-skills.md/tags/${encodeURIComponent(tag.name)}`,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="relative mx-auto container flex-1 px-6 pt-12 pb-16">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_65%)]" />
          <div className="absolute right-12 top-20 h-28 w-28 rounded-full border border-border/50 bg-muted/30 blur-2xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Explore Agent Skills by tags
          </h1>
        </div>

        {totalTags === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/50 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No tags have been indexed yet.
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pagedTags.map((tag, index) => (
                <Link
                  key={tag.name}
                  className="group relative flex h-full flex-col gap-4 rounded-[18px] border border-border/60 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Tag
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      {tag.name}
                    </h2>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                    <span>{tag.count} Skills</span>
                    <span className="font-medium text-foreground/80 transition group-hover:text-foreground">
                      View skills
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <PaginationNav
              buildHref={buildPageHref}
              currentPage={currentPage}
              totalItems={totalTags}
              totalPages={totalPages}
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
