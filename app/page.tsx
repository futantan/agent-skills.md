import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkillsExplorer } from "@/components/skills-explorer";
import { client } from "@/lib/api/orpc";

export default async function Home() {
  const skills = await client.skills.list();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative -mt-14 pt-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_100%,rgba(56,189,248,0.18),rgba(15,23,42,0))]" />
          <div className="absolute inset-0 hero-grid bg-[linear-gradient(to_right,rgba(120,120,120,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,0.2)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
          <div className="absolute -left-20 top-10 h-40 w-120 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-32 top-24 h-56 w-160 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-[12%] top-[28%] h-10 w-10 rotate-12 border border-primary/30 bg-background/20 backdrop-blur-sm animate-hero-float" />
          <div className="absolute left-[72%] top-[18%] h-14 w-14 -rotate-6 border border-primary/20 bg-background/10 backdrop-blur-sm animate-hero-float [animation-delay:600ms]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(14,116,144,0.08),transparent_45%)]" />
        </div>

        {/* Hero Section */}
        <div className="border-b border-border/40">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-4 py-1.5 text-sm backdrop-blur-sm animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span className="text-muted-foreground">
                  {skills.length} Skills Available
                </span>
              </div>

              <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-fade-in-up [animation-delay:100ms]">
                Agent Skills
              </h1>

              <p className="text-lg leading-8 text-muted-foreground animate-fade-in-up [animation-delay:200ms]">
                Production-ready AI capabilities for your workflow. Enhance your
                projects with Agent Skills
              </p>
            </div>
          </div>
        </div>
      </div>

      <SkillsExplorer initialSkills={skills} />

      <SiteFooter />
    </div>
  );
}
