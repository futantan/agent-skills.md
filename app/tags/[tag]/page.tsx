import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillCard } from "@/components/skill-card";
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

      <section className="mx-auto container px-6 pt-12 pb-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            href="/tags"
          >
            <span aria-hidden="true">←</span>
            Back to tags
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Tag
            </span>
            <h1 className="text-3xl font-semibold text-balance text-foreground sm:text-5xl">
              Agent Skills with tag: {decodedTag}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground text-pretty sm:text-base">
            {summary.totalCount} skills match this tag. Use tags to discover
            related Agent Skills and explore similar workflows.
          </p>
        </div>
      </section>

      <main className="mx-auto container px-6 pb-16 flex-1 w-full">
        <div className="grid auto-rows-[280px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillsPage.items.map((skill, index) => (
            <SkillCard key={skill.id} skill={skill} index={index} />
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
