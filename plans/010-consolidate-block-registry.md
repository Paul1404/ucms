# Plan 010: Consolidate block metadata into a typed registry

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report - do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat fa71eb6..HEAD -- src/lib/blocks.ts src/lib/blocks.test.ts src/components/editor/palette.tsx src/components/blocks/block-view.tsx src/components/editor/block-inspector.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/009-add-block-json-migration-boundary.md`
- **Category**: tech-debt
- **Planned at**: commit `fa71eb6`, 2026-06-24
- **Issue**: https://github.com/Paul1404/ucms/issues/42

## Why this matters

Adding a block requires editing several separate lists: schemas, defaults, labels, sizes, palette order, icons, renderer, inspector, and tests. This has already happened in recent block expansion commits. A typed registry reduces lockstep edits for metadata and makes omissions testable.

## Current state

- `src/lib/blocks.ts:293` manually assembles `blockSchema` with all block schemas.
- `src/lib/blocks.ts:449` has a large `createBlock` switch over all block types.
- `src/lib/blocks.ts:652` defines `BLOCK_LABELS` separately.
- `src/lib/blocks.ts:675` defines `DEFAULT_SIZES` separately.
- `src/lib/blocks.test.ts:27` defines another `ALL_TYPES` list.
- `src/components/editor/palette.tsx` carries palette order/icons separately.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test -- src/lib/blocks.test.ts` | exit 0 |
| All tests | `bun run test` | exit 0 |
| Typecheck | `bunx tsc --noEmit` | exit 0 |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope**:
- `src/lib/blocks.ts`
- `src/lib/blocks.test.ts`
- `src/components/editor/palette.tsx`

**Out of scope**:
- Refactoring `BlockView` rendering switch.
- Refactoring `BlockInspector` field switch.
- Changing persisted block shapes.

## Git workflow

- Branch: `advisor/010-consolidate-block-registry`
- Commit message: `refactor(blocks): derive metadata from registry`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Introduce a registry without changing behavior

Create a `BLOCK_DEFINITIONS` object or array in `src/lib/blocks.ts` that owns for each block type:
- label;
- default size;
- schema;
- default block factory.

Keep TypeScript strict enough that every `BlockType` has a definition and every definition has a valid schema/default.

**Verify**: `bunx tsc --noEmit` -> exit 0.

### Step 2: Derive existing exports from the registry

Derive:
- `blockSchema`;
- `BLOCK_LABELS`;
- `DEFAULT_SIZES`;
- `createBlock`;
- an exported `BLOCK_TYPES` list for tests and palette.

Preserve exported names so callers do not need broad changes.

**Verify**: `bun run test -- src/lib/blocks.test.ts` -> all existing block tests pass.

### Step 3: Update tests and palette to use the registry list

Replace manual `ALL_TYPES` in tests with the exported `BLOCK_TYPES`. In `palette.tsx`, keep UI order either from the registry or from a dedicated registry field. Preserve existing labels and icons.

**Verify**: `bunx tsc --noEmit` and `bun run test -- src/lib/blocks.test.ts` -> both exit 0.

### Step 4: Run final gates

Run:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```

**Verify**: all exit 0.

## Test plan

Existing `src/lib/blocks.test.ts` should prove every type creates a valid block, has a label, and has default sizing. Add one test that `BLOCK_TYPES` matches the registry keys and that no label/size lookup is missing.

## Done criteria

- [ ] No separate manual `ALL_TYPES` test list remains.
- [ ] Labels, default sizes, schema variant, and default factories derive from one registry.
- [ ] Public exported names remain compatible.
- [ ] `bun run lint`, `bunx tsc --noEmit`, and `bun run test` exit 0.

## STOP conditions

Stop and report if:
- Type inference for `Block` becomes materially weaker.
- Registry extraction requires changing `BlockView` or `BlockInspector` in the same plan.
- Persisted block JSON shape changes.

## Maintenance notes

This is a metadata consolidation only. Renderer and inspector decomposition are separate larger refactors and should be done after this registry is stable.
