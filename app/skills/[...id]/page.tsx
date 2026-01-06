import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillFilesExplorer } from "@/components/skill-files-explorer";
import { client } from "@/lib/api/orpc";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type SkillDetailPageProps = {
  params: Promise<{ id: string | string[] }>;
};

export async function generateMetadata({
  params,
}: SkillDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const rawId = Array.isArray(id) ? id.join("/") : id;
  const decodedId = decodeURIComponent(rawId);
  const normalizedId = decodedId.replace(/^\/?skills\//, "");
  const skill = await client.skills.find({ id: normalizedId });
  const title = skill?.name
    ? `${skill.name} Skill | Agent Skills`
    : "Agent Skills";

  return {
    title,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto container flex-1 px-4 py-8 sm:px-6 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 sm:p-10 shadow-xl shadow-primary/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_100%_at_0%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground sm:mb-3 sm:text-xs">
                Agent Skill Detail
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {skill.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
                {skill.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-3 sm:py-1 sm:text-xs sm:tracking-widest">
                  {skill.category}
                </span>
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-3 sm:py-1 sm:text-xs sm:tracking-widest">
                  ID: {skill.id}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs sm:tracking-[0.25em]">
                Author Information
              </p>
              {skill.authorName ? (
                <div className="mt-3 flex items-start gap-3 sm:mt-4 sm:gap-4">
                  {skill.authorAvatarUrl ? (
                    <img
                      alt={skill.authorName}
                      className="h-10 w-10 rounded-full border border-border/60 object-cover sm:h-14 sm:w-14"
                      src={skill.authorAvatarUrl}
                    />
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-foreground sm:text-base">
                      {skill.authorUrl ? (
                        <a
                          className="transition-colors hover:text-primary"
                          href={skill.authorUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {skill.authorName}
                        </a>
                      ) : (
                        skill.authorName
                      )}
                    </p>
                    {skill.authorUrl ? (
                      <p className="mt-1 text-xs text-muted-foreground sm:mt-2">
                        {skill.authorUrl}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                  No author information provided.
                </p>
              )}
            </div>
          </div>
        </div>

        <SkillFilesExplorer skillId={skill.id} skillName={skill.name} />
      </main>

      <SiteFooter />
    </div>
  );
}
