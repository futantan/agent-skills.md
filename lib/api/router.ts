import { agentSkills } from "@/lib/skills";
import { os } from "@orpc/server";
import * as z from "zod";

const SkillAuthorSchema = z
  .object({
    name: z.string(),
    url: z.string().url().optional(),
    avatarUrl: z.string().url().optional(),
  })
  .optional();

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()),
  author: SkillAuthorSchema,
});

const listSkills = os.handler(async () => {
  return agentSkills;
});

const findSkill = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const skill = agentSkills.find((item) => item.id === input.id);
    return skill ?? null;
  });

export const router = {
  skills: {
    list: listSkills,
    find: findSkill,
  },
};
