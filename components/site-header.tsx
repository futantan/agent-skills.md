import { SiteLogo } from "@/components/site-logo";
import { buttonVariants } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <SiteLogo />

        <nav className="flex items-center gap-2">
          <Link
            className={buttonVariants({ variant: "default", size: "sm" })}
            href="/submit"
          >
            Submit
          </Link>
          <a
            aria-label="GitHub"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            href="https://github.com/futantan/agent-skills.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github />
          </a>
        </nav>
      </div>
    </header>
  );
}
