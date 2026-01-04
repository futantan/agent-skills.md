import { resolveSkillsPath } from "@/lib/skill-path";
import { Skill } from '@/lib/types';

type ParsedRepo = {
  owner: string;
  repo: string;
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

type GitHubContent = {
  type: "file" | "dir";
  name: string;
  path: string;
  content?: string;
};

const API_BASE = "https://api.github.com";

export async function fetchSkillsFromRepo(
  repoInput: string,
  options: FetchOptions = {}
): Promise<Skill[]> {
  const repo = parseGitHubRepo(repoInput);
  if (!repo) {
    throw new Error("Invalid GitHub repository URL");
  }

  const headers = options.token
    ? { Authorization: `Bearer ${options.token}` }
    : undefined;

  const basePath = resolveSkillsPath(options.skillsPath);
  const basePathSegment = basePath ? `/${basePath}` : "";
  const skillsDir = await getJson(
    `${API_BASE}/repos/${repo.owner}/${repo.repo}/contents${basePathSegment}`,
    headers
  );

  if (!Array.isArray(skillsDir)) {
    return [];
  }

  const skillDirs = skillsDir.filter(
    (item: GitHubContent) => item.type === "dir"
  );

  const skills: Skill[] = [];

  for (const dir of skillDirs) {
    const skillRoot = basePath ? `${basePath}/${dir.name}` : dir.name;
    const skillFile = await getJson(
      `${API_BASE}/repos/${repo.owner}/${repo.repo}/contents/${skillRoot}/SKILL.md`,
      headers
    ).catch(() => null);

    if (!skillFile || skillFile.type !== "file" || !skillFile.content) {
      continue;
    }

    const content = Buffer.from(skillFile.content, "base64").toString("utf-8");
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter.name || !frontmatter.description) {
      continue;
    }

    skills.push({
      id: `${repo.owner}/${repo.repo}/${frontmatter.name}`,
      name: frontmatter.name,
      description: frontmatter.description,
      category: frontmatter.metadata?.category ?? "Uncategorized",
      tags: parseTags(frontmatter.metadata?.tags),
      author: buildAuthor(frontmatter.metadata?.author, repo.owner),
    });
  }

  return skills;
}

export function parseGitHubRepo(input: string): ParsedRepo | null {
  const trimmed = input.trim().replace(/\.git$/, "");
  const directMatch = /^([\w.-]+)\/([\w.-]+)$/.exec(trimmed);
  if (directMatch) {
    return { owner: directMatch[1], repo: directMatch[2] };
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname !== "github.com") {
      return null;
    }
    const parts = url.pathname.replace(/^\/+/, "").split("/");
    if (parts.length < 2) {
      return null;
    }
    return { owner: parts[0], repo: parts[1] };
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
