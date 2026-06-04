import { ArrowDownToLine, ArrowUpToLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  ColorField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/editor/fields";
import { ImageField } from "@/components/editor/image-field";
import { Button } from "@/components/ui/button";
import {
  ALIGNMENTS,
  BLOCK_LABELS,
  type Block,
  type BlockStyle,
  BREAKPOINTS,
  BUTTON_VARIANTS,
  type Device,
  type Frame,
  getFrame,
  hasOwnFrame,
  IMAGE_SIZES,
  SOCIAL_PLATFORMS,
  setFrame as setDeviceFrame,
} from "@/lib/blocks";

const alignOptions = ALIGNMENTS.map((a) => ({
  value: a,
  label: a === "left" ? "Links" : "Zentriert",
}));
const sizeOptions = IMAGE_SIZES.map((s) => ({
  value: s,
  label: { normal: "Normal", wide: "Breit", full: "Volle Breite" }[s],
}));
const variantOptions = BUTTON_VARIANTS.map((variant) => ({
  value: variant,
  label: { primary: "Gefüllt", outline: "Umrandet" }[variant],
}));
const SOCIAL_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  website: "Webseite",
  email: "E-Mail",
};
const socialOptions = SOCIAL_PLATFORMS.map((platform) => ({
  value: platform,
  label: SOCIAL_LABELS[platform],
}));

const DEFAULT_STYLE: BlockStyle = {
  bg: "",
  color: "",
  radius: 0,
  padding: 24,
  opacity: 100,
  shadow: false,
  border: false,
  borderWidth: 1,
  borderColor: "",
  rotation: 0,
  hidden: false,
};

export function BlockInspector({
  block,
  device,
  onChange,
  onBringToFront,
  onSendToBack,
}: {
  block: Block;
  device: Device;
  onChange: (block: Block) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}) {
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);
  const frame = getFrame(block, device);
  const style = { ...DEFAULT_STYLE, ...block.style };
  const setFrame = (patch: Partial<Frame>) =>
    onChange(setDeviceFrame(block, device, { ...frame, ...patch }));
  const setStyle = (patch: Partial<BlockStyle>) =>
    set({ style: { ...style, ...patch } } as Partial<Block>);

  // On tablet/mobile, drop the override so the block inherits the larger
  // breakpoint's layout again.
  const resetFrame = () => {
    if (device === "tablet") onChange({ ...block, frameTablet: undefined } as Block);
    else if (device === "mobile") onChange({ ...block, frameMobile: undefined } as Block);
  };
  const overridden = device !== "desktop" && hasOwnFrame(block, device);
  const hasStyle = Boolean(block.style);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Bearbeiten
        </p>
        <h3 className="text-base font-semibold">{BLOCK_LABELS[block.type]}</h3>
      </div>

      <div className="space-y-4">{renderFields(block, set)}</div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Position & Größe
          </p>
          <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {BREAKPOINTS[device].label}
          </span>
        </div>
        {device !== "desktop" ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {overridden
              ? "Eigenes Layout für dieses Gerät."
              : "Erbt das Layout vom größeren Gerät, bis du es hier änderst."}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={frame.x} onChange={(x) => setFrame({ x })} />
          <NumberField label="Y" value={frame.y} onChange={(y) => setFrame({ y })} />
          <NumberField label="Breite" value={frame.w} min={40} onChange={(w) => setFrame({ w })} />
          <NumberField label="Höhe" value={frame.h} min={20} onChange={(h) => setFrame({ h })} />
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onBringToFront}>
            <ArrowUpToLine /> Nach vorne
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSendToBack}>
            <ArrowDownToLine /> Nach hinten
          </Button>
        </div>
        {overridden ? (
          <Button type="button" variant="ghost" size="sm" onClick={resetFrame}>
            <RotateCcw /> Layout von Desktop übernehmen
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Stil
          </p>
          {hasStyle ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, style: undefined } as Block)}
              className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <RotateCcw className="size-3" /> Zurücksetzen
            </button>
          ) : null}
        </div>
        <ColorField label="Hintergrund" value={style.bg} onChange={(bg) => setStyle({ bg })} />
        <ColorField
          label="Textfarbe"
          value={style.color}
          onChange={(color) => setStyle({ color })}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ecken-Radius"
            value={style.radius}
            min={0}
            onChange={(radius) => setStyle({ radius })}
          />
          <NumberField
            label="Innenabstand"
            value={style.padding}
            min={0}
            onChange={(padding) => setStyle({ padding })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Deckkraft (%)"
            value={style.opacity}
            min={0}
            max={100}
            step={5}
            onChange={(opacity) => setStyle({ opacity })}
          />
          <NumberField
            label="Drehung (°)"
            value={style.rotation}
            min={-180}
            max={180}
            onChange={(rotation) => setStyle({ rotation })}
          />
        </div>
        <ToggleField
          label="Schatten"
          value={style.shadow}
          onChange={(shadow) => setStyle({ shadow })}
        />
        <ToggleField
          label="Rahmen"
          value={style.border}
          onChange={(border) => setStyle({ border })}
        />
        {style.border ? (
          <div className="space-y-3 rounded-md border border-[var(--color-border)] p-3">
            <NumberField
              label="Rahmenbreite"
              value={style.borderWidth}
              min={0}
              max={20}
              onChange={(borderWidth) => setStyle({ borderWidth })}
            />
            <ColorField
              label="Rahmenfarbe"
              value={style.borderColor}
              onChange={(borderColor) => setStyle({ borderColor })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function renderFields(block: Block, set: (patch: Partial<Block>) => void) {
  switch (block.type) {
    case "hero":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Unterüberschrift"
            value={block.subheading}
            rows={2}
            onChange={(subheading) => set({ subheading })}
          />
          <ImageField
            label="Bild"
            value={block.imageUrl}
            onChange={(imageUrl) => set({ imageUrl })}
          />
          <TextField
            label="Button-Text"
            value={block.buttonText}
            onChange={(buttonText) => set({ buttonText })}
          />
          <TextField
            label="Button-Link"
            value={block.buttonUrl}
            onChange={(buttonUrl) => set({ buttonUrl })}
          />
          <SelectField
            label="Ausrichtung"
            value={block.align}
            options={alignOptions}
            onChange={(align) => set({ align })}
          />
        </>
      );

    case "text":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Text"
            value={block.body}
            rows={6}
            onChange={(body) => set({ body })}
          />
          <SelectField
            label="Ausrichtung"
            value={block.align}
            options={alignOptions}
            onChange={(align) => set({ align })}
          />
        </>
      );

    case "image":
      return (
        <>
          <ImageField label="Bild" value={block.url} onChange={(url) => set({ url })} />
          <TextField
            label="Bildunterschrift"
            value={block.caption}
            onChange={(caption) => set({ caption })}
          />
          <SelectField
            label="Größe"
            value={block.size}
            options={sizeOptions}
            onChange={(size) => set({ size })}
          />
        </>
      );

    case "gallery":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="rounded-md border border-[var(--color-border)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Bild {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Bild entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ImageField
                  label="Bild"
                  value={item.url}
                  onChange={(url) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, url } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ items: [...block.items, { url: "", caption: "" }] })}
          >
            <Plus /> Bild hinzufügen
          </Button>
        </>
      );

    case "features":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Element {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Element entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Titel"
                  value={item.title}
                  onChange={(title) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, title } : it)) })
                  }
                />
                <TextAreaField
                  label="Beschreibung"
                  rows={2}
                  value={item.description}
                  onChange={(description) =>
                    set({
                      items: block.items.map((it, j) => (j === i ? { ...it, description } : it)),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ items: [...block.items, { title: "", description: "" }] })}
          >
            <Plus /> Element hinzufügen
          </Button>
        </>
      );

    case "cta":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Text"
            rows={2}
            value={block.text}
            onChange={(text) => set({ text })}
          />
          <TextField
            label="Button-Text"
            value={block.buttonText}
            onChange={(buttonText) => set({ buttonText })}
          />
          <TextField
            label="Button-Link"
            value={block.buttonUrl}
            onChange={(buttonUrl) => set({ buttonUrl })}
          />
        </>
      );

    case "contact":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextField label="E-Mail" value={block.email} onChange={(email) => set({ email })} />
          <TextField label="Telefon" value={block.phone} onChange={(phone) => set({ phone })} />
          <TextField
            label="Adresse"
            value={block.address}
            onChange={(address) => set({ address })}
          />
        </>
      );

    case "hours":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Zeile {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Zeile entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Tag / Bezeichnung"
                  value={item.label}
                  onChange={(label) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, label } : it)) })
                  }
                />
                <TextField
                  label="Zeiten / Wert"
                  value={item.value}
                  onChange={(value) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, value } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ items: [...block.items, { label: "", value: "" }] })}
          >
            <Plus /> Zeile hinzufügen
          </Button>
        </>
      );

    case "faq":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Frage {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Frage entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Frage"
                  value={item.question}
                  onChange={(question) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, question } : it)) })
                  }
                />
                <TextAreaField
                  label="Antwort"
                  rows={3}
                  value={item.answer}
                  onChange={(answer) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, answer } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ items: [...block.items, { question: "", answer: "" }] })}
          >
            <Plus /> Frage hinzufügen
          </Button>
        </>
      );

    case "testimonial":
      return (
        <>
          <TextAreaField
            label="Zitat"
            rows={4}
            value={block.quote}
            onChange={(quote) => set({ quote })}
          />
          <TextField label="Autor" value={block.author} onChange={(author) => set({ author })} />
          <TextField label="Rolle" value={block.role} onChange={(role) => set({ role })} />
        </>
      );

    case "video":
      return (
        <>
          <TextField
            label="Video-Link (YouTube oder Vimeo)"
            placeholder="https://youtube.com/watch?v=..."
            value={block.url}
            onChange={(url) => set({ url })}
          />
          <TextField
            label="Bildunterschrift"
            value={block.caption}
            onChange={(caption) => set({ caption })}
          />
        </>
      );

    case "map":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Adresse"
            rows={2}
            value={block.address}
            onChange={(address) => set({ address })}
          />
        </>
      );

    case "events":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Termin {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Termin entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="Tag"
                    value={item.date}
                    onChange={(date) =>
                      set({ items: block.items.map((it, j) => (j === i ? { ...it, date } : it)) })
                    }
                  />
                  <TextField
                    label="Uhrzeit"
                    value={item.time}
                    onChange={(time) =>
                      set({ items: block.items.map((it, j) => (j === i ? { ...it, time } : it)) })
                    }
                  />
                </div>
                <TextField
                  label="Titel"
                  value={item.title}
                  onChange={(title) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, title } : it)) })
                  }
                />
                <TextField
                  label="Ort"
                  value={item.location}
                  onChange={(location) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, location } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({ items: [...block.items, { date: "", time: "", title: "", location: "" }] })
            }
          >
            <Plus /> Termin hinzufügen
          </Button>
        </>
      );

    case "team":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Person {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Person entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ImageField
                  label="Foto"
                  value={item.photo}
                  onChange={(photo) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, photo } : it)) })
                  }
                />
                <TextField
                  label="Name"
                  value={item.name}
                  onChange={(name) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, name } : it)) })
                  }
                />
                <TextField
                  label="Rolle"
                  value={item.role}
                  onChange={(role) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, role } : it)) })
                  }
                />
                <TextField
                  label="E-Mail"
                  value={item.email}
                  onChange={(email) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, email } : it)) })
                  }
                />
                <TextField
                  label="Telefon"
                  value={item.phone}
                  onChange={(phone) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, phone } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                items: [...block.items, { photo: "", name: "", role: "", email: "", phone: "" }],
              })
            }
          >
            <Plus /> Person hinzufügen
          </Button>
        </>
      );

    case "news":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Beitrag {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Beitrag entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ImageField
                  label="Bild"
                  value={item.image}
                  onChange={(image) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, image } : it)) })
                  }
                />
                <TextField
                  label="Datum"
                  value={item.date}
                  onChange={(date) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, date } : it)) })
                  }
                />
                <TextField
                  label="Titel"
                  value={item.title}
                  onChange={(title) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, title } : it)) })
                  }
                />
                <TextAreaField
                  label="Text"
                  rows={3}
                  value={item.text}
                  onChange={(text) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, text } : it)) })
                  }
                />
                <TextField
                  label="Link"
                  value={item.linkUrl}
                  onChange={(linkUrl) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, linkUrl } : it)) })
                  }
                />
                <TextField
                  label="Link-Text"
                  value={item.linkText}
                  onChange={(linkText) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, linkText } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                items: [
                  ...block.items,
                  {
                    date: "",
                    title: "",
                    text: "",
                    image: "",
                    linkUrl: "",
                    linkText: "Weiterlesen",
                  },
                ],
              })
            }
          >
            <Plus /> Beitrag hinzufügen
          </Button>
        </>
      );

    case "button":
      return (
        <>
          <TextField label="Text" value={block.text} onChange={(text) => set({ text })} />
          <TextField label="Link" value={block.url} onChange={(url) => set({ url })} />
          <SelectField
            label="Stil"
            value={block.variant}
            options={variantOptions}
            onChange={(variant) => set({ variant })}
          />
          <SelectField
            label="Ausrichtung"
            value={block.align}
            options={alignOptions}
            onChange={(align) => set({ align })}
          />
        </>
      );

    case "socials":
      return (
        <>
          <TextField
            label="Überschrift"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Link {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Link entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <SelectField
                  label="Plattform"
                  value={item.platform}
                  options={socialOptions}
                  onChange={(platform) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, platform } : it)) })
                  }
                />
                <TextField
                  label="Link"
                  value={item.url}
                  onChange={(url) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, url } : it)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ items: [...block.items, { platform: "facebook", url: "" }] })}
          >
            <Plus /> Link hinzufügen
          </Button>
        </>
      );

    case "divider":
      return (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ein Trenner hat keinen Inhalt. Passe Position und Stil unten an.
        </p>
      );
  }
}
