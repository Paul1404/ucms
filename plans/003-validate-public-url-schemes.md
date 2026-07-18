# Plan 003: Validate public URL schemes before publishing

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/lib/blocks.ts src/lib/chrome.ts src/components/blocks/block-view.tsx src/components/blocks/site-chrome.tsx src/components/editor/block-inspector.tsx src/components/editor/chrome-dialog.tsx src/server/orpc/routers/site.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-restore-tanstack-typecheck.md`
- **Category**: security
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/35

## Why this matters

Editors can save arbitrary strings into URL fields that later render directly into public `href` attributes. React escapes text, but it does not turn unsafe URL schemes into safe links. A shared URL validation boundary prevents stored public links from becoming active script/navigation abuse while preserving normal relative, HTTPS, mail, and phone links.

## Current state

- `src/lib/chrome.ts:6` defines `navLinkSchema` with `url: v.optional(v.string(), "")`.
- `src/lib/blocks.ts:94`, `150`, `256`, `273`, and `282` define button/news/social URL fields as plain optional strings.
- `src/components/blocks/block-view.tsx:213`, `387`, `885`, `921`, and `963` render stored values into `href`.
- `src/components/blocks/site-chrome.tsx:33` and `62` render header/footer links into `href`.
- `src/lib/blocks.test.ts` and `src/lib/chrome.test.ts` test schema defaults but not URL scheme validation.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test` | exit 0, new URL tests pass |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/lib/blocks.ts`
- `src/lib/chrome.ts`
- `src/lib/blocks.test.ts`
- `src/lib/chrome.test.ts`
- Optional new helper file under `src/lib/`

**Out of scope**:
- Changing visual editor form layout.
- Rewriting all links to router `Link`.
- Blocking legitimate relative anchors such as `#contact`.

## Git workflow

- Branch: `advisor/003-validate-public-url-schemes`
- Commit message: `fix(security): validate public link urls`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add a shared URL schema/helper

Create a helper in `src/lib/url.ts` or inside existing schema modules if smaller. It should accept:
- empty string;
- relative paths starting with `/`;
- anchors starting with `#`;
- `http:` and `https:`;
- `mailto:` where email links are expected;
- `tel:` where phone links are expected.

It should reject active or ambiguous schemes. Keep error messages user-facing and German if surfaced through Valibot.

**Verify**: `bun run test -- src/lib` -> existing tests still pass or only fail because new tests are not yet added.

### Step 2: Apply the helper to all anchor-producing schemas

Update `navLinkSchema` and block schemas for hero/CTA/button/news/social link fields. If a field is image-only (`imageUrl`, `item.image`, logo URL), do not include it unless you intentionally create a separate image URL policy.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 3: Add schema tests

Add tests that:
- accept `https://example.com`, `/path`, `#contact`, `mailto:info@example.com`, and `tel:+491234`;
- reject unsafe active schemes for header links, hero/CTA/button links, news item links, and social links;
- preserve defaults for `{ links: [{}] }`.

Do not include runnable misuse payloads in comments or test names; name the cases by scheme category.

**Verify**: `bun run test` -> all tests pass and new tests fail if the validation is removed.

### Step 4: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

Use `src/lib/blocks.test.ts` and `src/lib/chrome.test.ts` as the pattern. Keep tests at the schema/helper level so they do not need browser rendering.

## Done criteria

- [ ] All public `href` fields are validated through a shared helper or schema.
- [ ] Tests cover allowed and rejected schemes across chrome and block link fields.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- A required URL field renders into `href` but cannot be validated without changing persisted content shape.
- Existing saved content in tests or defaults uses a scheme outside the allowlist.

## Maintenance notes

When new block types add links, the schema should use the shared URL helper before any renderer consumes the field. Reviewers should reject new direct `v.string()` URL fields that feed public anchors.
