import { resolveSkillsPath } from "@/lib/skill-path";
import { ParsedSkill } from "@/lib/types";

type ParsedRepo = {
  owner: string;
  repo: string;
  skillsPath?: string;
};

type SkillFrontmatter = {
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
};

type FetchOptions = {
  token?: string;
  skillsPath?: string;
};

type FetchResult = {
  skills: ParsedSkill[];
  skillsPath: string;
};

type GitHubContent = {
  type: "file" | "dir";
  name: string;
  path: string;
  content?: string;
};

type GitHubTreeResponse = {
  tree: Array<{ path: string; type: string }>;
};

const API_BASE = "https://api.github.com";

function shouldIncludeInternalSkills() {
  const value = process.env.INSTALL_INTERNAL_SKILLS?.trim().toLowerCase();
  return value === "1" || value === "true";
}

function buildSkill(
  frontmatter: SkillFrontmatter,
  repo: ParsedRepo
): ParsedSkill | null {
  if (!frontmatter.name || !frontmatter.description) {
    return null;
  }

  const internalFlag = frontmatter.metadata?.internal?.toLowerCase();
  if (internalFlag === "true" && !shouldIncludeInternalSkills()) {
    return null;
  }

  return {
    id: `${repo.owner}/${repo.repo}/${frontmatter.name}`,
    name: frontmatter.name,
    description: frontmatter.description,
    category: frontmatter.metadata?.category ?? "Uncategorized",
    tags: parseTags(frontmatter.metadata?.tags),
    author: buildAuthor(frontmatter.metadata?.author, repo.owner),
  };
}

export async function fetchSkillsFromRepo(
  repoInput: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const repo = parseGitHubRepo(repoInput);
  if (!repo) {
    throw new Error("Invalid GitHub repository URL");
  }

  const headers = options.token
    ? { Authorization: `Bearer ${options.token}` }
    : undefined;

  // Only consider it an explicit path if there's actually a path specified
  // (not just a branch reference like /tree/main)
  const effectiveSkillsPath = options.skillsPath ?? repo.skillsPath;
  const hasExplicitPath =
    effectiveSkillsPath !== undefined && effectiveSkillsPath !== "";
  const requestedPath = resolveSkillsPath(effectiveSkillsPath);
  const fetchDir = async (path: string, allowFailure: boolean) => {
    const pathSegment = path ? `/${path}` : "";
    const request = getJson(
      `${API_BASE}/repos/${repo.owner}/${repo.repo}/contents${pathSegment}`,
      headers
    );
    return allowFailure ? request.catch(() => null) : request;
  };

  const fetchDefaultBranch = async () => {
    const data = await getJson(
      `${API_BASE}/repos/${repo.owner}/${repo.repo}`,
      headers
    ).catch(() => null);
    const branch = data?.default_branch;
    return typeof branch === "string" && branch.trim() ? branch : "main";
  };

  let basePath = requestedPath;
  let skillsDir = await fetchDir(basePath, !hasExplicitPath);

  if (!skillsDir && !hasExplicitPath && requestedPath === "skills") {
    basePath = "";
    skillsDir = await fetchDir(basePath, true);
  }

  const skills: ParsedSkill[] = [];
  const fetchSkillFile = async (path: string) => {
    const skillFile = await getJson(
      `${API_BASE}/repos/${repo.owner}/${repo.repo}/contents/${path}`,
      headers
    ).catch(() => null);
    if (!skillFile || skillFile.type !== "file" || !skillFile.content) {
      return null;
    }

    const content = Buffer.from(skillFile.content, "base64").toString("utf-8");
    const frontmatter = parseFrontmatter(content);
    return buildSkill(frontmatter, repo);
  };

  const baseSkillPath = basePath ? `${basePath}/SKILL.md` : "SKILL.md";
  const baseSkill = await fetchSkillFile(baseSkillPath);
  if (baseSkill) {
    skills.push(baseSkill);
  }

  if (!Array.isArray(skillsDir)) {
    return { skills, skillsPath: basePath };
  }

  const skillDirs = skillsDir.filter(
    (item: GitHubContent) => item.type === "dir"
  );

  for (const dir of skillDirs) {
    const skillRoot = basePath ? `${basePath}/${dir.name}` : dir.name;
    const skill = await fetchSkillFile(`${skillRoot}/SKILL.md`);
    if (skill) {
      skills.push(skill);
    }
  }

  if (!skills.length && !hasExplicitPath) {
    const defaultBranch = await fetchDefaultBranch();
    const tree = await getJson(
      `${API_BASE}/repos/${repo.owner}/${repo.repo}/git/trees/${defaultBranch}?recursive=1`,
      headers
    ).catch(() => null);

    const treeItems = (tree as GitHubTreeResponse | null)?.tree ?? [];
    const prefix = basePath ? `${basePath}/` : "";
    const skillPaths = treeItems
      .filter(
        (item) =>
          item.type === "blob" &&
          item.path.endsWith("/SKILL.md") &&
          item.path.startsWith(prefix)
      )
      .map((item) => item.path);

    for (const skillPath of skillPaths) {
      const skill = await fetchSkillFile(skillPath);
      if (skill) {
        skills.push(skill);
      }
    }
  }

  return { skills, skillsPath: basePath };
}

export function parseGitHubRepo(input: string): ParsedRepo | null {
  const trimmed = input.trim().replace(/\.git$/, "");
  const directMatch = /^([\w.-]+)\/([\w.-]+)(?:\/(.+))?$/.exec(trimmed);
  if (directMatch) {
    const rawPath = directMatch[3];
    return {
      owner: directMatch[1],
      repo: directMatch[2],
      skillsPath: rawPath ? resolveSkillsPath(rawPath) : undefined,
    };
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname !== "github.com") {
      return null;
    }
    const parts = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];
    let skillsPath: string | undefined;

    if (parts[2] === "tree" || parts[2] === "blob") {
      const pathSegments = parts.slice(4);
      if (parts[2] === "blob" && pathSegments.length) {
        const last = pathSegments[pathSegments.length - 1];
        if (last.toLowerCase() === "skill.md" || last.includes(".")) {
          pathSegments.pop();
        }
      }
      if (pathSegments.length) {
        skillsPath = resolveSkillsPath(pathSegments.join("/"));
      } else {
        // Explicitly set to undefined when /tree/branch or /blob/branch has no path
        // This ensures the fallback to root directory works correctly
        skillsPath = undefined;
      }
    }

    return { owner, repo, skillsPath };
  } catch {
    return null;
  }
}

function parseFrontmatter(contents: string): SkillFrontmatter {
  const lines = contents.split("\n");
  if (lines[0]?.trim() !== "---") {
    return {};
  }

  const frontmatterLines: string[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "---") {
      break;
    }
    frontmatterLines.push(line);
  }

  return parseYaml(frontmatterLines.join("\n"));
}

function parseYaml(source: string): SkillFrontmatter {
  const result: SkillFrontmatter = {};
  const metadata: Record<string, string> = {};
  let inMetadata = false;

  for (const rawLine of source.split("\n")) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) {
      continue;
    }

    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const line = rawLine.trim();
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (indent === 0) {
      inMetadata = key === "metadata" && value === "";
      if (key === "name") {
        result.name = stripQuotes(value);
      } else if (key === "description") {
        result.description = stripQuotes(value);
      }
    } else if (inMetadata) {
      metadata[key] = stripQuotes(value);
    }
  }

  if (Object.keys(metadata).length) {
    result.metadata = metadata;
  }

  return result;
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseTags(rawTags?: string): string[] {
  if (!rawTags) {
    return [];
  }
  return rawTags
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildAuthor(metadataAuthor: string | undefined, owner: string) {
  if (!metadataAuthor && !owner) {
    return undefined;
  }

  const handle =
    metadataAuthor && /^[\w-]+$/.test(metadataAuthor) ? metadataAuthor : owner;
  const name = metadataAuthor ?? owner;
  const url = metadataAuthor?.startsWith("http")
    ? metadataAuthor
    : `https://github.com/${handle}`;

  return {
    name,
    url,
    avatarUrl: `https://avatars.githubusercontent.com/${handle}`,
  };
}

async function getJson(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "agent-skills",
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}
