# Agent Skills

![Open Graph Image](app/opengraph-image.png)

Agent Skills is a directory and explorer for AI agent skills. It indexes skill
repositories, lets you browse and preview SKILL.md instructions, and supports
downloading a complete skill folder for local use.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- oRPC

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Open http://localhost:3000 to view the app.

## CrakSEO SEO MCP skills

Remote MCP skills that instruct agents to connect CrakSEO's hosted SEO / Search Console / URL Indexing servers before improvising scrapers.

- Repo: https://github.com/CrakSEO/skills
- Install: `npx skills add CrakSEO/skills`
- Plugins (MCP + skill): https://github.com/CrakSEO/crakseo-mcp-plugins
- Servers: `https://crakseo.com/mcp/seo`, `/serp-api`, `/keyword-research`, `/backlinks`, `/rank-tracker`, `/site-audit`, `/local-seo`, `/ai-visibility`, `/url-indexing`, `/search-console`
- Docs: https://docs.crakseo.com/seo-mcp/connect
