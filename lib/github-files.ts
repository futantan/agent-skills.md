const API_BASE = "https://api.github.com";

export type RepoTreeEntry = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: FileNode[];
};

type RepoInfo = {
  default_branch: string;
};

type RepoTreeResponse = {
  tree: RepoTreeEntry[];
  truncated: boolean;
};

export async function fetchRepoTree(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoTreeEntry[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const repoInfo = await getJson<RepoInfo>(
    `${API_BASE}/repos/${owner}/${repo}`,
    headers
  );
  const treeResponse = await getJson<RepoTreeResponse>(
    `${API_BASE}/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`,
    headers
  );

  if (treeResponse.truncated) {
    throw new Error("Repository tree is too large to fetch.");
  }

  return treeResponse.tree;
}

export async function fetchBlobContent(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<{ content: string; encoding: string; size: number }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return getJson(
    `${API_BASE}/repos/${owner}/${repo}/git/blobs/${sha}`,
    headers
  );
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<{ content?: string; encoding?: string; size: number; type: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return getJson(
    `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    headers
  );
}

export function buildFileTree(entries: RepoTreeEntry[], prefix: string) {
  const normalizedPrefix = prefix.replace(/\/+$/, "");
  const prefixWithSlash = `${normalizedPrefix}/`;
  const rootName = normalizedPrefix.split("/").pop() ?? normalizedPrefix;
  const root: FileNode = {
    name: rootName,
    path: normalizedPrefix,
    type: "dir",
    children: [],
  };

  for (const entry of entries) {
    if (!entry.path.startsWith(prefixWithSlash)) {
      continue;
    }

    const relativePath = entry.path.slice(prefixWithSlash.length);
    if (!relativePath) {
      continue;
    }

    const parts = relativePath.split("/");
    let current = root;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const isLast = index === parts.length - 1;
      const nextPath = `${current.path}/${part}`;
      const children = current.children ?? [];
      current.children = children;

      if (isLast) {
        if (entry.type === "tree") {
          if (!children.some((node) => node.path === nextPath)) {
            children.push({
              name: part,
              path: nextPath,
              type: "dir",
              children: [],
            });
          }
        } else {
          children.push({
            name: part,
            path: nextPath,
            type: "file",
            size: entry.size,
          });
        }
      } else {
        let nextDir = children.find((node) => node.path === nextPath);
        if (!nextDir) {
          nextDir = {
            name: part,
            path: nextPath,
            type: "dir",
            children: [],
          };
          children.push(nextDir);
        }
        current = nextDir;
      }
    }
  }

  sortTree(root);
  return root;
}

function sortTree(node: FileNode) {
  if (!node.children?.length) {
    return;
  }

  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    sortTree(child);
  }
}

async function getJson<T>(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "agent-skills",
      ...headers,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('GitHub API request failed:', {
      url,
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
