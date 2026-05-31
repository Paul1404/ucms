import { Copy, Eye, EyeOff, Move, Trash2 } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { BlockView, CanvasModeContext } from "@/components/blocks/block-view";
import { framePosition, frameVisual } from "@/components/blocks/canvas-view";
import { framesIntersect } from "@/lib/arrange";
import {
  type Block,
  BREAKPOINTS,
  type Device,
  type Frame,
  GRID,
  getFrame,
  setFrame,
  snap,
} from "@/lib/blocks";
import { cn } from "@/lib/utils";

// Threshold (in design pixels) within which edges snap to a smart guide.
const SNAP_T = 6;
// Pointer travel (in client pixels) before a press on empty canvas becomes a
// marquee rather than a click-to-deselect.
const MARQUEE_T = 4;

interface Props {
  blocks: Block[];
  device: Device;
  height: number;
  selectedIds: string[];
  onSelect: (id: string | null, additive: boolean) => void;
  onMarquee: (ids: string[], additive: boolean) => void;
  // Inline text edits commit a single block; drag/resize commit one or more.
  onChangeSingle: (block: Block) => void;
  onChangeMany: (blocks: Block[]) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
}

type BlockDrag = {
  kind: "block";
  mode: "move" | "resize";
  primary: string;
  ids: string[];
  startX: number;
  startY: number;
  origs: Map<string, Frame>;
  vlines: number[];
  hlines: number[];
  moved: boolean;
  // When a click (no drag) lands on a block that was already part of a larger
  // selection, collapse the selection down to just that block on pointer-up.
  collapse: boolean;
};

type MarqueeDrag = {
  kind: "marquee";
  startX: number;
  startY: number;
  additive: boolean;
  moved: boolean;
};

type DragState = BlockDrag | MarqueeDrag;
type Guides = { x: number[]; y: number[] };
type Rect = { x: number; y: number; w: number; h: number };

// Snap a set of anchor positions to the nearest guide line, returning the
// shift to apply and the line that matched (for drawing the guide).
function nearestSnap(anchors: number[], lines: number[]): { delta: number; line: number } | null {
  let best: { delta: number; line: number } | null = null;
  for (const a of anchors) {
    for (const l of lines) {
      const d = l - a;
      if (Math.abs(d) <= SNAP_T && (!best || Math.abs(d) < Math.abs(best.delta))) {
        best = { delta: d, line: l };
      }
    }
  }
  return best;
}

// Interactive free-form canvas for one breakpoint. Blocks are absolutely
// positioned; drag the move grip to reposition and the corner handle to resize.
// Shift-click adds to the selection, and dragging on empty canvas draws a
// marquee. Edges snap to other blocks and the canvas center with smart guides.
// Edits commit to history only on pointer-up so a drag is a single undo step.
export function FreeCanvas({
  blocks,
  device,
  height,
  selectedIds,
  onSelect,
  onMarquee,
  onChangeSingle,
  onChangeMany,
  onDuplicate,
  onDelete,
  onToggleHidden,
}: Props) {
  const designWidth = BREAKPOINTS[device].width;
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(designWidth);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const scale = Math.min(1, width / designWidth);

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;

  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<Map<string, Frame> | null>(null);
  const [preview, setPreview] = useState<Map<string, Frame> | null>(null);
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const marqueeRef = useRef<Rect | null>(null);
  marqueeRef.current = marquee;

  // Translate a client point into design-space coordinates on the canvas.
  function toDesign(clientX: number, clientY: number): { x: number; y: number } {
    const rect = boxRef.current?.getBoundingClientRect();
    const s = scaleRef.current;
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / s, y: (clientY - rect.top) / s };
  }

  // The ids that move when a given block is dragged: the whole selection if the
  // block is part of it, otherwise the block's own group (or just itself).
  function dragSet(id: string): string[] {
    if (selectedRef.current.includes(id)) return selectedRef.current;
    const b = blocksRef.current.find((x) => x.id === id);
    if (b?.group) return blocksRef.current.filter((x) => x.group === b.group).map((x) => x.id);
    return [id];
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers read refs and listed deps; toDesign only reads refs
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;

      if (d.kind === "marquee") {
        const a = toDesign(d.startX, d.startY);
        const b = toDesign(e.clientX, e.clientY);
        if (
          Math.abs(e.clientX - d.startX) > MARQUEE_T ||
          Math.abs(e.clientY - d.startY) > MARQUEE_T
        )
          d.moved = true;
        setMarquee({
          x: Math.min(a.x, b.x),
          y: Math.min(a.y, b.y),
          w: Math.abs(a.x - b.x),
          h: Math.abs(a.y - b.y),
        });
        return;
      }

      const dx = (e.clientX - d.startX) / scaleRef.current;
      const dy = (e.clientY - d.startY) / scaleRef.current;
      if (Math.abs(e.clientX - d.startX) > MARQUEE_T || Math.abs(e.clientY - d.startY) > MARQUEE_T)
        d.moved = true;
      const activeX: number[] = [];
      const activeY: number[] = [];
      const next = new Map<string, Frame>();

      if (d.mode === "move") {
        const o = d.origs.get(d.primary);
        if (!o) return;
        let x = Math.max(0, o.x + dx);
        let y = Math.max(0, o.y + dy);
        const sx = nearestSnap([x, x + o.w / 2, x + o.w], d.vlines);
        const sy = nearestSnap([y, y + o.h / 2, y + o.h], d.hlines);
        if (sx) {
          x += sx.delta;
          activeX.push(sx.line);
        } else {
          x = snap(x);
        }
        if (sy) {
          y += sy.delta;
          activeY.push(sy.line);
        } else {
          y = snap(y);
        }
        // Shift every dragged frame by the primary's snapped delta so the group
        // keeps its relative layout.
        const ddx = x - o.x;
        const ddy = y - o.y;
        for (const [id, of] of d.origs) {
          next.set(id, { ...of, x: Math.max(0, of.x + ddx), y: Math.max(0, of.y + ddy) });
        }
      } else {
        const o = d.origs.get(d.primary);
        if (!o) return;
        let w = Math.max(GRID * 6, o.w + dx);
        let h = Math.max(GRID * 4, o.h + dy);
        const sx = nearestSnap([o.x + w], d.vlines);
        const sy = nearestSnap([o.y + h], d.hlines);
        if (sx) {
          w += sx.delta;
          activeX.push(sx.line);
        } else {
          w = snap(w);
        }
        if (sy) {
          h += sy.delta;
          activeY.push(sy.line);
        } else {
          h = snap(h);
        }
        next.set(d.primary, { ...o, w: Math.max(GRID * 6, w), h: Math.max(GRID * 4, h) });
      }

      previewRef.current = next;
      setPreview(new Map(next));
      setGuides({ x: activeX, y: activeY });
    }

    function onUp() {
      const d = dragRef.current;
      dragRef.current = null;

      if (d?.kind === "marquee") {
        if (d.moved && marqueeRef.current) {
          const r = marqueeRef.current;
          const ids = blocksRef.current
            .filter((b) => !b.style?.hidden && framesIntersect(getFrame(b, device), r))
            .map((b) => b.id);
          onMarquee(ids, d.additive);
        } else if (!d.moved) {
          onSelect(null, false);
        }
        setMarquee(null);
        return;
      }

      if (d?.kind === "block") {
        const p = previewRef.current;
        if (d.moved && p) {
          const updated: Block[] = [];
          for (const [id, frame] of p) {
            const block = blocksRef.current.find((b) => b.id === id);
            if (block) updated.push(setFrame(block, device, frame));
          }
          if (updated.length) onChangeMany(updated);
        } else if (!d.moved && d.collapse) {
          // A plain click inside a multi-selection narrows it to this block.
          onSelect(d.primary, false);
        }
      }
      previewRef.current = null;
      setPreview(null);
      setGuides({ x: [], y: [] });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onChangeMany, onMarquee, onSelect, device]);

  function startDrag(e: React.PointerEvent, block: Block, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();

    // Shift-click toggles membership without starting a drag.
    if (mode === "move" && e.shiftKey) {
      onSelect(block.id, true);
      return;
    }

    const wasSelected = selectedRef.current.includes(block.id);
    const ids = dragSet(block.id);
    // Select on press so a drag moves the block immediately. If it was already
    // part of a larger selection, defer narrowing until pointer-up (a click).
    if (!wasSelected) onSelect(block.id, false);
    const collapse = mode === "move" && wasSelected && selectedRef.current.length > 1;

    const moving = new Set(ids);
    const vlines = new Set<number>([0, designWidth / 2, designWidth]);
    const hlines = new Set<number>([0, height / 2, height]);
    for (const b of blocksRef.current) {
      if (moving.has(b.id) || b.style?.hidden) continue;
      const f = getFrame(b, device);
      vlines
        .add(f.x)
        .add(f.x + f.w / 2)
        .add(f.x + f.w);
      hlines
        .add(f.y)
        .add(f.y + f.h / 2)
        .add(f.y + f.h);
    }
    const origs = new Map<string, Frame>();
    for (const id of ids) {
      const b = blocksRef.current.find((x) => x.id === id);
      if (b) origs.set(id, getFrame(b, device));
    }
    dragRef.current = {
      kind: "block",
      mode,
      primary: block.id,
      ids,
      startX: e.clientX,
      startY: e.clientY,
      origs,
      vlines: [...vlines],
      hlines: [...hlines],
      moved: false,
      collapse,
    };
  }

  function startMarquee(e: React.PointerEvent) {
    // Only the empty backdrop starts a marquee; blocks stop propagation.
    if (e.button !== 0) return;
    dragRef.current = {
      kind: "marquee",
      startX: e.clientX,
      startY: e.clientY,
      additive: e.shiftKey,
      moved: false,
    };
  }

  const ordered = [...blocks].sort(
    (a, b) => (getFrame(a, device).z ?? 1) - (getFrame(b, device).z ?? 1),
  );
  const primaryId = selectedIds[0];
  const selectedSet = new Set(selectedIds);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        ref={boxRef}
        className="relative mx-auto overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
        style={{
          width: designWidth * scale,
          height: height * scale,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: `${GRID * 3 * scale}px ${GRID * 3 * scale}px`,
        }}
        onPointerDown={startMarquee}
      >
        <div
          style={{
            width: designWidth,
            height,
            position: "relative",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CanvasModeContext.Provider value={true}>
            {ordered.map((block) => {
              const f = preview?.get(block.id) ?? getFrame(block, device);
              const selected = selectedSet.has(block.id);
              const isPrimary = block.id === primaryId;
              const hidden = Boolean(block.style?.hidden);
              const posStyle: CSSProperties = {
                ...framePosition(f),
                ...frameVisual(block),
                opacity: hidden ? 0.4 : (frameVisual(block).opacity ?? 1),
              };
              return (
                <div
                  key={block.id}
                  style={posStyle}
                  onPointerDown={(e) => startDrag(e, block, "move")}
                  className={cn(
                    "group outline-offset-2",
                    selected
                      ? "outline outline-2 outline-[var(--color-primary)]"
                      : "outline outline-1 outline-transparent hover:outline-[var(--color-primary)]/40",
                  )}
                >
                  <div className="h-full w-full overflow-hidden">
                    <BlockView block={block} edit={{ onChange: onChangeSingle }} />
                  </div>

                  {isPrimary ? (
                    <>
                      <div
                        data-no-drag
                        className="absolute -top-9 left-0 z-50 flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-0.5 shadow-md"
                      >
                        <button
                          type="button"
                          aria-label="Verschieben"
                          title="Verschieben"
                          onPointerDown={(e) => startDrag(e, block, "move")}
                          className="cursor-grab rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                        >
                          <Move className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={hidden ? "Einblenden" : "Ausblenden"}
                          title={hidden ? "Einblenden" : "Ausblenden"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleHidden();
                          }}
                          className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                        >
                          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                        <button
                          type="button"
                          aria-label="Duplizieren"
                          title="Duplizieren"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate();
                          }}
                          className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Löschen"
                          title="Löschen"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                          }}
                          className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)] hover:text-white"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {/* Resize handle, only when a single block is selected */}
                      {selectedIds.length === 1 ? (
                        <div
                          data-no-drag
                          onPointerDown={(e) => startDrag(e, block, "resize")}
                          className="absolute -bottom-1.5 -right-1.5 z-50 size-4 cursor-nwse-resize rounded-sm border-2 border-[var(--color-primary)] bg-[var(--color-background)]"
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}

            {/* Marquee rectangle */}
            {marquee ? (
              <div
                className="pointer-events-none absolute z-[70] border border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
              />
            ) : null}

            {/* Smart alignment guides */}
            {guides.x.map((x) => (
              <div
                key={`vx-${x}`}
                className="pointer-events-none absolute top-0 z-[60] w-px bg-pink-500"
                style={{ left: x, height }}
              />
            ))}
            {guides.y.map((y) => (
              <div
                key={`hy-${y}`}
                className="pointer-events-none absolute left-0 z-[60] h-px bg-pink-500"
                style={{ top: y, width: designWidth }}
              />
            ))}
          </CanvasModeContext.Provider>
        </div>
      </div>
    </div>
  );
}
