export type AuthorReference = {
  name?: string | null;
  url?: string | null;
  avatarUrl?: string | null;
};

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

const normalizeSlug = (value: string) => value.trim().toLowerCase();

export const getGitHubUsernameFromUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

  const withScheme =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;

  try {
    const parsed = new URL(withScheme);
    if (!GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    const [username] = parsed.pathname.split("/").filter(Boolean);
    return username ? normalizeSlug(username) : null;
  } catch {
    return null;
  }
};

export const slugifyAuthorName = (name?: string | null): string | null => {
  if (!name) {
    return null;
  }

  const slug = normalizeSlug(name).replace(/[^a-z0-9]+/g, "-");
  const trimmed = slug.replace(/^-+|-+$/g, "");
  return trimmed || null;
};

export const getAuthorSlug = (author: AuthorReference): string | null => {
  return getGitHubUsernameFromUrl(author.url) ?? slugifyAuthorName(author.name);
};

export const getAuthorDisplayName = (author: AuthorReference): string | null => {
  if (author.name?.trim()) {
    return author.name.trim();
  }
  const username = getGitHubUsernameFromUrl(author.url);
  return username ? username : null;
};

export const isAuthorMatch = (
  author: AuthorReference,
  slug: string
): boolean => {
  const normalized = normalizeSlug(slug);
  const username = getGitHubUsernameFromUrl(author.url);
  if (username && normalizeSlug(username) === normalized) {
    return true;
  }
  const nameSlug = slugifyAuthorName(author.name);
  return nameSlug ? normalizeSlug(nameSlug) === normalized : false;
};
