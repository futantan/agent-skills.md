import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Search } from "lucide-react";
import { agentSkills } from "@/lib/skills";
import Link from "next/link";


const categories = [
  "All",
  "Development",
  "Frontend",
  "Data",
  "Testing",
  "Security",
  "DevOps",
  "Documentation",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/20 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <a
            className="text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
            href="/"
          >
            Logo
          </a>
          <nav className="flex items-center gap-2">
            <a
              className={buttonVariants({ variant: "default", size: "sm" })}
              href="/"
            >
              Explore
            </a>
            <a
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              href="/submit"
            >
              Submit
            </a>
            <a
              aria-label="GitHub"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              href="TODO:"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github />
            </a>
          </nav>
        </div>
      </header>

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
                  12 Skills Available
                </span>
              </div>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-fade-in-up [animation-delay:100ms]">
                Agent Skills
              </h1>
              <p className="text-lg leading-8 text-muted-foreground animate-fade-in-up [animation-delay:200ms]">
                Production-ready AI capabilities for your development workflow.
                Enhance your projects with intelligent automation and analysis.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4 animate-fade-in-up [animation-delay:300ms]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span>All systems operational</span>
                </div>
                <div className="h-4 w-px bg-border"></div>
                <div className="text-sm text-muted-foreground">
                  Last updated: Just now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 flex w-full max-w-4xl px-6 relative">
        <InputGroup className="h-12 w-full bg-white">
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search skills"
            placeholder="Search skills..."
          />
        </InputGroup>
      </div>

      {/* Skills Grid */}
      <main className="mx-auto max-w-7xl px-6 pt-10 pb-16">
        <Tabs defaultValue="All" className="w-full">
          <div className="mb-12 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="no-scrollbar flex w-full flex-nowrap gap-1 overflow-x-auto rounded-md bg-transparent p-0 sm:flex-wrap sm:overflow-visible sm:w-auto">
                {categories.map((category, index) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="group flex h-6 items-center justify-center whitespace-nowrap rounded-sm border border-transparent px-1.5 font-mono text-xs font-medium text-foreground/80 transition-all hover:bg-muted/60 hover:text-foreground data-active:border-sky-500/30 data-active:bg-sky-50/80 data-active:text-sky-800 data-active:[box-shadow:hsl(210,90%,60%,0.18)_0_-2px_0_0_inset] animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {agentSkills
                  .filter(
                    (skill) => category === "All" || skill.category === category
                  )
                  .map((skill, index) => (
                    <Card
                      key={skill.id}
                      className="group relative overflow-hidden border border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="mb-4">
                        <h3 className="mb-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                          {skill.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {skill.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {skill.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Author */}
                      <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                        {skill.author ? (
                          <div className="flex items-center gap-3">
                            {skill.author.avatarUrl ? (
                              <img
                                alt={skill.author.name}
                                className="h-8 w-8 rounded-full border border-border/60 object-cover"
                                src={skill.author.avatarUrl}
                              />
                            ) : null}
                            <div className="text-sm text-muted-foreground">
                              {skill.author.url ? (
                                <a
                                  className="font-medium text-foreground transition-colors hover:text-primary"
                                  href={skill.author.url}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {skill.author.name}
                                </a>
                              ) : (
                                <span className="font-medium text-foreground">
                                  {skill.author.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No author info
                          </span>
                        )}
                        <Link
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                          href={`/skills/${skill.id}`}
                        >
                          View details
                        </Link>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Built with precision and care for the modern developer
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Documentation
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                API Reference
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
