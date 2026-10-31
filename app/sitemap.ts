import { fetchSitemapSkills } from "@/lib/browse-queries";
import { skillPath } from "@/lib/skill-seo";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://agent-skills.md";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const skills = (await fetchSitemapSkills()).map(({ id, lastModified }) => ({
    url: `${BASE_URL}${skillPath(id)}`,
    lastModified: new Date(lastModified),
  }));
  const lastModified = new Date(
    Math.max(...skills.map((skill) => skill.lastModified.getTime()))
  );

  return [
    { url: `${BASE_URL}/`, lastModified },
    { url: `${BASE_URL}/skills`, lastModified },
    { url: `${BASE_URL}/authors`, lastModified },
    { url: `${BASE_URL}/tags`, lastModified },
    ...skills,
  ];
}
