import { Plus, Trash2, X } from "lucide-react";
import { ColorField, TextAreaField, TextField, ToggleField } from "@/components/editor/fields";
import { ImageField } from "@/components/editor/image-field";
import { Button } from "@/components/ui/button";
import type { Footer, Header, NavLink } from "@/lib/chrome";

function LinkList({ links, onChange }: { links: NavLink[]; onChange: (links: NavLink[]) => void }) {
  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: edited by position
        <div key={i} className="flex items-end gap-2">
          <TextField
            label="Beschriftung"
            value={link.label}
            onChange={(label) => onChange(links.map((l, j) => (j === i ? { ...l, label } : l)))}
          />
          <TextField
            label="Link"
            value={link.url}
            onChange={(url) => onChange(links.map((l, j) => (j === i ? { ...l, url } : l)))}
          />
          <button
            type="button"
            aria-label="Link entfernen"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="mb-1.5 rounded p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { label: "", url: "" }])}
      >
        <Plus /> Link hinzufügen
      </Button>
    </div>
  );
}

export function ChromeDialog({
  header,
  footer,
  onChangeHeader,
  onChangeFooter,
  onClose,
}: {
  header: Header;
  footer: Footer;
  onChangeHeader: (header: Header) => void;
  onChangeFooter: (footer: Footer) => void;
  onClose: () => void;
}) {
  const setH = (patch: Partial<Header>) => onChangeHeader({ ...header, ...patch });
  const setF = (patch: Partial<Footer>) => onChangeFooter({ ...footer, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <h2 className="font-semibold">Kopf- & Fußzeile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Kopfzeile</h3>
              <ToggleField
                label="Anzeigen"
                value={header.enabled}
                onChange={(enabled) => setH({ enabled })}
              />
            </div>
            {header.enabled ? (
              <>
                <TextField
                  label="Logo-Text"
                  value={header.logoText}
                  onChange={(logoText) => setH({ logoText })}
                />
                <ImageField
                  label="Logo-Bild (optional, ersetzt den Text)"
                  value={header.logoUrl}
                  onChange={(logoUrl) => setH({ logoUrl })}
                />
                <div>
                  <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                    Navigation
                  </p>
                  <LinkList links={header.links} onChange={(links) => setH({ links })} />
                </div>
                <ToggleField
                  label="Beim Scrollen oben fixieren"
                  value={header.sticky}
                  onChange={(sticky) => setH({ sticky })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <ColorField
                    label="Hintergrund"
                    value={header.bg}
                    onChange={(bg) => setH({ bg })}
                  />
                  <ColorField
                    label="Textfarbe"
                    value={header.color}
                    onChange={(color) => setH({ color })}
                  />
                </div>
              </>
            ) : null}
          </section>

          <section className="space-y-4 border-t border-[var(--color-border)] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Fußzeile</h3>
              <ToggleField
                label="Anzeigen"
                value={footer.enabled}
                onChange={(enabled) => setF({ enabled })}
              />
            </div>
            {footer.enabled ? (
              <>
                <TextAreaField
                  label="Text"
                  rows={2}
                  value={footer.text}
                  onChange={(text) => setF({ text })}
                />
                <div>
                  <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                    Links
                  </p>
                  <LinkList links={footer.links} onChange={(links) => setF({ links })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ColorField
                    label="Hintergrund"
                    value={footer.bg}
                    onChange={(bg) => setF({ bg })}
                  />
                  <ColorField
                    label="Textfarbe"
                    value={footer.color}
                    onChange={(color) => setF({ color })}
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-3">
          <Button onClick={onClose}>Fertig</Button>
        </div>
      </div>
    </div>
  );
}
