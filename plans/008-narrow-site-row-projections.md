# Plan 008: Narrow site row projections for dashboard and public reads

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/server/orpc/routers/site.ts src/server/db/schema.ts src/routes/admin/index.tsx src/routes/$slug.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: `plans/006-add-server-auth-site-tests.md`
- **Category**: perf
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/40

## Why this matters

The `sites` table stores large JSONB `draft`, `published`, `header`, and `footer` snapshots. Several router paths select whole rows and then return only a small subset. Narrow projections reduce database I/O and memory while keeping response shapes unchanged.

## Current state

- `src/server/orpc/routers/site.ts:52` defines `loadSite` as `db.select().from(sites).where(...).limit(1)`.
- `src/server/orpc/routers/site.ts:71` uses full-row select for public `getPublished`.
- `src/server/orpc/routers/site.ts:92` loads every site with every column for `listMine`.
- `src/server/orpc/routers/site.ts:106` returns only id, slug, name, themeColor, published status, owner status, and updatedAt for the dashboard.
- `src/server/db/schema.ts:81` and `82` hold large JSONB columns.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/server/orpc/routers/site.ts`
- Tests for site router response shapes and authorization

**Out of scope**:
- Database indexes or pagination beyond a small bounded query if already trivial.
- Public route rendering changes.
- Schema migrations.

## Git workflow

- Branch: `advisor/008-narrow-site-row-projections`
- Commit message: `perf(site): narrow site query projections`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add or reuse response-shape tests

Before changing queries, ensure tests cover:
- admin `listMine` sees all sites with the same fields;
- member `listMine` sees owned/member sites only;
- `getPublished` returns the same public shape;
- `getDraft` returns the same editable shape.

If Plan 006 already added these tests, extend those tests rather than duplicating.

**Verify**: `bun run test -- src/server` -> tests pass before query changes.

### Step 2: Split full-row helpers into purpose-specific projections

Replace generic `loadSite` with helpers such as:
- `loadSiteForOwnership(id)` for owner/admin checks;
- `loadDraftSite(id)` for editor response;
- `loadPublishedSite(slug)` for public response;
- `loadSiteSummary` or direct projection for dashboard.

Each helper should select only the fields it returns or needs for authorization.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 3: Move non-admin `listMine` filtering into SQL

Avoid loading all sites then filtering in memory. Use Drizzle joins or predicates to return only sites where the user owns the site or has a matching `siteMembers` row. Preserve admin behavior.

**Verify**: tests for admin, owner, member, outsider list behavior pass.

### Step 4: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

Use server/router tests from Plan 006 as the pattern. The key assertions are response shape and visibility, not exact SQL.

## Done criteria

- [ ] `listMine` no longer calls `db.select().from(sites)` for all columns.
- [ ] `getPublished` does not load draft JSON.
- [ ] `getDraft` does not load published JSON unless needed.
- [ ] Visibility and response-shape tests pass.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- Drizzle cannot express the visibility query without raw SQL and no test coverage exists.
- Existing code relies on full-row objects in a way not captured by tests.

## Maintenance notes

If pagination is added later, keep the projection narrow and apply pagination in SQL. Reviewers should watch for accidental reintroduction of large JSONB reads in list endpoints.
