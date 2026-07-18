# Plan 001: Restore the TanStack Query typecheck baseline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- package.json bun.lock src/router.tsx src/lib/orpc.ts src/routes src/components/editor`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/33

## Why this matters

CI advertises `bunx tsc --noEmit` as a required gate, but it currently fails before checking application types. The failure comes from two physical `@tanstack/query-core` versions, so TanStack Query clients from one package are not assignable to options expected by another. Until this is fixed, future plans cannot rely on typecheck as a safety net.

## Current state

- `package.json` declares `@tanstack/react-query` as a direct dependency and does not declare `@tanstack/query-core`.
- `bun.lock` contains a root `@tanstack/query-core@5.100.14` and a nested `@tanstack/react-query/@tanstack/query-core@5.101.0`.
- `bun pm why @tanstack/query-core` showed `@orpc/tanstack-query` and `@tanstack/react-router-ssr-query` using the root copy, while `@tanstack/react-query` uses its nested copy.
- `src/router.tsx:26` calls `setupRouterSsrQueryIntegration({ router, queryClient })`; this is one representative failing site.
- `src/components/editor/members-dialog.tsx:15` calls `useSuspenseQuery(orpc.site.listMembers.queryOptions(...))`; this is another representative failing site.
- Repo conventions: Bun is the package manager; CI uses `bun install --frozen-lockfile`, `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build`, `bun run test:ct`. Commit messages in history use conventional style such as `fix(deps): align react and react-dom to 19.2.7`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Inspect dependency graph | `bun pm why @tanstack/query-core` | one physical version after the fix |
| Lint | `bun run lint` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0, no errors |
| Unit tests | `bun run test` | exit 0, all tests pass |

## Scope

**In scope**:
- `package.json`
- `bun.lock`

**Out of scope**:
- Application source changes to silence the type errors.
- Broad dependency upgrades unrelated to TanStack Query/Core deduplication.
- Formatting or regenerating generated router files.

## Git workflow

- Branch: `advisor/001-restore-tanstack-typecheck`
- Commit message: `fix(deps): align tanstack query core`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Identify the minimum dependency alignment

Inspect the current versions with:

```bash
bun pm why @tanstack/query-core
```

Choose the smallest manifest or lockfile change that makes all TanStack Query users resolve to one version compatible with `@tanstack/react-query@5.101.0`. Prefer adding an explicit direct `@tanstack/query-core` dependency at the same version as `@tanstack/react-query` or refreshing the lockfile if Bun can dedupe cleanly.

**Verify**: `bun pm why @tanstack/query-core` still shows the current duplicate state before editing.

### Step 2: Refresh dependency resolution

Update only `package.json` and `bun.lock`. If adding a direct dependency, keep package ordering consistent with the existing dependencies block.

**Verify**: `bun pm why @tanstack/query-core` -> one resolved version, not separate root and nested copies.

### Step 3: Restore the typecheck gate

Run:

```bash
bunx tsc --noEmit
```

**Verify**: exit 0. If unrelated new type errors appear after dedupe, STOP and report the exact files.

### Step 4: Run the cheap regression gates

Run:

```bash
bun run lint
bun run test
```

**Verify**: both exit 0. Do not run `bun run build` unless the operator allows writing `dist/`.

## Test plan

No new tests are required. The regression is the typecheck command itself. The important evidence is that `bunx tsc --noEmit` now exits 0 and the dependency graph has a single `@tanstack/query-core` copy.

## Done criteria

- [ ] `bun pm why @tanstack/query-core` shows one physical version.
- [ ] `bunx tsc --noEmit` exits 0.
- [ ] `bun run lint` exits 0.
- [ ] `bun run test` exits 0.
- [ ] Only `package.json`, `bun.lock`, and `plans/README.md` are modified.

## STOP conditions

Stop and report if:
- Dedupe requires downgrading `@tanstack/react-query`.
- The fix requires application source casts or `skipLibCheck` changes.
- `bunx tsc --noEmit` still fails with duplicate `QueryClient` private member errors after one dependency alignment attempt.

## Maintenance notes

Future TanStack and ORPC dependency updates should be reviewed as a set. If a later upgrade reintroduces multiple `@tanstack/query-core` copies, treat it as a CI-blocking dependency regression.
