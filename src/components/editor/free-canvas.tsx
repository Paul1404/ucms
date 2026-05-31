import { Copy, Move, Trash2 } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { BlockView, CanvasModeContext } from "@/components/blocks/block-view";
import { framePosition, frameVisual } from "@/components/blocks/canvas-view";
import { type Block, DESIGN_WIDTH, type Frame, GRID, snap } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface Props {
  blocks: Block[];
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
};

const FALLBACK: Frame = { x: 80, y: 40, w: 400, h: 200, z: 1 };

function frameOf(block: Block): Frame {
  return block.frame ?? FALLBACK;
}

// Interactive free-form canvas. Blocks are absolutely positioned; drag the move
// grip to reposition and the corner handle to resize. Edits commit to history
// only on pointer-up so a drag is a single undo step.
export function FreeCanvas({
  blocks,
  height,
  selectedId,
  onSelect,
  onChange,
  onDuplicate,
  onDelete,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DESIGN_WIDTH);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const scale = Math.min(1, width / DESIGN_WIDTH);

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{ id: string; frame: Frame } | null>(null);
  const [preview, setPreview] = useState<{ id: string; frame: Frame } | null>(null);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / scaleRef.current;
      const dy = (e.clientY - d.startY) / scaleRef.current;
      let frame: Frame;
      if (d.mode === "move") {
        frame = {
          ...d.orig,
          x: Math.max(0, snap(d.orig.x + dx)),
          y: Math.max(0, snap(d.orig.y + dy)),
        };
      } else {
        frame = {
          ...d.orig,
          w: Math.max(GRID * 6, snap(d.orig.w + dx)),
          h: Math.max(GRID * 4, snap(d.orig.h + dy)),
        };
      }
      previewRef.current = { id: d.id, frame };
      setPreview({ id: d.id, frame });
    }
    function onUp() {
      const d = dragRef.current;
      const p = previewRef.current;
      dragRef.current = null;
      if (d && p) {
        const block = blocksRef.current.find((b) => b.id === d.id);
        if (block) onChange({ ...block, frame: p.frame });
      }
      previewRef.current = null;
      setPreview(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onChange]);

  function startDrag(e: React.PointerEvent, block: Block, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    onSelect(block.id);
    dragRef.current = {
      id: block.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: frameOf(block),
    };
  }

  const ordered = [...blocks].sort((a, b) => (a.frame?.z ?? 1) - (b.frame?.z ?? 1));

  return (
    <div ref={wrapRef} className="w-full">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: deselect affordance, keyboard handled globally */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: canvas backdrop */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
        style={{
          width: DESIGN_WIDTH * scale,
          height: height * scale,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: `${GRID * 3 * scale}px ${GRID * 3 * scale}px`,
        }}
        onClick={() => onSelect(null)}
      >
        <div
          style={{
            width: DESIGN_WIDTH,
            height,
            position: "relative",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CanvasModeContext.Provider value={true}>
            {ordered.map((block) => {
              const f = preview?.id === block.id ? preview.frame : frameOf(block);
              const selected = block.id === selectedId;
              const posStyle: CSSProperties = { ...framePosition(f), ...frameVisual(block) };
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
                      {/* Toolbar */}
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
          </CanvasModeContext.Provider>
        </div>
      </div>
    </div>
  );
}
