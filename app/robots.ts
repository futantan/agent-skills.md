import type { MetadataRoute } from "next";


export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://agent-skills.md/sitemap.xml",
  };
}
