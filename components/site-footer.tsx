export function SiteFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Built with love, for a post-AI generation of developers
          </p>
          <div className="flex items-center gap-4">
            {/* <a
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
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
