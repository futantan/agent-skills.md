"use client";

import { CarbonAdInCard } from "@/components/carbon-ad";
import { PaginationNav } from "@/components/pagination-nav";
import { SkillCard } from "@/components/skill-card";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { orpc } from "@/lib/api/orpc";
import { DEFAULT_PAGE_SIZE } from "@/lib/skills-pagination";
import type { SkillsPage } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect } from "react";

type SkillsExplorerProps = {
  initialPage: SkillsPage;
  initialQuery: string;
};

const SEARCH_PRESETS: Array<{ label: string; query: string; count: number }> = [
  { label: "UI", query: "ui", count: 4155 },
  { label: "React", query: "react", count: 561 },
  { label: "TypeScript", query: "typescript", count: 325 },
  { label: "Frontend", query: "frontend", count: 286 },
  { label: "Tailwind", query: "tailwind", count: 118 },
  { label: "Next.js", query: "nextjs", count: 75 },
];

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

  const handleSearchChange = useCallback(
    (value: string) => {
      void setUrlQuery(value);
      if (page !== 1) {
        void setPage(1);
      }
    },
    [page, setPage, setUrlQuery]
  );

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

      <div className="mx-auto mt-3 w-full max-w-4xl px-6">
        <div className="rounded-lg flex flex-col lg:flex-row lg:items-center gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            Popular searches
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SEARCH_PRESETS.map((preset) => {
              const isActive = activeQuery.toLowerCase() === preset.query;
              return (
                <Button
                  key={preset.query}
                  size="xs"
                  variant={isActive ? "secondary" : "ghost"}
                  className={isActive ? "" : "border border-border/70"}
                  onClick={() => handleSearchChange(preset.query)}
                >
                  {preset.label}
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {preset.count}
                  </span>
                </Button>
              );
            })}
            {activeQuery && (
              <Button
                size="xs"
                variant="ghost"
                className="border border-border/70"
                onClick={() => handleSearchChange("")}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto container px-6 pt-10 pb-16">
        <div className="grid auto-rows-[280px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skills.flatMap((skill, index) => {
            const items = [
              <SkillCard key={skill.id} skill={skill} index={index} />,
            ];
            if (index === 1) {
              items.push(
                <div key="ad" className="h-full ">
                  <CarbonAdInCard />
                </div>
              );
            }
            return items;
          })}
        </div>
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
