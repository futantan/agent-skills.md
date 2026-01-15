import { Card } from "@/components/ui/card";
import { Skill } from "@/lib/types";
import { GitFork, Star } from "lucide-react";
import Link from "next/link";

interface SkillCardProps {
  skill: Skill;
  index: number;
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const repoStars = skill.repoStars ?? 0;
  const repoForks = skill.repoForks ?? 0;

  return (
    <Link
      className="group block h-full"
      href={`/skills/${skill.id}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Card className="relative h-full overflow-hidden border border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up">
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
            {skill.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-4">
            {skill.description}
          </p>
        </div>

        {skill.tags.length > 0 && (
          <div className="flex h-16 flex-wrap gap-2 ">
            {skill.tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/40 pt-4">
          <div className="flex flex-col gap-2">
            {skill.authorName ? (
              <div className="flex items-center gap-3">
                {skill.authorAvatarUrl ? (
                  <img
                    alt={skill.authorName}
                    className="h-8 w-8 rounded-full border border-border/60 object-cover"
                    src={skill.authorAvatarUrl}
                  />
                ) : null}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {skill.authorName}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                No author info
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {repoStars.toLocaleString()}
            </span>
            {repoForks > 0 ? (
              <span className="inline-flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5" />
                {repoForks.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </Link>
  );
}
