# Plan 013: Design site export and backup packages

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- README.md src/server/db/schema.ts src/server/media.ts src/server/storage.ts src/server/orpc/routers/site.ts src/lib/blocks.ts src/lib/chrome.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/009-add-block-json-migration-boundary.md`, `plans/005-bind-media-publication-access.md`
- **Category**: direction
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/45

## Why this matters

ucms is self-hostable, so operators need confidence that sites can be backed up, moved, or restored. Content is mostly JSONB plus media references, which makes export feasible, but media storage can be S3 or database-backed. A design spike should define a safe export/import boundary before implementation.

## Current state

- `README.md` emphasizes a single Docker image and self-hosted deployment.
- `src/server/db/schema.ts:71` defines site metadata, draft, published content, chrome, heights, and owner.
- `src/server/db/schema.ts:125` defines uploaded media with DB or S3 storage.
- `src/server/media.ts:71` returns `/media/:id` URLs.
- `src/server/storage.ts` abstracts S3 get/put/delete.
- There is no export, import, or backup route.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Lint | `bun run lint` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- A new design/spike document under `plans/spikes/` or `docs/`

**Out of scope**:
- Implementing export/import.
- Adding archive generation dependencies.
- Changing media storage.

## Git workflow

- Branch: `advisor/013-site-export-backup-spike`
- Commit message: `docs: design site export and backup`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Map exportable data

Document which data belongs in a site export:
- site fields;
- draft and published block JSON;
- header/footer;
- media referenced by draft/published/chrome/OG image;
- membership/owner data, likely excluded or mapped.

**Verify**: doc contains a "Data inventory" section with file references.

### Step 2: Define package format options

Compare:
- JSON-only export with external media URLs;
- ZIP/tar package with manifest JSON and media files;
- database-level backup instructions only.

Include compatibility and privacy trade-offs.

**Verify**: doc contains a package format comparison.

### Step 3: Recommend an MVP

Recommend one MVP, likely a per-site ZIP with a manifest and media assets, plus an import dry-run that validates block JSON through the migration boundary. Include open questions about owner mapping, slug conflicts, and large media.

**Verify**: doc includes "MVP recommendation", "Import validation", and "Open questions".

### Step 4: Run docs-friendly gates

Run:

```bash
bun run lint
bunx tsc --noEmit
```

**Verify**: both exit 0.

## Test plan

No production tests are required for the spike. The doc must specify future tests for manifest validation, media inclusion, slug conflict handling, import dry-run, and permission checks.

## Done criteria

- [ ] Design doc inventories exportable data and exclusions.
- [ ] It compares at least three backup/export approaches.
- [ ] It recommends one MVP and lists open questions.
- [ ] Future implementation tests are listed.
- [ ] `bun run lint` and `bunx tsc --noEmit` exit 0.

## STOP conditions

Stop and report if:
- Media access/publication semantics are unresolved and block a meaningful export design.
- Existing deployment docs already define an incompatible backup strategy.

## Maintenance notes

This direction depends on stable block JSON migration and media access rules. Do not implement import until validation can reject incompatible or unsafe package contents.
