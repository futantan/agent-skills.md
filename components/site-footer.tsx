import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            Made with love by human beings using AI.
          </p>
          <a
            className="group flex items-center gap-3 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-sm font-semibold text-foreground shadow-sm shadow-primary/10 transition hover:border-primary/50 hover:bg-background hover:shadow-md hover:shadow-primary/20"
            href="https://github.com/futantan/agent-skills.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Github className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                Open Source
              </span>
              <span className="inline-flex items-center gap-2">
                Star us on GitHub
                <span className="text-primary transition group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
