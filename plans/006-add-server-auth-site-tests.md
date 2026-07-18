# Plan 006: Add server auth and site authorization test coverage

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- vitest.config.ts src/server/auth.ts src/server/permissions.ts src/server/orpc/base.ts src/server/orpc/routers/site.ts src/server/orpc/routers/users.ts src/server/db/schema.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-restore-tanstack-typecheck.md`
- **Category**: tests
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/38

## Why this matters

The riskiest server behavior is authentication, role exposure, site membership, and publish/delete authorization. Current tests focus on block utilities and canvas behavior, so auth regressions can slip through even though they affect data exposure and admin control. This plan establishes a server test harness and covers the rules that later security changes depend on.

## Current state

- `vitest.config.ts:6` includes only `src/**/*.test.ts`.
- Existing unit tests live mainly under `src/lib`.
- `src/server/permissions.ts:12` implements `canEditSite`.
- `src/server/orpc/base.ts:14` and `30` implement protected/admin procedure middleware.
- `src/server/orpc/routers/site.ts:91` through `308` implements list, draft, save, publish, delete, and membership rules.
- There is no `src/server/permissions.test.ts`, `src/server/orpc/routers/site.test.ts`, or auth/setup server test.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0, new server tests pass |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- New tests under `src/server`
- Small test-only helpers under `src/server` or `src/test` if needed
- Minimal dependency injection seams if absolutely required for testability

**Out of scope**:
- Changing production authorization behavior except where a test exposes an obvious bug.
- Adding E2E browser auth tests.
- Replacing Better Auth.

## Git workflow

- Branch: `advisor/006-add-server-auth-site-tests`
- Commit message: `test(server): cover auth and site authorization`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Choose and document the server test strategy

Prefer direct Vitest tests that exercise pure helpers and router handlers with controlled context. If direct handler invocation is blocked by ORPC internals, test the underlying helper functions and add a small integration seam.

**Verify**: create one minimal server test and run `bun run test -- src/server` -> it executes under the existing Vitest config.

### Step 2: Test `canEditSite`

Cover:
- admin can edit any site;
- owner can edit own site;
- member can edit assigned site;
- unrelated member cannot edit;
- missing site returns false for non-admin.

**Verify**: `bun run test -- src/server/permissions.test.ts` -> all tests pass.

### Step 3: Test site router authorization behavior

Cover role cases for:
- `listMine`;
- `getDraft`;
- `save`;
- `publish`;
- `remove`;
- `listMembers`;
- `addMember`;
- `removeMember`.

Assertions should verify both allowed and forbidden paths. Use explicit fixture names such as admin, owner, editor, outsider.

**Verify**: `bun run test -- src/server` -> all server tests pass.

### Step 4: Test setup/session role behavior if feasible

Add focused tests for first signup role, second public signup rejection, invited member role, and session role exposure. If Better Auth cannot be isolated without a real database, write a short `TESTING.md` note inside the test file comment and STOP rather than adding brittle tests.

**Verify**: `bun run test -- src/server` -> all server tests pass, or STOP with the exact blocker.

### Step 5: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

The test files are the deliverable. Follow existing Vitest style from `src/lib/blocks.test.ts`: clear fixtures, direct expectations, no snapshots.

## Done criteria

- [ ] `canEditSite` has explicit role/ownership/membership tests.
- [ ] Site router authorization has allowed and forbidden tests for critical procedures.
- [ ] Auth/setup/session behavior is tested or a concrete STOP reason is reported.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- Testing router handlers requires changing production behavior broadly.
- A real database is required but not available in the executor environment.
- Tests can only pass by mocking the function under test itself.

## Maintenance notes

These tests should land before major auth, media, or membership refactors. Reviewers should check that tests assert behavior and not implementation details such as exact SQL strings.
