# Repository Guidelines

## Project Structure & Module Organization

- `app/` contains the Next.js App Router pages, layouts, and route handlers (e.g., `app/api`, `app/rpc`, `app/skills`, `app/submit`).
- `components/` holds shared React components; `components/ui/` contains shadcn-style UI primitives.
- `db/` stores Drizzle ORM schema and DB entry points; generated migrations live in `db/drizzle/`.
- `lib/` houses utilities and helpers shared across the app.
- `public/` includes static assets served by Next.js.
- `env.ts` centralizes runtime environment validation.

## Build, Test, and Development Commands

- `pnpm dev` runs the Next.js dev server with hot reload.
- `pnpm build` creates a production build.
- `pnpm start` serves the production build locally.
- `pnpm lint` runs ESLint with the Next.js config.
- `pnpm format` formats the repo using Prettier.
- `pnpm db:generate` creates Drizzle migration files from schema changes.
- `pnpm db:migrate` applies migrations to the target database.
- `pnpm db:push` pushes schema changes directly to the database.

## Coding Style & Naming Conventions

- TypeScript is used throughout; keep components in `.tsx` and helpers in `.ts`.
- Prefer kebab-case filenames for components (e.g., `site-header.tsx`) and PascalCase for component exports.
- Run `pnpm format` before committing; linting uses `eslint.config.mjs`.
- Tailwind CSS is used for styling; global styles live in `app/globals.css`.

## Testing Guidelines

- No automated test runner is configured in this repo yet.
- If you add tests, introduce a script in `package.json`, document it here, and follow the naming pattern used by the chosen framework (for example `*.test.tsx`).

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits with types like `feat:`, `fix:`, `chore:`, and `refactor:`.
- Pull requests should include: a clear summary, any relevant screenshots for UI changes, and linked issues when applicable.

## Security & Configuration Tips

- Define required environment variables in `.env` and validate them in `env.ts`.
- Avoid committing secrets; use `.env.local` for machine-specific overrides.
