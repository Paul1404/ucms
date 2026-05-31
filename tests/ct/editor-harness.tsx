import { useState } from "react";
import { FreeCanvas } from "@/components/editor/free-canvas";
import { type AlignMode, alignFrames, distributeFrames } from "@/lib/arrange";
import { type Block, type Device, getFrame, groupIdsOf, setFrame } from "@/lib/blocks";

// A minimal editor controller around the real FreeCanvas. It mirrors the wiring
// in the site editor (group-aware selection, multi-update, arrange) using the
// same library functions, and renders a plain-DOM readout of state so tests can
// assert against committed frames and selection without parsing scaled styles.
//
// The canvas wrapper is fixed at the desktop design width (1200px) so the canvas
// renders at scale 1 and design coordinates map directly to client pixels.
export function EditorHarness({
  initialBlocks,
  device = "desktop",
  height = 760,
}: {
  initialBlocks: Block[];
  device?: Device;
  height?: number;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedBlocks = blocks.filter((b) => selectedIds.includes(b.id));

  function selectBlock(id: string | null, additive: boolean) {
    if (id === null) {
      setSelectedIds([]);
      return;
    }
    const group = groupIdsOf(blocks, [id]);
    if (additive) {
      const already = selectedIds.includes(id);
      setSelectedIds(
        already
          ? selectedIds.filter((x) => !group.includes(x))
          : Array.from(new Set([...selectedIds, ...group])),
      );
    } else {
      setSelectedIds(group);
    }
  }

  function marqueeSelect(ids: string[], additive: boolean) {
    const expanded = groupIdsOf(blocks, ids);
    setSelectedIds(additive ? Array.from(new Set([...selectedIds, ...expanded])) : expanded);
  }

  function updateBlocks(updated: Block[]) {
    const map = new Map(updated.map((b) => [b.id, b]));
    setBlocks(blocks.map((b) => map.get(b.id) ?? b));
  }

  function updateBlock(updated: Block) {
    setBlocks(blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function patchSelected(fn: (block: Block) => Block) {
    const ids = new Set(selectedIds);
    setBlocks(blocks.map((b) => (ids.has(b.id) ? fn(b) : b)));
  }

  function groupSelected() {
    if (selectedIds.length < 2) return;
    const gid = crypto.randomUUID();
    patchSelected((b) => ({ ...b, group: gid }) as Block);
  }

  function arrange(fn: (frames: ReturnType<typeof getFrame>[]) => ReturnType<typeof getFrame>[]) {
    if (selectedBlocks.length < 2) return;
    const frames = selectedBlocks.map((b) => getFrame(b, device));
    const next = fn(frames);
    const map = new Map(selectedBlocks.map((b, i) => [b.id, next[i]] as const));
    setBlocks(
      blocks.map((b) => {
        const f = map.get(b.id);
        return f ? setFrame(b, device, f) : b;
      }),
    );
  }

  const align = (mode: AlignMode) => arrange((f) => alignFrames(f, mode));

  return (
    <div style={{ position: "relative" }}>
      {/* Controls stay in flow with a fixed height so the canvas never shifts. */}
      <div style={{ height: 32 }}>
        <button
          type="button"
          data-testid="select-all"
          onClick={() => setSelectedIds(blocks.map((b) => b.id))}
        >
          select all
        </button>
        <button type="button" data-testid="group" onClick={groupSelected}>
          group
        </button>
        <button type="button" data-testid="align-left" onClick={() => align("left")}>
          align left
        </button>
        <button
          type="button"
          data-testid="distribute-h"
          onClick={() => arrange((f) => distributeFrames(f, "horizontal"))}
        >
          distribute h
        </button>
      </div>

      {/* State readout, positioned out of flow so selection changes can never
          move the canvas and invalidate coordinates captured by the test. */}
      <div style={{ position: "absolute", top: 0, left: 1210, width: 200 }}>
        <div data-testid="count">{selectedIds.length}</div>
        <div data-testid="selected">{[...selectedIds].sort().join(",")}</div>
        <ul data-testid="readout" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {blocks.map((b) => {
            const f = getFrame(b, device);
            return (
              <li
                key={b.id}
                data-block={b.id}
                data-x={f.x}
                data-y={f.y}
                data-w={f.w}
                data-h={f.h}
                data-group={b.group ?? ""}
                data-selected={selectedIds.includes(b.id)}
              />
            );
          })}
        </ul>
      </div>

      <div data-testid="canvas-wrap" style={{ width: 1200 }}>
        <FreeCanvas
          blocks={blocks}
          device={device}
          height={height}
          selectedIds={selectedIds}
          onSelect={selectBlock}
          onMarquee={marqueeSelect}
          onChangeSingle={updateBlock}
          onChangeMany={updateBlocks}
          onDuplicate={() => {}}
          onDelete={() => {}}
          onToggleHidden={() => {}}
        />
      </div>
    </div>
  );
}
