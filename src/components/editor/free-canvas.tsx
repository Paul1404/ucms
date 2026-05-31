import { Copy, Eye, EyeOff, Move, Trash2 } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { BlockView, CanvasModeContext } from "@/components/blocks/block-view";
import { framePosition, frameVisual } from "@/components/blocks/canvas-view";
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

interface Props {
  blocks: Block[];
  device: Device;
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (block: Block) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  orig: Frame;
  vlines: number[];
  hlines: number[];
};

type Guides = { x: number[]; y: number[] };

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
// Edges snap to other blocks and the canvas center with smart guides. Edits
// commit to history only on pointer-up so a drag is a single undo step.
export function FreeCanvas({
  blocks,
  device,
  height,
  selectedId,
  onSelect,
  onChange,
  onDuplicate,
  onDelete,
}: Props) {
  const designWidth = BREAKPOINTS[device].width;
  const wrapRef = useRef<HTMLDivElement>(null);
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

  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{ id: string; frame: Frame } | null>(null);
  const [preview, setPreview] = useState<{ id: string; frame: Frame } | null>(null);
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / scaleRef.current;
      const dy = (e.clientY - d.startY) / scaleRef.current;
      const activeX: number[] = [];
      const activeY: number[] = [];
      let frame: Frame;

      if (d.mode === "move") {
        let x = Math.max(0, d.orig.x + dx);
        let y = Math.max(0, d.orig.y + dy);
        const sx = nearestSnap([x, x + d.orig.w / 2, x + d.orig.w], d.vlines);
        const sy = nearestSnap([y, y + d.orig.h / 2, y + d.orig.h], d.hlines);
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
        frame = { ...d.orig, x: Math.max(0, x), y: Math.max(0, y) };
      } else {
        let w = Math.max(GRID * 6, d.orig.w + dx);
        let h = Math.max(GRID * 4, d.orig.h + dy);
        const sx = nearestSnap([d.orig.x + w], d.vlines);
        const sy = nearestSnap([d.orig.y + h], d.hlines);
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
        frame = { ...d.orig, w: Math.max(GRID * 6, w), h: Math.max(GRID * 4, h) };
      }

      previewRef.current = { id: d.id, frame };
      setPreview({ id: d.id, frame });
      setGuides({ x: activeX, y: activeY });
    }
    function onUp() {
      const d = dragRef.current;
      const p = previewRef.current;
      dragRef.current = null;
      if (d && p) {
        const block = blocksRef.current.find((b) => b.id === d.id);
        if (block) onChange(setFrame(block, device, p.frame));
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
  }, [onChange, device]);

  function startDrag(e: React.PointerEvent, block: Block, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    onSelect(block.id);
    // Build snap lines from the other blocks plus the canvas center and edges.
    const vlines = new Set<number>([0, designWidth / 2, designWidth]);
    const hlines = new Set<number>([0, height / 2, height]);
    for (const b of blocksRef.current) {
      if (b.id === block.id || b.style?.hidden) continue;
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
    dragRef.current = {
      id: block.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: getFrame(block, device),
      vlines: [...vlines],
      hlines: [...hlines],
    };
  }

  function toggleHidden(block: Block) {
    onChange({
      ...block,
      style: { ...(block.style ?? {}), hidden: !block.style?.hidden },
    } as Block);
  }

  const ordered = [...blocks].sort(
    (a, b) => (getFrame(a, device).z ?? 1) - (getFrame(b, device).z ?? 1),
  );

  return (
    <div ref={wrapRef} className="w-full">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: deselect affordance, keyboard handled globally */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: canvas backdrop */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
        style={{
          width: designWidth * scale,
          height: height * scale,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: `${GRID * 3 * scale}px ${GRID * 3 * scale}px`,
        }}
        onClick={() => onSelect(null)}
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
              const f = preview?.id === block.id ? preview.frame : getFrame(block, device);
              const selected = block.id === selectedId;
              const hidden = Boolean(block.style?.hidden);
              const posStyle: CSSProperties = {
                ...framePosition(f),
                ...frameVisual(block),
                opacity: hidden ? 0.4 : (frameVisual(block).opacity ?? 1),
              };
              return (
                // biome-ignore lint/a11y/useKeyWithClickEvents: selection via pointer; keyboard handled globally
                // biome-ignore lint/a11y/noStaticElementInteractions: positioned block wrapper
                <div
                  key={block.id}
                  style={posStyle}
                  onPointerDown={(e) => startDrag(e, block, "move")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(block.id);
                  }}
                  className={cn(
                    "group outline-offset-2",
                    selected
                      ? "outline outline-2 outline-[var(--color-primary)]"
                      : "outline outline-1 outline-transparent hover:outline-[var(--color-primary)]/40",
                  )}
                >
                  <div className="h-full w-full overflow-hidden">
                    <BlockView block={block} edit={{ onChange }} />
                  </div>

                  {selected ? (
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
                            toggleHidden(block);
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
                            onDuplicate(block.id);
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
                            onDelete(block.id);
                          }}
                          className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)] hover:text-white"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {/* Resize handle */}
                      <div
                        data-no-drag
                        onPointerDown={(e) => startDrag(e, block, "resize")}
                        className="absolute -bottom-1.5 -right-1.5 z-50 size-4 cursor-nwse-resize rounded-sm border-2 border-[var(--color-primary)] bg-[var(--color-background)]"
                      />
                    </>
                  ) : null}
                </div>
              );
            })}

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
