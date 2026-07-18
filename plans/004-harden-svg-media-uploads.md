# Plan 004: Stop serving uploaded SVG as same-origin active content

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/server/media.ts src/server/storage.ts src/server/db/schema.ts src/components/editor/image-field.tsx .env.example README.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-restore-tanstack-typecheck.md`
- **Category**: security
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/36

## Why this matters

The upload endpoint accepts SVG and serves uploaded media from the same application origin with the stored MIME type. SVG can contain active content when navigated to directly, and the current validation trusts the browser-provided `File.type`. The safest small fix is to block SVG uploads and add response hardening for served media.

## Current state

- `src/server/media.ts:8` sets `MAX_BYTES = 5 * 1024 * 1024`.
- `src/server/media.ts:9` includes `"image/svg+xml"` in `ALLOWED`.
- `src/server/media.ts:38` checks only `ALLOWED.has(file.type)`.
- `src/server/media.ts:89` and `100` serve the stored MIME type for S3 and DB media.
- `src/components/editor/image-field.tsx:72` uses `accept="image/*"`, so the browser picker may still allow SVG unless adjusted.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/server/media.ts`
- `src/components/editor/image-field.tsx`
- New media tests under `src/server`
- README or `.env.example` only if user-facing upload type documentation exists and needs correction

**Out of scope**:
- Building an SVG sanitizer.
- Rewriting existing stored media rows.
- Responsive image variants; that is a separate plan.

## Git workflow

- Branch: `advisor/004-harden-svg-media-uploads`
- Commit message: `fix(media): block active svg uploads`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Remove SVG from allowed upload MIME types

Update `ALLOWED` and `extFor` so new uploads only accept raster formats the app is prepared to serve safely: PNG, JPEG, WebP, and GIF. Update user-facing error text if needed.

**Verify**: `rg -n 'image/svg\\+xml' src/server/media.ts` -> no match.

### Step 2: Tighten client file picker hints

Change `src/components/editor/image-field.tsx` from broad `accept="image/*"` to explicit raster MIME extensions/types. This is not security enforcement, only user experience; the server remains authoritative.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 3: Add response hardening

Add `X-Content-Type-Options: nosniff` to `/media/:id` responses. If any non-raster media remains possible, set `Content-Disposition: attachment`; otherwise keep inline raster display.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 4: Add request-level tests

Add tests for:
- raster image upload accepted;
- SVG upload rejected by MIME type;
- unsupported MIME rejected;
- media responses include `X-Content-Type-Options: nosniff`.

Mock auth and DB/storage boundaries if needed. Do not add executable misuse samples to tests.

**Verify**: `bun run test` -> all tests pass.

### Step 5: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

Place tests near server media code, for example `src/server/media.test.ts`. If mocking the current module is awkward, extract small pure helpers for MIME validation and headers, test those, and keep request-level coverage for `handleUpload`/`handleMedia` where practical.

## Done criteria

- [ ] New uploads reject SVG.
- [ ] Client upload picker no longer advertises all `image/*`.
- [ ] Media responses include `X-Content-Type-Options: nosniff`.
- [ ] Tests cover accepted raster uploads and rejected SVG uploads.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- Product requirements demand SVG logo upload support.
- Existing tests require SVG upload as a supported behavior.
- The fix requires migration of existing media rows.

## Maintenance notes

If SVG support is reintroduced later, it should be done through sanitization or conversion to an inert raster format, not by restoring same-origin raw SVG serving.
