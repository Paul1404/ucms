# Plan 002: Make setup and invite account creation transactional

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/server/auth.ts src/server/orpc/routers/users.ts src/server/db/schema.ts src/routes/setup.tsx src/routes/admin/users.tsx src/lib/auth-client.ts src/lib/session.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-restore-tanstack-typecheck.md`
- **Category**: security
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/34

## Why this matters

The app promises that the first account becomes administrator and public sign-up closes afterward. Today that logic is implemented with a process-global invite flag and a count-before-create check, so concurrent setup requests can create multiple admins and an unrelated public sign-up can race during an admin invite. The fix should move account creation authorization to a server-controlled, database-backed path with tests.

## Current state

- `src/server/auth.ts:13` defines `let invitationInProgress = false`.
- `src/server/auth.ts:15` exposes `withInvitation(fn)` which flips that flag around an async call.
- `src/server/auth.ts:66` counts users inside the Better Auth `user.create.before` hook.
- `src/server/auth.ts:69` allows non-first account creation whenever `invitationInProgress` is true.
- `src/server/db/schema.ts:17` sets `role: text("role").default("admin").notNull()`.
- `src/server/orpc/routers/users.ts:45` uses `withInvitation(() => auth.api.signUpEmail(...))`.
- `src/routes/setup.tsx:43` uses public client-side `signUp.email(...)` for first setup.
- There are no server tests for first setup, second signup rejection, invite role assignment, or concurrent setup.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Unit tests | `bun run test` | exit 0, including new auth tests |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/server/auth.ts`
- `src/server/orpc/routers/users.ts`
- `src/server/orpc/routers/meta.ts` if setup flow needs a server procedure
- `src/server/db/schema.ts`
- `src/routes/setup.tsx`
- `src/routes/admin/users.tsx` only if the client call shape must change
- New tests under `src/server/**/*.test.ts`

**Out of scope**:
- Adding social login or email delivery.
- Changing password policy except where Better Auth already enforces it.
- Redesigning the admin UI.

## Git workflow

- Branch: `advisor/002-transactional-account-creation`
- Commit message: `fix(auth): serialize setup and invite signups`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add characterization tests for current desired behavior

Create server-side tests that cover:
- first account becomes `admin`;
- second public signup is rejected;
- admin invite creates a `member`;
- non-admin cannot invite;
- two concurrent setup attempts cannot both create admin accounts.

Use a disposable database or explicit mocks around Better Auth/Drizzle. If the repo has no existing server test harness, create the smallest harness needed under `src/server`.

**Verify**: `bun run test` -> tests run and fail only for the concurrency/race behavior being fixed, not because of harness errors.

### Step 2: Remove the process-global authorization flag

Delete the `invitationInProgress` authorization mechanism from `src/server/auth.ts`. Replace it with explicit server-side intent:
- setup path: only allowed when no user exists, guarded by a transaction or database-level invariant;
- invite path: only callable by an admin procedure, creates a member without opening public signup.

If Better Auth hooks cannot express this safely, create explicit ORPC procedures that call Better Auth with a server-only marker that cannot be influenced by other requests. Do not use module-global mutable state for authorization.

**Verify**: `rg -n "invitationInProgress|withInvitation" src` -> no matches except deleted history.

### Step 3: Make the database default role safe

Change the users table default role from `admin` to `member` unless the final design proves the Better Auth hook always writes a role explicitly. If this requires a Drizzle migration, generate or write the migration consistent with existing `drizzle/` files.

**Verify**: `rg -n 'default\\("admin"\\)' src/server/db/schema.ts drizzle` -> no live default-admin role for users.

### Step 4: Wire setup and invite callers to the safer API

Update `src/routes/setup.tsx` to call the explicit setup endpoint if public `signUp.email` is no longer safe. Update `src/server/orpc/routers/users.ts` to use the new invite path. Preserve German UI messages and existing form behavior.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 5: Run full cheap verification

Run:

```bash
bun run lint
bun run test
bunx tsc --noEmit
```

**Verify**: all exit 0.

## Test plan

Model test style after `src/lib/*.test.ts`: Vitest `describe/it`, direct assertions, no snapshots. Add server tests for setup/invite/session role behavior and concurrency. The tests should assert role values in storage, not just response messages.

## Done criteria

- [ ] No module-global boolean controls invite or setup authorization.
- [ ] User default role is not `admin` unless an explicit documented invariant makes it safe.
- [ ] Tests cover first signup, second public signup rejection, invited member creation, and concurrent setup.
- [ ] `bun run lint`, `bun run test`, and `bunx tsc --noEmit` exit 0.

## STOP conditions

Stop and report if:
- Better Auth cannot create invited users without a global hook bypass.
- A safe fix requires changing Better Auth table shape beyond the `users.role` default.
- Tests require a real persistent database that is not available in the executor environment.

## Maintenance notes

Reviewers should scrutinize cross-request behavior, not just happy-path forms. Any future auth provider or invite feature must preserve the invariant that public signup is closed after setup and that invite authority is bound to the authenticated admin request.
