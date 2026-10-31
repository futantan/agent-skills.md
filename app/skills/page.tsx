import { PaginationNav } from "@/components/pagination-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillCard } from "@/components/skill-card";
import { client } from "@/lib/api/orpc";
import { parseHubPage, skillHubPath } from "@/lib/skill-seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type SkillsHubProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DESCRIPTION =
  "Browse the top Agent Skills, ranked by GitHub stars, each with its full SKILL.md and an install command.";

export async function generateMetadata({
  searchParams,
}: SkillsHubProps): Promise<Metadata> {
  const page = parseHubPage((await searchParams).page);
  if (!page) {
    return { robots: { index: false, follow: true } };
  }

  const title =
    page > 1
      ? `Browse Agent Skills, Page ${page} | Agent Skills`
      : "Browse Agent Skills | Agent Skills";
  const url = skillHubPath(page);

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: DESCRIPTION, url, type: "website" },
  };
}

export default async function SkillsHubPage({ searchParams }: SkillsHubProps) {
  const page = parseHubPage((await searchParams).page);
  if (!page) {
    notFound();
  }

  const skills = await client.skills.listIndexable({ page });
  if (skills.items.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto container flex-1 px-6 py-10 sm:py-14">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Browse Agent Skills
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
            {DESCRIPTION}
          </p>
        </div>

        <div className="grid auto-rows-[280px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skills.items.map((skill) => (
            <SkillCard key={skill.id} skill={skill} index={0} />
          ))}
        </div>

        <PaginationNav
          buildHref={skillHubPath}
          currentPage={skills.page}
          totalItems={skills.total}
          totalPages={skills.totalPages}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
