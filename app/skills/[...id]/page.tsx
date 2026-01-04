import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillFilesExplorer } from "@/components/skill-files-explorer";
import { client } from "@/lib/api/orpc";
import { notFound } from "next/navigation";

type SkillDetailPageProps = {
  params: Promise<{ id: string | string[] }>;
};

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

      <main className="mx-auto container flex-1 px-6 py-14">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-10 shadow-xl shadow-primary/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_100%_at_0%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
          <div className="relative">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Agent Skill Detail
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {skill.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {skill.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {skill.category}
              </span>
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ID: {skill.id}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <aside className="rounded-2xl border border-border/40 bg-card/40 p-8">
            <h2 className="text-lg font-semibold text-foreground">
              Author Information
            </h2>
            {skill.authorName ? (
              <div className="mt-5 flex items-start gap-4">
                {skill.authorAvatarUrl ? (
                  <img
                    alt={skill.authorName}
                    className="h-14 w-14 rounded-full border border-border/60 object-cover"
                    src={skill.authorAvatarUrl}
                  />
                ) : null}
                <div>
                  <p className="text-base font-semibold text-foreground">
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      {skill.authorUrl}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No author information provided.
              </p>
            )}

            <div className="mt-8 border-t border-border/40 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Category
              </p>
              <p className="mt-2 text-sm text-foreground">{skill.category}</p>
            </div>
          </aside>
        </div>

        <SkillFilesExplorer skillId={skill.id} skillName={skill.name} />
      </main>

      <SiteFooter />
    </div>
  );
}
