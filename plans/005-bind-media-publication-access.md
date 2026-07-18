# Plan 005: Bind media access to site and publication state

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/server/media.ts src/server/permissions.ts src/server/db/schema.ts src/components/editor/image-field.tsx src/components/editor/block-inspector.tsx src/components/editor/chrome-dialog.tsx src/components/editor/site-settings-dialog.tsx src/routes/admin/sites/$siteId.tsx src/components/blocks/block-view.tsx src/components/blocks/site-chrome.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-harden-svg-media-uploads.md`
- **Category**: security
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/37

## Why this matters

Uploads currently return public `/media/:id` URLs immediately, even for draft, unused, or orphaned media. The upload component does not pass `siteId`, and the server allows nullable site association. The app should allow public access only for media that belongs to published content, while authenticated editors can still preview draft media.

## Current state

- `src/components/editor/image-field.tsx:24` posts `FormData` to `/api/upload` without a `siteId`.
- `src/server/media.ts:34` treats `siteId` as optional.
- `src/server/media.ts:44` only checks `canEditSite` if `siteId` is present.
- `src/server/media.ts:75` serves any media row by ID without auth or publication checks.
- `src/server/db/schema.ts:129` allows `siteId` to be nullable.
- Public rendering references media URLs from block JSON, header logo, and OG image fields.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0, media access tests pass |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/server/media.ts`
- `src/server/db/schema.ts` and migration if needed
- `src/components/editor/image-field.tsx`
- Editor callers that know `siteId`
- Server tests for media access behavior

**Out of scope**:
- Replacing `/media/:id` with CDN URLs.
- Responsive variants.
- Retroactively scanning all existing content unless needed for a narrow compatibility check.

## Git workflow

- Branch: `advisor/005-bind-media-publication-access`
- Commit message: `fix(media): bind access to site publication`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Thread `siteId` through editor uploads

Update `ImageField` to accept an optional required-in-editor `siteId` prop. Pass the route `siteId` from `src/routes/admin/sites/$siteId.tsx` through `BlockInspector`, `ChromeDialog`, and `SiteSettingsDialog` where upload fields are rendered.

When uploading, append `siteId` to the `FormData`.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 2: Require `siteId` on upload

Change `handleUpload` so authenticated uploads without a valid `siteId` are rejected. Keep `canEditSite` enforcement. Store the association on every new media row.

**Verify**: tests for missing site ID fail before implementation and pass after implementation.

### Step 3: Define public media eligibility

Implement one clear rule: media is public if it is referenced by the owning site's published content, published chrome, or published metadata; otherwise it requires an authenticated editor who can edit the associated site.

Prefer a helper such as `canAccessMedia(request, mediaRow)` and a pure helper that checks whether a URL `/media/:id` appears in the published site document.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 4: Add tests

Cover:
- anonymous cannot fetch draft-only media;
- editor can fetch draft media for a site they can edit;
- anonymous can fetch media referenced by published content;
- unrelated member cannot fetch draft media;
- upload without `siteId` is rejected;
- upload with unauthorized `siteId` is rejected.

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

Use request-level tests for `handleUpload` and `handleMedia`. If setting up full DB rows is heavy, isolate the eligibility helper with table-shaped fixtures and add at least one integration-style test that exercises the request handler.

## Done criteria

- [ ] New editor uploads carry `siteId`.
- [ ] Uploads without authorized site association are rejected.
- [ ] Anonymous media access is limited to media referenced by published site data.
- [ ] Authenticated editors can preview draft media for their site.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- Existing persisted media rows without `siteId` must remain publicly accessible and no migration strategy is acceptable.
- The eligibility check requires loading unbounded site rows on every media request without caching or indexing.
- The fix requires changing public media URL format in existing block JSON.

## Maintenance notes

This plan is intentionally conservative. Later performance work may replace app-proxied media with signed URLs or CDN delivery, but it must preserve the same draft-vs-published access rule.
