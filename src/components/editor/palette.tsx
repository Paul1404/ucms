import {
  Grid3x3,
  ImageIcon,
  Images,
  LayoutTemplate,
  Mail,
  Minus,
  MousePointerClick,
  Type,
} from "lucide-react";
import { BLOCK_LABELS, type BlockType } from "@/lib/blocks";

const ICONS: Record<BlockType, typeof Type> = {
  hero: LayoutTemplate,
  text: Type,
  image: ImageIcon,
  gallery: Images,
  features: Grid3x3,
  cta: MousePointerClick,
  contact: Mail,
  divider: Minus,
};

const ORDER: BlockType[] = [
  "hero",
  "text",
  "image",
  "gallery",
  "features",
  "cta",
  "contact",
  "divider",
];

export function Palette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      {ORDER.map((type) => {
        const Icon = ICONS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)]"
          >
            <Icon className="size-4 text-[var(--color-muted-foreground)]" />
            {BLOCK_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
