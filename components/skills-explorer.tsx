"use client";

import { CarbonAdInCard } from "@/components/carbon-ad";
import { PaginationNav } from "@/components/pagination-nav";
import { SkillCard } from "@/components/skill-card";
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
import { Loader2, Search, X } from "lucide-react";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";

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
                  .flatMap((skill, index) => {
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
