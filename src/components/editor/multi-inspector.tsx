import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  Copy,
  Group,
  Trash2,
  Ungroup,
} from "lucide-react";
import { ColorField } from "@/components/editor/fields";
import { Button } from "@/components/ui/button";
import type { AlignMode, DistributeAxis } from "@/lib/arrange";
import type { BlockStyle, Device } from "@/lib/blocks";
import { BREAKPOINTS } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  device: Device;
  canGroup: boolean;
  canUngroup: boolean;
  onAlign: (mode: AlignMode) => void;
  onDistribute: (axis: DistributeAxis) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onApplyStyle: (patch: Partial<BlockStyle>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ALIGN_ROW: { mode: AlignMode; label: string; icon: typeof AlignStartVertical }[] = [
  { mode: "left", label: "Links", icon: AlignStartVertical },
  { mode: "hcenter", label: "Horizontal zentrieren", icon: AlignCenterVertical },
  { mode: "right", label: "Rechts", icon: AlignEndVertical },
  { mode: "top", label: "Oben", icon: AlignStartHorizontal },
  { mode: "vcenter", label: "Vertikal zentrieren", icon: AlignCenterHorizontal },
  { mode: "bottom", label: "Unten", icon: AlignEndHorizontal },
];

export function MultiInspector({
  count,
  device,
  canGroup,
  canUngroup,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  onApplyStyle,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Mehrfachauswahl
        </p>
        <h3 className="text-base font-semibold">{count} Elemente ausgewählt</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Ausrichten
          </p>
          <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {BREAKPOINTS[device].label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ALIGN_ROW.map(({ mode, label, icon: Icon }) => (
            <IconButton key={mode} label={label} onClick={() => onAlign(mode)}>
              <Icon className="size-4" />
            </IconButton>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Verteilen
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Gleiche Abstände zwischen den Elementen. Ab drei Elementen verfügbar.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={count < 3}
            onClick={() => onDistribute("horizontal")}
          >
            <AlignHorizontalSpaceBetween /> Horizontal
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={count < 3}
            onClick={() => onDistribute("vertical")}
          >
            <AlignVerticalSpaceBetween /> Vertikal
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Gruppieren
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!canGroup} onClick={onGroup}>
            <Group /> Gruppieren
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canUngroup}
            onClick={onUngroup}
          >
            <Ungroup /> Aufheben
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Stil für alle
        </p>
        <ColorField
          label="Hintergrund"
          value=""
          allowEmpty={false}
          onChange={(bg) => onApplyStyle({ bg })}
        />
        <ColorField
          label="Textfarbe"
          value=""
          allowEmpty={false}
          onChange={(color) => onApplyStyle({ color })}
        />
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
          <Copy /> Duplizieren
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
        >
          <Trash2 /> Löschen
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-md border border-[var(--color-border)] py-2",
        "text-[var(--color-muted-foreground)] transition-colors",
        "hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
      )}
    >
      {children}
    </button>
  );
}
