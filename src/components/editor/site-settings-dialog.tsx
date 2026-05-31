import { Check, X } from "lucide-react";
import { SelectField, TextAreaField } from "@/components/editor/fields";
import { ImageField } from "@/components/editor/image-field";
import { Button } from "@/components/ui/button";
import { COLOR_PRESETS, FONT_LABELS, FONTS, type FontChoice } from "@/lib/theme";
import { cn } from "@/lib/utils";

export interface SiteMeta {
  description: string;
  ogImage: string;
  font: FontChoice;
  themeColor: string;
}

const fontOptions = FONTS.map((f) => ({ value: f, label: FONT_LABELS[f] }));

export function SiteSettingsDialog({
  meta,
  onChange,
  onClose,
}: {
  meta: SiteMeta;
  onChange: (meta: SiteMeta) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<SiteMeta>) => onChange({ ...meta, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <h2 className="font-semibold">Einstellungen</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Markenfarbe</p>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color}`}
                  onClick={() => set({ themeColor: color })}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--color-background)] transition",
                    meta.themeColor.toLowerCase() === color.toLowerCase() &&
                      "ring-2 ring-[var(--color-ring)]",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {meta.themeColor.toLowerCase() === color.toLowerCase() ? (
                    <Check className="size-3.5 text-white" />
                  ) : null}
                </button>
              ))}
              <input
                type="color"
                aria-label="Custom brand color"
                value={meta.themeColor}
                onChange={(e) => set({ themeColor: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
              />
            </div>
          </div>

          <SelectField
            label="Schriftart"
            value={meta.font}
            options={fontOptions}
            onChange={(font) => set({ font })}
          />

          <TextAreaField
            label="Beschreibung (für Suchmaschinen und Link-Vorschauen)"
            rows={3}
            value={meta.description}
            onChange={(description) => set({ description })}
          />

          <ImageField
            label="Vorschaubild für soziale Netzwerke"
            value={meta.ogImage}
            onChange={(ogImage) => set({ ogImage })}
          />
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-3">
          <Button onClick={onClose}>Fertig</Button>
        </div>
      </div>
    </div>
  );
}
