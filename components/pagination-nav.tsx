import Link from "next/link";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { buildPaginationItems } from "@/lib/skills-pagination";

type PaginationNavProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  buildHref: (page: number) => string;
};

export function PaginationNav({
  currentPage,
  totalPages,
  totalItems,
  buildHref,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  const paginationItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems} results
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage > 1 ? (
              <Link
                className={buttonVariants({ variant: "ghost", size: "default" })}
                href={buildHref(currentPage - 1)}
              >
                Previous
              </Link>
            ) : (
              <span
                className={buttonVariants({ variant: "ghost", size: "default" })}
                aria-disabled="true"
              >
                Previous
              </span>
            )}
          </PaginationItem>
          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <Link
                  className={buttonVariants({
                    variant: item === currentPage ? "outline" : "ghost",
                    size: "icon",
                  })}
                  href={buildHref(item)}
                >
                  {item}
                </Link>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            {currentPage < totalPages ? (
              <Link
                className={buttonVariants({ variant: "ghost", size: "default" })}
                href={buildHref(currentPage + 1)}
              >
                Next
              </Link>
            ) : (
              <span
                className={buttonVariants({ variant: "ghost", size: "default" })}
                aria-disabled="true"
              >
                Next
              </span>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
