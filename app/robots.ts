import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/rpc"],
    },
    sitemap: "https://agent-skills.md/sitemap.xml",
  };
}
