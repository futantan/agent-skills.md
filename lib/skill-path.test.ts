import { describe, expect, it } from "vitest";

import { findSkillFileBySlug, resolveSkillFilePath } from "./skill-path";

const tree = (...paths: string[]) =>
  paths.map((path) => ({ path, type: "blob" as const, sha: "0" }));

describe("resolveSkillFilePath", () => {
  it("prefers the repo's configured skills path", () => {
    const entries = tree("skills/jira/SKILL.md", "other/jira/SKILL.md");

    expect(
      resolveSkillFilePath({ entries, basePath: "skills", skillName: "jira" })
    ).toBe("skills/jira/SKILL.md");
  });

  it("finds a skill nested anywhere in the tree", () => {
    const entries = tree("cli-tool/components/skills/jira/SKILL.md");

    expect(
      resolveSkillFilePath({ entries, basePath: "", skillName: "jira" })
    ).toBe("cli-tool/components/skills/jira/SKILL.md");
  });

  it("uses the part after the last colon for namespaced names", () => {
    const entries = tree(".claude/skills/gh-stack/SKILL.md");

    expect(
      resolveSkillFilePath({ entries, basePath: "", skillName: "n8n:gh-stack" })
    ).toBe(".claude/skills/gh-stack/SKILL.md");
  });

  it("returns null rather than guessing a file that does not exist", () => {
    const entries = tree(
      "skills/other/SKILL.md",
      "skills/jira/nested/SKILL.md"
    );

    expect(
      resolveSkillFilePath({ entries, basePath: "skills", skillName: "jira" })
    ).toBeNull();
  });
});

describe("findSkillFileBySlug", () => {
  it("matches a display name to its folder", () => {
    expect(
      findSkillFileBySlug(
        tree("skills/figma-developer/SKILL.md", "skills/other/SKILL.md"),
        "Figma Developer"
      )
    ).toBe("skills/figma-developer/SKILL.md");
  });

  it("returns the only SKILL.md of a single-skill repo", () => {
    expect(findSkillFileBySlug(tree("SKILL.md"), "Anything")).toBe("SKILL.md");
  });

  it("returns null when the match is missing or ambiguous", () => {
    const entries = tree(
      "a/figma-developer/SKILL.md",
      "b/figma-developer/SKILL.md"
    );

    expect(findSkillFileBySlug(entries, "Figma Developer")).toBeNull();
    expect(findSkillFileBySlug(entries, "Other")).toBeNull();
  });
});
