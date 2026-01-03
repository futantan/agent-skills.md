import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { SubmitForm } from "./submit-form";

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(75%_75%_at_10%_20%,rgba(56,189,248,0.18),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_90%_10%,rgba(14,116,144,0.14),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,120,120,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,0.18)_1px,transparent_1px)] bg-size-[56px_56px] opacity-40" />
          <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <section className="space-y-6">
              <Badge variant="outline" className="bg-background/70">
                Submit repository
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Add your GitHub skills to the catalog.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Point us at a repo with a `/skills` directory and we will ingest
                it, parse skill metadata, and publish everything into the
                database for discovery.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Step 1
                  </p>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    Submit the repo URL
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Share a GitHub repo URL or the owner/name shortcut.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Step 2
                  </p>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    Skills get parsed
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    We scan `skills/*/SKILL.md` and add them to the catalog.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Step 3
                  </p>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    Review the listing
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    New skills appear in the Explore page automatically.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/70 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Step 4
                  </p>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    Iterate anytime
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Re-submit to refresh metadata and keep the catalog current.
                  </p>
                </div>
              </div>
            </section>

            <SubmitForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
