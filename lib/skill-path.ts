export function parseSkillId(rawId: string) {
  const decoded = decodeURIComponent(rawId);
  const normalized = decoded.replace(/^\/?skills\//, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }
  const owner = parts[0];
  const repo = parts[1];
  const skillDir = parts.slice(2).join("/");
  return { owner, repo, skillDir };
}

export function resolveSkillsPath(input?: string | null) {
  if (input === undefined || input === null) {
    return "skills";
  }
  const trimmed = input.trim();
  if (trimmed === "") {
    return "";
  }
  if (trimmed === "/" || trimmed === ".") {
    return "";
  }
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function joinSkillsPath(basePath: string, skillDir: string) {
  if (!basePath) {
    return skillDir;
  }
  if (!skillDir) {
    return basePath;
  }
  return `${basePath}/${skillDir}`;
}
