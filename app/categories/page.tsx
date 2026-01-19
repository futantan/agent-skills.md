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
  title: "Agent Skills Categories | Agent Skills",
  description:
    "Browse Agent Skills categories to explore curated collections, from automation to research and beyond.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Agent Skills Categories | Agent Skills",
    description:
      "Browse Agent Skills categories to explore curated collections, from automation to research and beyond.",
    url: "/categories",
    type: "website",
  },
  twitter: {
    title: "Agent Skills Categories | Agent Skills",
    description:
      "Browse Agent Skills categories to explore curated collections, from automation to research and beyond.",
  },
};

type CategoriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CategorySummary = {
  name: string;
  count: number;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : "";
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rows = await db
    .select({ category: skillsTable.category })
    .from(skillsTable);

  const categoryMap = new Map<string, CategorySummary>();
  for (const row of rows) {
    const category = row.category?.trim();
    if (!category) {
      continue;
    }
    const key = category.toLowerCase();
    const existing = categoryMap.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    categoryMap.set(key, { name: category, count: 1 });
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
  const totalCategories = categories.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCategories / DEFAULT_PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const pagedCategories = categories.slice(
    startIndex,
    startIndex + DEFAULT_PAGE_SIZE
  );
  const buildPageHref = (value: number) =>
    value > 1 ? `/categories?page=${value}` : "/categories";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Agent Skills Categories",
    description:
      "Browse Agent Skills categories to explore curated collections.",
    url: "https://agent-skills.md/categories",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pagedCategories.map((category, index) => ({
        "@type": "ListItem",
        position: startIndex + index + 1,
        name: category.name,
        url: `https://agent-skills.md/categories/${encodeURIComponent(
          category.name
        )}`,
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
            Explore Agent Skills by category
          </h1>
        </div>

        {totalCategories === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/50 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No categories have been indexed yet.
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pagedCategories.map((category, index) => (
                <Link
                  key={category.name}
                  className="group relative flex h-full flex-col gap-4 rounded-[18px] border border-border/60 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
                  href={`/categories/${encodeURIComponent(category.name)}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Category
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      {category.name}
                    </h2>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                    <span>{category.count} Skills</span>
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
              totalItems={totalCategories}
              totalPages={totalPages}
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
