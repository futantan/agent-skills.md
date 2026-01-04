"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/api/orpc";
import { AlertTriangle, CheckCircle2, Github, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

type SubmitStatus = "idle" | "loading" | "success" | "error";

type SubmitResult = {
  repoId: string;
  skillsAdded: number;
  alreadyExists?: boolean;
};

export function SubmitForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const helperText = useMemo(() => {
    if (status === "success" && result) {
      return result.alreadyExists
        ? `${result.repoId} already exists.`
        : `Parsed ${result.skillsAdded} skills from ${result.repoId}.`;
    }
    return "Examples: https://github.com/vercel/ai or vercel/ai.";
  }, [result, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setStatus("error");
      setMessage("Please enter a GitHub repository URL.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    setResult(null);

    try {
      const payload = (await client.repos.submit({
        url: repoUrl,
      })) as SubmitResult;
      setResult(payload);
      setStatus("success");
      setMessage(null);
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Unable to submit repo.";
      setStatus("error");
      setMessage(fallback);
    }
  };

  return (
    <Card className="border border-border/40 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
      <CardHeader className="gap-2 border-b border-border/30">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Repository intake</CardTitle>
        </div>
        <CardDescription>
          We will check the link and add the skills for you.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="repo-url"
            >
              GitHub repository URL
            </label>
            <div className="relative">
              <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 bg-background/70 pl-9"
                disabled={status === "loading"}
                id="repo-url"
                name="repo-url"
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
              />
            </div>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>

          <Button
            className="h-11 w-full"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit repository"
            )}
          </Button>
        </form>

        {status === "error" && message ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{message}</span>
          </div>
        ) : null}

        {status === "success" && result ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">
                {result.alreadyExists
                  ? "Repo already exists."
                  : "Repo captured."}
              </p>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80">
                {result.alreadyExists
                  ? "Submit a different repository to add new skills."
                  : `${result.repoId} added with ${result.skillsAdded} skills.`}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
