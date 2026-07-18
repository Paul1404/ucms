# Plan 012: Design site templates and duplication

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- README.md src/server/orpc/routers/site.ts src/lib/blocks.ts src/routes/admin/index.tsx src/server/db/schema.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/009-add-block-json-migration-boundary.md`
- **Category**: direction
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/44

## Why this matters

The app targets small organizations that often need similar pages. Current site creation starts with an empty draft even though block defaults contain rich German starter content. A template or duplicate-site flow could reduce setup time without changing the core editor model.

## Current state

- `README.md` describes a multi-site website builder for clubs, parishes, and local businesses.
- `src/server/orpc/routers/site.ts:143` creates a new empty site with `draft: []`.
- `src/lib/blocks.ts:449` through `648` defines complete default content for each block type.
- `src/routes/admin/index.tsx` is the admin dashboard where site creation lives.
- There is no clone-site, starter-template, or import flow.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Lint | `bun run lint` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- A new design/spike document under `plans/spikes/` or `docs/`
- Optional static JSON examples in the doc only

**Out of scope**:
- Implementing templates.
- Adding UI flows.
- Adding migrations or seeded templates.

## Git workflow

- Branch: `advisor/012-site-templates-duplication-spike`
- Commit message: `docs: design site templates and duplication`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Document existing creation flow

Read `site.create`, dashboard creation UI, and block defaults. Describe what a new site contains today and where starter content already exists.

**Verify**: design doc contains "Current creation flow" with file references.

### Step 2: Compare template approaches

Compare:
- duplicate an existing site;
- built-in starter templates assembled from block defaults;
- import a template JSON file.

For each, list required changes to ORPC, schema, editor UI, media handling, and slug/name behavior.

**Verify**: design doc contains a trade-off table.

### Step 3: Recommend a narrow MVP

Recommend one path, likely "duplicate site" first because it reuses current persisted draft/chrome/media references. Include risks around copied media, published snapshots, ownership, member assignments, and slug uniqueness.

**Verify**: doc has an "MVP recommendation" and "Non-goals" section.

### Step 4: Run docs-friendly gates

Run:

```bash
bun run lint
bunx tsc --noEmit
```

**Verify**: both exit 0.

## Test plan

No production tests are required for the spike. The design doc must specify future tests for clone authorization, unique slug generation, copied draft/chrome content, and media reference behavior.

## Done criteria

- [ ] Design doc explains current creation flow.
- [ ] At least three approaches are compared.
- [ ] One MVP is recommended with non-goals.
- [ ] Future implementation tests are listed.
- [ ] `bun run lint` and `bunx tsc --noEmit` exit 0.

## STOP conditions

Stop and report if:
- Existing product docs reject templates or duplication.
- The only viable MVP requires changing media access semantics before Plan 005.

## Maintenance notes

Do not implement templates from this spike without a follow-up plan. The follow-up should depend on media access and block migration boundaries so cloned content stays valid.
