import { describe, expect, it } from "vitest";

import { resolveSkillFilePath } from "./skill-path";

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
