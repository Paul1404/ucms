# Plan 009: Add a migration boundary for persisted block JSON

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/lib/blocks.ts src/lib/blocks.test.ts src/server/db/schema.ts src/server/orpc/routers/site.ts src/lib/clipboard.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/006-add-server-auth-site-tests.md`
- **Category**: tech-debt
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/41

## Why this matters

Draft and published content are stored as JSONB typed directly as `Block[]`. New saves are validated, but old persisted JSON is returned directly on read. A read-time migration boundary lets future block schema changes remain compatible with existing sites and gives tests a place to pin old JSON fixtures.

## Current state

- `src/server/db/schema.ts:81` stores `draft` as `jsonb("draft").$type<Block[]>().default([]).notNull()`.
- `src/server/db/schema.ts:82` stores `published` as `Block[] | null`.
- `src/server/orpc/routers/site.ts:74` returns `row.published` directly.
- `src/server/orpc/routers/site.ts:124` returns `row.draft` directly.
- `src/lib/blocks.ts:314` exports `blocksSchema`, but reads do not parse with it.
- `src/lib/clipboard.ts` also persists block JSON locally and can benefit from a shared parser.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0, migration tests pass |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/lib/blocks.ts`
- `src/lib/blocks.test.ts`
- `src/server/orpc/routers/site.ts`
- `src/lib/clipboard.ts` if shared parsing is straightforward

**Out of scope**:
- Reworking all block schemas.
- Database backfill migrations.
- Changing current block JSON shape unless a version wrapper is added in a backward-compatible way.

## Git workflow

- Branch: `advisor/009-add-block-json-migration-boundary`
- Commit message: `feat(blocks): add persisted json migration boundary`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add parser/migration helpers

Create a helper in `src/lib/blocks.ts` or `src/lib/block-migrations.ts`, for example:
- `parsePersistedBlocks(input: unknown): Block[]`;
- `serializePersistedBlocks(blocks: Block[]): Block[]` if no wrapper is needed yet.

For now, support current plain `Block[]` data. Invalid or unknown block entries should be dropped only if that matches product expectations; otherwise throw an explicit error and surface it safely.

**Verify**: `bun run test -- src/lib/blocks.test.ts` -> existing tests still pass.

### Step 2: Add fixture tests

Add tests that parse:
- current block arrays;
- older minimal blocks that rely on optional defaults;
- invalid block data.

Name the version assumptions in test descriptions.

**Verify**: `bun run test -- src/lib/blocks.test.ts` -> new tests pass.

### Step 3: Use the boundary on server reads

Update `getPublished` and `getDraft` to pass stored JSON through the parser before returning it. Keep save/publish input validation as it is unless the serializer helper is needed.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 4: Optionally use the boundary for clipboard reads

If `src/lib/clipboard.ts` currently parses unknown localStorage JSON into `Block[]`, update it to use the same helper so pasted old blocks are normalized consistently. If that creates browser/server import problems, STOP and report rather than duplicating logic.

**Verify**: `bun run test -- src/lib` -> all lib tests pass.

### Step 5: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

Add migration/parser tests in `src/lib/blocks.test.ts`, close to existing schema tests. If server reads are tested by Plan 006, add one fixture where stored JSON lacks optional fields and the returned shape includes defaults.

## Done criteria

- [ ] Server reads no longer return persisted draft/published JSON without a parse/migration boundary.
- [ ] Tests cover current data, older minimal data, and invalid data.
- [ ] Clipboard parsing uses the same boundary or has a documented STOP reason.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- The parser cannot live in shared code because of server/client import cycles.
- Existing persisted data shape is unknown and requires production database samples.
- The desired invalid-data behavior is ambiguous.

## Maintenance notes

Every future block schema change should add a fixture to the migration tests. Reviewers should look for direct returns of JSONB block data and require the migration boundary.
