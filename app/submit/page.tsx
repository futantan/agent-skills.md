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

        <div className="relative mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
          <div className="space-y-10">
            <section className="space-y-6 text-center">
              <Badge variant="outline" className="bg-background/70">
                Submit repository
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Add skills to the website.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Paste a GitHub repo link. We will add its skills to the site
                automatically.
              </p>
            </section>

            <SubmitForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
