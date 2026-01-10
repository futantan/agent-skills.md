"use client";

import { PaginationNav } from "@/components/pagination-nav";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { orpc } from "@/lib/api/orpc";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import type { SkillsPage } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { GitFork, Loader2, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

type SkillsExplorerProps = {
  initialPage: SkillsPage;
  initialQuery: string;
};

export function SkillsExplorer({
  initialPage,
  initialQuery,
}: SkillsExplorerProps) {
  const [urlQuery, setUrlQuery] = useQueryState("q", {
    ...parseAsString.withDefault(""),
    history: "replace",
    limitUrlUpdates: debounce(300),
  });
  const [page, setPage] = useQueryState("page", {
    ...parseAsInteger.withDefault(1),
    history: "replace",
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const activeQuery = urlQuery.trim();
  const pageSize = DEFAULT_PAGE_SIZE;
  const isInitialState =
    page === initialPage.page && activeQuery === initialQuery;

  const searchQuery = useQuery<SkillsPage>(
    orpc.skills.search.queryOptions({
      input: { query: activeQuery || undefined, page, pageSize },
      initialData: isInitialState ? initialPage : undefined,
      placeholderData: (previous) => previous,
      staleTime: 30_000,
    })
  );

  const pageData = searchQuery.data ?? initialPage;
  const skills = pageData.items;
  const totalPages = pageData.totalPages;
  const currentPage = page;

  const categories = useMemo(() => {
    const unique = new Set(
      skills.map((skill) => skill.category).filter(Boolean) as string[]
    );
    return ["All", ...Array.from(unique)];
  }, [skills]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, categories]);

  const handleSearchChange = (value: string) => {
    void setUrlQuery(value);
    if (page !== 1) {
      void setPage(1);
    }
  };

  useEffect(() => {
    if (!searchQuery.isPlaceholderData && totalPages > 0 && page > totalPages) {
      void setPage(totalPages);
    }
  }, [page, searchQuery.isPlaceholderData, setPage, totalPages]);

  return (
    <>
      <div className="mx-auto -mt-6 flex w-full max-w-4xl px-6 relative">
        <InputGroup className="h-12 w-full bg-white ring-1 ring-primary">
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search skills"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search skills..."
            value={urlQuery}
          />
          {(searchQuery.isFetching || urlQuery.trim()) && (
            <InputGroupAddon align="inline-end">
              {searchQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <InputGroupButton
                  aria-label="Clear search"
                  onClick={() => handleSearchChange("")}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <main className="mx-auto container px-6 pt-10 pb-16">
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full"
        >
          {/* <div className="mb-12 flex flex-col gap-4">
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
          </div> */}

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid auto-rows-[280px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skills
                  .filter(
                    (skill) => category === "All" || skill.category === category
                  )
                  .map((skill, index) => {
                    const repoStars = skill.repoStars ?? 0;
                    const repoForks = skill.repoForks ?? 0;
                    const showRepoStats = repoStars > 0;

                    return (
                      <Link
                        key={skill.id}
                        className="group block h-full"
                        href={`/skills/${skill.id}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Card className="relative h-full overflow-hidden border border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up">
                          <div className="mb-4">
                            <h3 className="mb-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                              {skill.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-6">
                              {skill.description}
                            </p>
                          </div>

                          {skill.tags.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                              {skill.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                            <div className="flex flex-col gap-2">
                              {skill.authorName ? (
                                <div className="flex items-center gap-3">
                                  {skill.authorAvatarUrl ? (
                                    <img
                                      alt={skill.authorName}
                                      className="h-8 w-8 rounded-full border border-border/60 object-cover"
                                      src={skill.authorAvatarUrl}
                                    />
                                  ) : null}
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {skill.authorName}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No author info
                                </span>
                              )}
                            </div>
                            {showRepoStats ? (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5" />
                                  {repoStars.toLocaleString()}
                                </span>
                                {repoForks > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <GitFork className="h-3.5 w-3.5" />
                                    {repoForks.toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </Card>
                      </Link>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <PaginationNav
          buildHref={(value) =>
            value > 1
              ? `/?page=${value}${activeQuery ? `&q=${encodeURIComponent(activeQuery)}` : ""}`
              : activeQuery
                ? `/?q=${encodeURIComponent(activeQuery)}`
                : "/"
          }
          currentPage={currentPage}
          totalItems={pageData.total}
          totalPages={totalPages}
        />
      </main>
    </>
  );
}
