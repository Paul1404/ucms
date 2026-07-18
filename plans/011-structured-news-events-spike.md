# Plan 011: Design structured news and events collections

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- README.md src/lib/blocks.ts src/components/blocks/block-view.tsx src/components/editor/block-inspector.tsx src/server/db/schema.ts src/server/orpc/routers/site.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/009-add-block-json-migration-boundary.md`
- **Category**: direction
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/43

## Why this matters

README positions ucms for small organizations such as clubs and parishes. Those sites often update news and events repeatedly. Current `news` and `events` blocks embed item arrays directly in block JSON, which is simple but makes recurring updates manual and prevents reuse across pages or feeds.

## Current state

- `README.md` lists events/service times and news as first-class section types.
- `src/lib/blocks.ts:217` defines event items as embedded free-text objects.
- `src/lib/blocks.ts:249` defines news items as embedded objects with optional link/image fields.
- `src/components/editor/block-inspector.tsx` edits these arrays inside the block inspector.
- There are no separate `news` or `events` database tables or ORPC routers.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | exit 0 if any docs import types |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- A new design/spike document under `plans/spikes/` or `docs/` if the repo prefers docs
- Optional proof-of-concept type sketches only if kept out of runtime paths

**Out of scope**:
- Building the feature.
- Adding database migrations.
- Changing current news/events blocks.

## Git workflow

- Branch: `advisor/011-structured-news-events-spike`
- Commit message: `docs: design structured news and events`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Map existing user workflows

Read README and current news/events editor/rendering code. Document the current workflow, including what editors can do today and what is cumbersome.

**Verify**: the design doc contains a "Current workflow" section with file references.

### Step 2: Propose two implementation options

Compare:
- keep embedded arrays and improve editing UX;
- add structured per-site collections for news/events with blocks that query/render those collections.

For each option, list schema changes, ORPC routes, editor UI changes, public rendering behavior, and migration impact.

**Verify**: the design doc contains a trade-off table.

### Step 3: Define a recommended MVP

Recommend one narrow MVP, likely per-site collections plus selector blocks, but only if the evidence supports it. Include open questions such as recurring events, ordering, archives, slugs, and RSS/ICS feeds.

**Verify**: the design doc has an "MVP" section and "Open questions" section.

### Step 4: Run docs-friendly gates

Run:

```bash
bun run lint
bunx tsc --noEmit
```

**Verify**: both exit 0. If the doc-only change does not affect TS, typecheck should still pass after Plan 001.

## Test plan

No production tests are required for a design spike. The doc must specify future tests for collection CRUD, authorization, publish behavior, and public rendering.

## Done criteria

- [ ] A self-contained design/spike doc exists.
- [ ] It cites current code and README evidence.
- [ ] It compares at least two options and recommends an MVP.
- [ ] It lists open questions and future verification needs.
- [ ] `bun run lint` and `bunx tsc --noEmit` exit 0.

## STOP conditions

Stop and report if:
- The maintainer has an existing roadmap or product doc that contradicts this direction.
- A design doc location is unclear and no `docs/` directory exists; use `plans/spikes/` and report the choice.

## Maintenance notes

This is not a build plan. A later implementation plan should be written only after the maintainer accepts the MVP and resolves the open product questions.
