import { describe, expect, it } from "vitest";

import {
  MAX_INDEXABLE,
  countWords,
  hashBody,
  rankCandidates,
  selectIndexable,
  stripFrontmatter,
  type SkillBody,
  type SkillRow,
} from "./skill-selection";

const DESCRIPTION = "A description that is comfortably over forty characters.";
const LONG_BODY = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");

let nextId = 0;

function skill(overrides: Partial<SkillRow> = {}): SkillRow {
  nextId += 1;
  return {
    id: `owner/repo/skill-${nextId}`,
    repoId: "owner/repo",
    name: `skill-${nextId}`,
    description: `${DESCRIPTION} ${nextId}`,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    stars: 5000,
    forks: 10,
    ...overrides,
  };
}

function body(text: string): SkillBody {
  return { hash: hashBody(text), words: countWords(text) };
}

const ids = (rows: SkillRow[]) => rows.map((row) => row.id);

describe("rankCandidates", () => {
  it("picks the primary by stars, then forks, then oldest, then id", () => {
    const shared = { name: "shared", description: DESCRIPTION };
    const stars = skill({ ...shared, id: "a/stars/x", stars: 9000 });
    const forks = skill({ ...shared, id: "b/forks/x", stars: 2000, forks: 99 });
    const oldest = skill({
      ...shared,
      id: "c/oldest/x",
      stars: 2000,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });
    const idB = skill({ ...shared, id: "e/id/x", stars: 2000 });
    const idA = skill({ ...shared, id: "d/id/x", stars: 2000 });

    const all = [idB, idA, oldest, forks, stars];
    expect(ids(rankCandidates(all).candidates)).toEqual([stars.id]);
    expect(ids(rankCandidates(all.slice(0, 4)).candidates)).toEqual([forks.id]);
    expect(ids(rankCandidates(all.slice(0, 3)).candidates)).toEqual([
      oldest.id,
    ]);
    expect(ids(rankCandidates(all.slice(0, 2)).candidates)).toEqual([idA.id]);
  });

  it("groups by lowercased name and trimmed description", () => {
    const primary = skill({
      name: "Review",
      description: DESCRIPTION,
      stars: 9000,
    });
    const copy = skill({
      name: "review",
      description: `  ${DESCRIPTION}\n`,
      stars: 2000,
    });
    const other = skill({
      name: "review",
      description: `${DESCRIPTION} Other.`,
    });

    const { candidates, primaryOf } = rankCandidates([copy, other, primary]);

    expect(ids(candidates)).toEqual([primary.id, other.id]);
    expect(primaryOf.get(copy.id)).toBe(primary.id);
    expect(primaryOf.has(primary.id)).toBe(false);
  });

  it("does not promote a copy when its primary fails a filter", () => {
    const primary = skill({ name: "x", description: DESCRIPTION, stars: 500 });
    const copy = skill({ name: "x", description: DESCRIPTION, stars: 100 });

    expect(rankCandidates([primary, copy]).candidates).toEqual([]);
  });

  it("requires repo stars of at least 1000", () => {
    const enough = skill({ stars: 1000 });
    const short = skill({ stars: 999 });

    expect(ids(rankCandidates([enough, short]).candidates)).toEqual([
      enough.id,
    ]);
  });

  it("requires a description of at least 40 characters", () => {
    const exact = skill({ description: "x".repeat(40) });
    const short = skill({ description: "x".repeat(39) });
    const padded = skill({ description: `  ${"y".repeat(39)}  ` });

    expect(ids(rankCandidates([exact, short, padded]).candidates)).toEqual([
      exact.id,
    ]);
  });

  it("caps each lowercased repo at 100, keeping the best ranked", () => {
    const rows = Array.from({ length: 101 }, (_, i) =>
      skill({
        repoId: i % 2 ? "Owner/Repo" : "owner/repo",
        id: `owner/repo/${String(i).padStart(3, "0")}`,
        forks: i,
      })
    );
    const elsewhere = skill({ repoId: "other/repo", forks: 0 });

    const { candidates } = rankCandidates([...rows, elsewhere]);

    expect(candidates).toHaveLength(101);
    expect(ids(candidates)).toContain(elsewhere.id);
    expect(ids(candidates)).not.toContain("owner/repo/000");
  });

  it("returns candidates in ranked order", () => {
    const low = skill({ stars: 2000 });
    const high = skill({ stars: 3000 });

    expect(ids(rankCandidates([low, high]).candidates)).toEqual([
      high.id,
      low.id,
    ]);
  });
});

describe("selectIndexable", () => {
  it("drops candidates without a body or under 200 words", () => {
    const missing = skill();
    const short = skill();
    const exact = skill();
    const bodies = new Map([
      [short.id, body(LONG_BODY.split(" ").slice(0, 199).join(" "))],
      [exact.id, body(LONG_BODY)],
    ]);

    const result = selectIndexable([missing, short, exact], new Map(), bodies);

    expect(result.selected).toEqual([exact.id]);
    expect(result.dropped).toEqual({
      noBody: [missing.id],
      tooShort: [short.id],
      duplicateBody: [],
      overCap: [],
    });
  });

  it("drops an exact body duplicate of a higher ranked candidate", () => {
    const first = skill();
    const second = skill();
    const third = skill();
    const bodies = new Map([
      [first.id, body(LONG_BODY)],
      [second.id, body(LONG_BODY)],
      [third.id, body(`${LONG_BODY} different`)],
    ]);

    const result = selectIndexable([first, second, third], new Map(), bodies);

    expect(result.selected).toEqual([first.id, third.id]);
    expect(result.dropped.duplicateBody).toEqual([second.id]);
  });

  it("keeps the top 5,000 by rank", () => {
    const candidates = Array.from({ length: MAX_INDEXABLE + 2 }, () => skill());
    const bodies = new Map(
      candidates.map((row) => [row.id, body(`${LONG_BODY} ${row.id}`)])
    );

    const result = selectIndexable(candidates, new Map(), bodies);

    expect(MAX_INDEXABLE).toBe(5000);
    expect(result.selected).toEqual(ids(candidates).slice(0, MAX_INDEXABLE));
    expect(result.dropped.overCap).toEqual(
      ids(candidates).slice(MAX_INDEXABLE)
    );
  });

  it("points copies of a selected primary at it, and nothing else", () => {
    const selected = skill();
    const unselected = skill();
    const primaryOf = new Map([
      ["copy/of/selected", selected.id],
      ["copy/of/unselected", unselected.id],
    ]);

    const result = selectIndexable(
      [selected, unselected],
      primaryOf,
      new Map([[selected.id, body(LONG_BODY)]])
    );

    expect(result.canonical).toEqual(
      new Map([["copy/of/selected", selected.id]])
    );
  });

  it("never gives a body duplicate a canonical", () => {
    const first = skill();
    const second = skill();
    const primaryOf = new Map([["copy/of/second", second.id]]);
    const bodies = new Map([
      [first.id, body(LONG_BODY)],
      [second.id, body(LONG_BODY)],
    ]);

    const result = selectIndexable([first, second], primaryOf, bodies);

    expect(result.canonical.size).toBe(0);
    expect(result.canonical.has(second.id)).toBe(false);
  });

  it("is never indexable and canonical on the same skill", () => {
    const a = skill();
    const b = skill();
    const primaryOf = new Map([["copy", a.id]]);
    const bodies = new Map([
      [a.id, body(LONG_BODY)],
      [b.id, body(`${LONG_BODY} b`)],
    ]);

    const result = selectIndexable([a, b], primaryOf, bodies);

    const overlap = result.selected.filter((id) => result.canonical.has(id));
    expect(overlap).toEqual([]);
  });
});

describe("body helpers", () => {
  it("strips frontmatter, including CRLF files", () => {
    expect(stripFrontmatter("---\nname: x\n---\n\n# Title\n")).toBe("# Title");
    expect(stripFrontmatter("---\r\nname: x\r\n---\r\nBody")).toBe("Body");
  });

  it("leaves files without frontmatter alone", () => {
    expect(stripFrontmatter("# Title\n---\nmore")).toBe("# Title\n---\nmore");
  });

  it("treats an unterminated frontmatter block as body", () => {
    expect(stripFrontmatter("---\nname: x\nBody")).toBe("---\nname: x\nBody");
  });

  it("counts whitespace separated words", () => {
    expect(countWords("  one two\n\nthree\t four ")).toBe(4);
    expect(countWords("   ")).toBe(0);
  });

  it("hashes to the same value only for identical bodies", () => {
    expect(hashBody("a")).toBe(hashBody("a"));
    expect(hashBody("a")).not.toBe(hashBody("b"));
    expect(hashBody("a")).toMatch(/^[0-9a-f]{64}$/);
  });
});
