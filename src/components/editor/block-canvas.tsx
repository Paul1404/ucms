import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { BlockView } from "@/components/blocks/block-view";
import type { Block } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface CanvasProps {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (blocks: Block[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BlockCanvas({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
}: CanvasProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(blocks, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              selected={block.id === selectedId}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onSelect={() => onSelect(block.id)}
              onMoveUp={() => onReorder(arrayMove(blocks, index, index - 1))}
              onMoveDown={() => onReorder(arrayMove(blocks, index, index + 1))}
              onDuplicate={() => onDuplicate(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableBlockProps {
  block: Block;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableBlock({
  block,
  selected,
  isFirst,
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-[var(--color-background)] shadow-sm transition-shadow",
        selected
          ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50",
        isDragging && "opacity-80 shadow-lg",
      )}
    >
      {/* Toolbar */}
      <div
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)]/95 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 data-[selected=true]:opacity-100"
        data-selected={selected}
      >
        <IconBtn label="Drag" {...attributes} {...listeners}>
          <GripVertical className="size-4 cursor-grab" />
        </IconBtn>
        <IconBtn label="Move up" disabled={isFirst} onClick={onMoveUp}>
          <ChevronUp className="size-4" />
        </IconBtn>
        <IconBtn label="Move down" disabled={isLast} onClick={onMoveDown}>
          <ChevronDown className="size-4" />
        </IconBtn>
        <IconBtn label="Duplicate" onClick={onDuplicate}>
          <Copy className="size-4" />
        </IconBtn>
        <IconBtn label="Delete" onClick={onDelete} danger>
          <Trash2 className="size-4" />
        </IconBtn>
      </div>

      {/* Click-to-select overlay over the non-interactive preview */}
      <button
        type="button"
        onClick={onSelect}
        className="block w-full cursor-pointer text-left"
        aria-label={`Edit ${block.type} section`}
      >
        <div className="pointer-events-none">
          <BlockView block={block} editing />
        </div>
      </button>
    </div>
  );
}

function IconBtn({
  children,
  label,
  danger,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "rounded p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-30",
        danger && "hover:text-[var(--color-destructive)]",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
