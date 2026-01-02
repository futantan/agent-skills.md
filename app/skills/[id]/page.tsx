import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { agentSkills } from "@/lib/skills";
import { notFound } from "next/navigation";

type SkillDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return agentSkills.map((skill) => ({ id: skill.id }));
}

export default async function SkillDetailPage({
  params,
}: SkillDetailPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const skill = agentSkills.find((item) => item.id === decodedId);

  if (!skill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto container px-6 py-14">
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
          <section className="rounded-2xl border border-border/40 bg-card/40 p-8">
            <h2 className="text-lg font-semibold text-foreground">
              Skill Details
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {skill.description}
            </p>

            {skill.tags.length ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-border/40 bg-card/40 p-8">
            <h2 className="text-lg font-semibold text-foreground">
              Author Information
            </h2>
            {skill.author ? (
              <div className="mt-5 flex items-start gap-4">
                {skill.author.avatarUrl ? (
                  <img
                    alt={skill.author.name}
                    className="h-14 w-14 rounded-full border border-border/60 object-cover"
                    src={skill.author.avatarUrl}
                  />
                ) : null}
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {skill.author.url ? (
                      <a
                        className="transition-colors hover:text-primary"
                        href={skill.author.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {skill.author.name}
                      </a>
                    ) : (
                      skill.author.name
                    )}
                  </p>
                  {skill.author.url ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {skill.author.url}
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
      </main>

      <SiteFooter />
    </div>
  );
}
