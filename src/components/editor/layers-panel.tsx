import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { BLOCK_LABELS, type Block, type Device, getFrame } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface Props {
  blocks: Block[];
  device: Device;
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onReorder: (orderTopToBottom: string[]) => void;
  onToggleHidden: (id: string) => void;
}

// A short, human label for a layer row: the block type plus a snippet of its
// content when there is one.
function layerTitle(block: Block): string {
  const label = BLOCK_LABELS[block.type];
  const text =
    "heading" in block && block.heading
      ? block.heading
      : "quote" in block && block.quote
        ? block.quote
        : "caption" in block && block.caption
          ? block.caption
          : "";
  return text ? `${label} · ${text}` : label;
}

// Stacking-order panel. Rows are listed top layer first (highest z). Clicking a
// row selects the block; the arrows move it up or down a layer; the eye toggles
// visibility. Reordering reassigns z on the current breakpoint.
export function LayersPanel({
  blocks,
  device,
  selectedIds,
  onSelect,
  onReorder,
  onToggleHidden,
}: Props) {
  const ordered = [...blocks].sort(
    (a, b) => (getFrame(b, device).z ?? 1) - (getFrame(a, device).z ?? 1),
  );

  if (ordered.length === 0) {
    return (
      <p className="px-1 text-xs text-[var(--color-muted-foreground)]">
        Noch keine Elemente. Füge oben einen Abschnitt hinzu.
      </p>
    );
  }

  // Move the row at `index` up (toward the top) or down, then report the new
  // top-to-bottom order.
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((b) => b.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) return;
    ids.splice(target, 0, moved);
    onReorder(ids);
  }

  return (
    <ul className="space-y-1">
      {ordered.map((block, index) => {
        const selected = selectedIds.includes(block.id);
        const hidden = Boolean(block.style?.hidden);
        return (
          <li key={block.id}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: row select mirrors the canvas; keyboard handled globally */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: layer row */}
            <div
              onClick={(e) => onSelect(block.id, e.shiftKey)}
              className={cn(
                "flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-colors",
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-accent)]"
                  : "border-transparent hover:bg-[var(--color-accent)]",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  hidden && "text-[var(--color-muted-foreground)] line-through",
                )}
                title={layerTitle(block)}
              >
                {layerTitle(block)}
              </span>
              <button
                type="button"
                aria-label={hidden ? "Einblenden" : "Ausblenden"}
                title={hidden ? "Einblenden" : "Ausblenden"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHidden(block.id);
                }}
                className="shrink-0 rounded p-0.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)]"
              >
                {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              <button
                type="button"
                aria-label="Eine Ebene nach oben"
                title="Eine Ebene nach oben"
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  move(index, -1);
                }}
                className="shrink-0 rounded p-0.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)] disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Eine Ebene nach unten"
                title="Eine Ebene nach unten"
                disabled={index === ordered.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  move(index, 1);
                }}
                className="shrink-0 rounded p-0.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)] disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
