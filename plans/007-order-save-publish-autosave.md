# Plan 007: Prevent autosave from overwriting a just-published draft

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/routes/admin/sites/$siteId.tsx src/server/orpc/routers/site.ts src/server/db/schema.ts src/components/editor/use-history.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-restore-tanstack-typecheck.md`
- **Category**: bug
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/39

## Why this matters

The editor can autosave asynchronously and publish independently. If an older save request finishes after a publish request, the published snapshot can be newer than the draft users see when reopening the editor. The fix should make save/publish ordering explicit so stale writes cannot win.

## Current state

- `src/routes/admin/sites/$siteId.tsx:359` calls `save.mutate(payload(), ...)` for draft persistence.
- `src/routes/admin/sites/$siteId.tsx:368` calls `publish.mutate(payload(), ...)` without waiting for in-flight autosave.
- `src/routes/admin/sites/$siteId.tsx:380` schedules autosave after 1200 ms when dirty.
- `src/server/orpc/routers/site.ts:180` updates `draft`.
- `src/server/orpc/routers/site.ts:197` updates both `draft` and `published`.
- There is no revision, updated-at precondition, request sequence, or cancellation mechanism.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0, new ordering tests pass |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/routes/admin/sites/$siteId.tsx`
- `src/server/orpc/routers/site.ts`
- `src/server/db/schema.ts` and migration if adding a revision column
- Tests for save/publish ordering

**Out of scope**:
- Redesigning editor history.
- Replacing React Query mutation usage wholesale.
- Adding collaborative editing.

## Git workflow

- Branch: `advisor/007-order-save-publish-autosave`
- Commit message: `fix(editor): order autosave and publish writes`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add a failing ordering test

Add a test that simulates:
1. save request with older payload starts;
2. publish request with newer payload succeeds;
3. older save completes after publish;
4. stored draft remains the newer published payload.

If this is easiest at server level, add a revision or timestamp precondition to the router and test that stale saves are rejected or ignored.

**Verify**: `bun run test` -> new test fails before the fix.

### Step 2: Choose the ordering mechanism

Prefer a server-side guard over client-only cancellation. Acceptable designs:
- `draftRevision` integer increments on every accepted draft write; save/publish carries expected revision;
- `updatedAt` precondition checked in the `where` clause;
- publish first awaits or cancels any in-flight save and then writes a monotonic revision.

Do not rely only on React Query `isPending`; network reordering can still happen.

**Verify**: explain the chosen mechanism in a short code comment or test name, then `bunx tsc --noEmit` -> exit 0.

### Step 3: Update client payload handling

If the server uses a revision/precondition, include it in `getDraft` and the editor payload. Update saved state only after accepted writes. If a stale save is rejected, do not show a fatal toast for a harmless stale autosave; refresh or ignore based on server response.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 4: Run ordering tests and regression gates

Run:

```bash
bun run test
bun run lint
bunx tsc --noEmit
```

**Verify**: all exit 0.

## Test plan

Add server tests for stale save after publish. If client behavior is changed materially, add a component or hook-level test for publish while save is pending. Use fake promises/timers rather than real network delays.

## Done criteria

- [ ] Stale draft saves cannot overwrite a newer publish/draft state.
- [ ] User-facing save/publish success messages still occur only after accepted writes.
- [ ] New tests fail on the old code path and pass after the fix.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- The chosen fix requires collaborative editing semantics.
- Adding a revision requires a migration that conflicts with existing migrations.
- It is impossible to test ordering without a broader test harness from Plan 006.

## Maintenance notes

Future autosave, collaborative editing, and offline editing features must preserve monotonic draft writes. Reviewers should check both client behavior and server write preconditions.
