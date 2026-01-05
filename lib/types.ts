import { client } from "@/lib/api/orpc";
import type { InferClientOutputs } from "@orpc/client";

type Outputs = InferClientOutputs<typeof client>;

export type PaginatedSkills = Outputs["skills"]["list"];
export type Skill = Outputs["skills"]["list"]["items"][number];

export type SkillAuthor = {
  name: string;
  url: string;
  avatarUrl: string;
};

export type ParsedSkill = {
  id: string;
  name: string;
  description: string;
  category?: string;
  tags: string[];
  author?: SkillAuthor;
};
