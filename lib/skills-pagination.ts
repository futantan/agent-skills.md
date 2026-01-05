export const DEFAULT_PAGE_SIZE = 18;

export function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [];
  }

  const candidates = new Set([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);
  const sorted = Array.from(candidates)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) {
      items.push("ellipsis");
    }
    items.push(value);
    previous = value;
  }
  return items;
}
