import { describe, expect, it } from "vitest";

import {
  buildInstallCommands,
  isRealCategory,
  parseHubPage,
  skillHubPath,
  skillIndexing,
  skillPath,
} from "./skill-seo";

describe("skillPath", () => {
  it("encodes each id segment and keeps the slashes", () => {
    expect(skillPath("owner/repo/Agent Browser")).toBe(
      "/skills/owner/repo/Agent%20Browser"
    );
    expect(skillPath("owner/repo/股票")).toBe(
      "/skills/owner/repo/%E8%82%A1%E7%A5%A8"
    );
  });
});

describe("skillIndexing", () => {
  const id = "owner/repo/copy";

  it("gives an indexable skill a self canonical and no robots", () => {
    expect(skillIndexing({ id, indexable: true, primaryId: null })).toEqual({
      alternates: { canonical: "/skills/owner/repo/copy" },
    });
  });

  it("gives a copy a canonical to its primary and no robots", () => {
    expect(
      skillIndexing({ id, indexable: false, primaryId: "a/b/primary" })
    ).toEqual({ alternates: { canonical: "/skills/a/b/primary" } });
  });

  it("gives everything else noindex,follow and no canonical", () => {
    expect(skillIndexing({ id, indexable: false, primaryId: null })).toEqual({
      robots: { index: false, follow: true },
    });
  });

  it("prefers the self canonical if a row somehow has both", () => {
    expect(
      skillIndexing({ id, indexable: true, primaryId: "a/b/primary" })
    ).toEqual({ alternates: { canonical: "/skills/owner/repo/copy" } });
  });
});

describe("buildInstallCommands", () => {
  it("builds the skills CLI command per package manager", () => {
    expect(buildInstallCommands("owner/repo", "my-skill")).toEqual({
      npm: "npx skills add owner/repo --skill my-skill",
      pnpm: "pnpm dlx skills add owner/repo --skill my-skill",
      yarn: "yarn dlx skills add owner/repo --skill my-skill",
      bun: "bunx skills add owner/repo --skill my-skill",
    });
  });

  it("quotes a skill name with spaces", () => {
    expect(buildInstallCommands("owner/repo", "Agent Browser").npm).toBe(
      'npx skills add owner/repo --skill "Agent Browser"'
    );
  });
});

describe("isRealCategory", () => {
  it("rejects empty and Uncategorized in any case", () => {
    expect(isRealCategory("web-framework")).toBe(true);
    expect(isRealCategory("Uncategorized")).toBe(false);
    expect(isRealCategory(" uncategorized ")).toBe(false);
    expect(isRealCategory(null)).toBe(false);
  });
});

describe("parseHubPage", () => {
  it("defaults to page 1 and reads a positive integer", () => {
    expect(parseHubPage(undefined)).toBe(1);
    expect(parseHubPage("1")).toBe(1);
    expect(parseHubPage("12")).toBe(12);
  });

  it("returns null for anything else", () => {
    for (const value of ["0", "-1", "abc", "1.5", "2x", ""]) {
      expect(parseHubPage(value)).toBeNull();
    }
    expect(parseHubPage(["1", "2"])).toBeNull();
  });
});

describe("skillHubPath", () => {
  it("drops the query on page 1", () => {
    expect(skillHubPath(1)).toBe("/skills");
    expect(skillHubPath(3)).toBe("/skills?page=3");
  });
});
