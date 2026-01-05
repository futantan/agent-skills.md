"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { orpc } from "@/lib/api/orpc";
import { PaginatedSkills } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";

type SkillsExplorerProps = {
  initialPage: PaginatedSkills;
};

const PER_PAGE = 12;

export function SkillsExplorer({ initialPage }: SkillsExplorerProps) {
  const [urlQuery, setUrlQuery] = useQueryState("q", {
    ...parseAsString.withDefault(""),
    history: "replace",
    limitUrlUpdates: debounce(300),
  });
  const [page, setPage] = useQueryState("page", {
    ...parseAsInteger.withDefault(1),
    history: "replace",
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const activeQuery = urlQuery.trim();
  const previousQueryRef = useRef(activeQuery);

  const queryOptions = orpc.skills.search.queryOptions({
    input: { query: activeQuery, page, perPage: PER_PAGE },
  });

  const searchQuery = useQuery<PaginatedSkills>({
    ...queryOptions,
    initialData:
      activeQuery === "" && page === initialPage.page ? initialPage : undefined,
    placeholderData: (previousData) => previousData ?? initialPage,
    staleTime: 30_000,
  });

  const skills = useMemo(
    () => searchQuery.data?.items ?? [],
    [searchQuery.data]
  );

  useEffect(() => {
    if (previousQueryRef.current !== activeQuery) {
      previousQueryRef.current = activeQuery;
      void setPage(1);
    }
  }, [activeQuery, setPage]);

  useEffect(() => {
    const resolvedPage = searchQuery.data?.page;
    if (resolvedPage && resolvedPage !== page) {
      void setPage(resolvedPage);
    }
  }, [page, searchQuery.data, setPage]);

  const total = searchQuery.data?.total ?? 0;
  const totalPages = searchQuery.data?.totalPages ?? 1;

  const categories = useMemo(() => {
    const unique = new Set(
      skills.map((skill) => skill.category).filter(Boolean) as string[]
    );
    return ["All", ...Array.from(unique)];
  }, [skills]);

  const activeCategory = useMemo(
    () => (categories.includes(selectedCategory) ? selectedCategory : "All"),
    [categories, selectedCategory]
  );

  return (
    <>
      <div className="mx-auto -mt-6 flex w-full max-w-4xl px-6 relative">
        <InputGroup className="h-12 w-full bg-white ring-1 ring-primary">
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search skills"
            onChange={(event) => {
              void setUrlQuery(event.target.value);
              void setPage(1);
            }}
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
                  onClick={() => {
                    void setUrlQuery("");
                    void setPage(1);
                  }}
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
          onValueChange={setSelectedCategory}
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
              {skills.filter(
                (skill) => category === "All" || skill.category === category
              ).length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    No skills found. Try adjusting your search.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid auto-rows-[280px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {skills
                      .filter(
                        (skill) =>
                          category === "All" || skill.category === category
                      )
                      .map((skill, index) => (
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
                              <span className={"flex items-center gap-2"}>
                                View details <ArrowRight size="16" />
                              </span>
                            </div>

                            <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </Card>
                        </Link>
                      ))}
                  </div>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {total === 0
                          ? 0
                          : Math.min((page - 1) * PER_PAGE + 1, total)}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-foreground">
                        {total === 0 ? 0 : Math.min(page * PER_PAGE, total)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {total}
                      </span>{" "}
                      skills
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void setPage(Math.max(page - 1, 1))}
                        disabled={page <= 1}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <PaginationStatus
                        page={page}
                        totalPages={totalPages}
                        onChangePage={(nextPage) => void setPage(nextPage)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void setPage(Math.min(page + 1, totalPages))
                        }
                        disabled={page >= totalPages}
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </>
  );
}

type PaginationStatusProps = {
  page: number;
  totalPages: number;
  onChangePage: (page: number) => void;
};

function PaginationStatus({
  page,
  totalPages,
  onChangePage,
}: PaginationStatusProps) {
  const windowSize = 3;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(totalPages, page + windowSize);
  const pages = [];

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <div className="flex items-center gap-1">
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === page ? "default" : "outline"}
          size="icon-sm"
          onClick={() => onChangePage(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
    </div>
  );
}
