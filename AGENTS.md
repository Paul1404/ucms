# Repository guidance

This is the canonical instruction file for this repository. Claude Code loads it through
`CLAUDE.md`.

## Start here

- Inspect branch, upstream divergence, status, and diff before editing.
- Preserve pre-existing changes and keep unrelated work out of the patch.
- Use the repository's existing runtime, package manager, framework, and deployment model.
- Do not refactor an existing project into the preferred new-project stack unless explicitly requested.
- Verify current documentation before changing version-dependent dependencies or hosting behavior.

## Project

uCMS is a multi-site visual website builder for small organizations.

It uses Bun, TanStack Start, React, oRPC, better-auth, Drizzle, PostgreSQL, Tailwind CSS, Docker, and Railway.

## Project rules

- Keep site authorization server-side. Editors may access only assigned sites.
- Preserve draft and published states, undo history, and unsaved-change protection.
- Treat S3 uploads and database fallback storage as recoverable side effects.
- Never edit `src/routeTree.gen.ts` or generated migrations manually.
- Use Bun and preserve the current architecture.

## Commands

- `bun run lint`: Biome validation
- `bun run test`: tests
- `bun run build`: production build
- `bun run db:generate`: generate migrations

## Verification

Run the relevant checks and exercise the affected workflow, endpoint, or generated artifact.
State clearly when authenticated, database, deployment, or live verification was not possible.

## Maintaining instructions

Update `AGENTS.md` when verified, durable repository behavior changes. Keep it concise and
move detailed explanations into `docs/`. Keep `CLAUDE.md` as the compatibility import
unless Claude-specific guidance is genuinely required.
