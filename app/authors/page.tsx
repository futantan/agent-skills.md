import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAuthorDisplayName, getAuthorSlug } from "@/lib/author-utils";
import { siteConfig } from "@/lib/site-config";
import { db } from "@/db";
import { skillsTable } from "@/db/schema";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GitHub Authors | Agent Skills",
  description:
    "Browse every GitHub author we have indexed, and explore their published Agent Skills.",
  alternates: {
    canonical: "/authors",
  },
  openGraph: {
    title: "GitHub Authors | Agent Skills",
    description:
      "Browse every GitHub author we have indexed, and explore their published Agent Skills.",
    url: "/authors",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GitHub Authors | Agent Skills",
    description:
      "Browse every GitHub author we have indexed, and explore their published Agent Skills.",
  },
};

export default async function AuthorsPage() {
  const rows = await db
    .select({
      authorName: skillsTable.authorName,
      authorUrl: skillsTable.authorUrl,
      authorAvatarUrl: skillsTable.authorAvatarUrl,
    })
    .from(skillsTable);

  const authorsMap = new Map<
    string,
    {
      slug: string;
      name: string;
      url?: string | null;
      avatarUrl?: string | null;
      skillCount: number;
    }
  >();

  for (const row of rows) {
    const slug = getAuthorSlug({
      name: row.authorName,
      url: row.authorUrl,
      avatarUrl: row.authorAvatarUrl,
    });
    const displayName = getAuthorDisplayName({
      name: row.authorName,
      url: row.authorUrl,
    });

    if (!slug || !displayName) {
      continue;
    }

    const key = slug.toLowerCase();
    const existing = authorsMap.get(key);
    if (!existing) {
      authorsMap.set(key, {
        slug,
        name: displayName,
        url: row.authorUrl ?? null,
        avatarUrl: row.authorAvatarUrl ?? null,
        skillCount: 1,
      });
      continue;
    }

    existing.skillCount += 1;
    if (!existing.url && row.authorUrl) {
      existing.url = row.authorUrl;
    }
    if (!existing.avatarUrl && row.authorAvatarUrl) {
      existing.avatarUrl = row.authorAvatarUrl;
    }
  }

  const authors = Array.from(authorsMap.values()).sort((a, b) => {
    if (b.skillCount !== a.skillCount) {
      return b.skillCount - a.skillCount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="relative mx-auto container px-6 pt-12 pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_65%)]" />
          <div className="absolute right-10 top-24 h-32 w-32 rounded-full border border-border/50 bg-muted/30 blur-2xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            GitHub Authors
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Every creator who shared a skill
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Discover the authors behind {siteConfig.site.title}. Each profile is
            a shareable landing page for their Agent Skills.
          </p>
        </div>

        {authors.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/50 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No GitHub authors have been indexed yet.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author, index) => (
              <Link
                key={author.slug}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 shadow-lg shadow-primary/5 transition hover:border-primary/40 hover:bg-card"
                href={`/authors/${author.slug}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-center gap-4">
                  {author.avatarUrl ? (
                    <img
                      alt={author.name}
                      className="h-12 w-12 rounded-full border border-border/60 object-cover"
                      src={author.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted text-sm font-semibold text-foreground">
                      {author.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {author.name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {author.skillCount} Skills
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>View skills</span>
                  <span className="text-primary transition group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
