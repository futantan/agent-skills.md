"use client";

import { client } from "@/lib/api/orpc";
import { FileText, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type FileNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: FileNode[];
};

type FilePreview =
  | {
      kind: "text";
      path: string;
      size: number;
      content: string;
    }
  | {
      kind: "binary" | "too_large";
      path: string;
      size: number;
      maxBytes?: number;
    };

type SkillFilesExplorerProps = {
  skillId: string;
  skillName: string;
};

export function SkillFilesExplorer({
  skillId,
  skillName,
}: SkillFilesExplorerProps) {
  const downloadId = skillId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const [root, setRoot] = useState<FileNode | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadTree = async () => {
      setTreeLoading(true);
      setTreeError(null);
      try {
        const data = (await client.skills.tree({ id: skillId })) as {
          root: FileNode;
        };
        setRoot(data.root);
      } catch (error) {
        if (mounted) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load file tree.";
          setTreeError(message);
        }
      } finally {
        if (mounted) {
          setTreeLoading(false);
        }
      }
    };

    loadTree();
    return () => {
      mounted = false;
    };
  }, [skillId]);

  useEffect(() => {
    if (!root || selectedPath) {
      return;
    }
    const skillFile = findFileByName(root, "SKILL.md");
    if (skillFile) {
      void handleSelectFile(skillFile);
    }
  }, [root, selectedPath]);

  const handleSelectFile = async (node: FileNode) => {
    if (node.type !== "file") {
      return;
    }
    setSelectedPath(node.path);
    setPreview(null);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const data = (await client.skills.file({
        id: skillId,
        path: node.path,
      })) as FilePreview;
      setPreview(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load file preview.";
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl bg-card/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Skill Files</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the full folder contents for {skillName}.
          </p>
        </div>
        <a
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          href={`/api/skills/download/${downloadId}`}
        >
          Download Skill
        </a>
      </div>

      <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[0.6fr_2fr]">
        <div className="rounded-2xl border border-border/50 bg-background/40 p-2 sm:p-3 md:p-4">
          {treeLoading ? (
            <p className="text-sm text-muted-foreground">Loading file tree…</p>
          ) : treeError ? (
            <p className="text-sm text-destructive">{treeError}</p>
          ) : root ? (
            <TreeNode
              node={root}
              depth={0}
              onSelect={handleSelectFile}
              selectedPath={selectedPath}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No files were found for this skill.
            </p>
          )}
        </div>

        <div className="min-w-0">
          {previewLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading file preview…
            </p>
          ) : previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : preview ? (
            <FilePreviewPanel preview={preview} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a file to preview its contents.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type TreeNodeProps = {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedPath: string | null;
};

function TreeNode({ node, depth, onSelect, selectedPath }: TreeNodeProps) {
  const padding = depth === 0 ? "pl-2" : "pl-4";

  if (node.type === "dir") {
    return (
      <details className={`group ${padding}`} open={depth === 0}>
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
          <span className="inline-flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary/70" />
            {node.name}
          </span>
        </summary>
        <div className="mt-2 space-y-2 border-l border-border/40 pl-3">
          {node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      </details>
    );
  }

  const isActive = selectedPath === node.path;
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition ${
        isActive
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
      onClick={() => onSelect(node)}
      type="button"
    >
      <FileText className="h-4 w-4 text-muted-foreground/70" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function FilePreviewPanel({ preview }: { preview: FilePreview }) {
  if (preview.kind === "text") {
    const isMarkdown = preview.path.toLowerCase().endsWith(".md");
    const markdownContent = isMarkdown
      ? stripFrontmatter(preview.content)
      : preview.content;

    return (
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70 sm:mb-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
          <span className="truncate">{preview.path}</span>
        </div>
        {isMarkdown ? (
          <article className="prose prose-neutral max-w-full min-w-0 break-words rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background/80 to-muted/20 p-4 sm:p-5 lg:p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)] lg:prose-xl prose-headings:tracking-tight prose-headings:text-foreground prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-foreground/80 prose-a:text-primary prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-strong:text-foreground prose-code:break-words prose-code:rounded-md prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-pre:rounded-xl prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/30 prose-pre:shadow-inner prose-pre:overflow-x-auto prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:px-4 prose-blockquote:py-2 prose-li:marker:text-primary/60 prose-hr:border-border/60 prose-img:max-w-full prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-th:bg-muted/40 prose-td:border-border/50">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </article>
        ) : (
          <pre className="max-h-130 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl border border-border/40 bg-muted/20 p-4 text-xs leading-relaxed text-foreground">
            {preview.content}
          </pre>
        )}
      </div>
    );
  }

  if (preview.kind === "too_large") {
    return (
      <p className="text-sm text-muted-foreground">
        This file is too large to preview ({formatBytes(preview.size)}).
        Download the folder to view it locally.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      This file is binary ({formatBytes(preview.size)}). Download the folder to
      view it locally.
    </p>
  );
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function stripFrontmatter(value: string) {
  const frontmatterPattern = /^---\s*\n[\s\S]*?\n---\s*\n?/;
  return value.replace(frontmatterPattern, "");
}

function findFileByName(node: FileNode, name: string): FileNode | null {
  if (node.type === "file" && node.name === name) {
    return node;
  }
  if (!node.children?.length) {
    return null;
  }
  for (const child of node.children) {
    const match = findFileByName(child, name);
    if (match) {
      return match;
    }
  }
  return null;
}
