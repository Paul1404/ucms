import { Plus, Trash2 } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "@/components/editor/fields";
import { ImageField } from "@/components/editor/image-field";
import { Button } from "@/components/ui/button";
import {
  ALIGNMENTS,
  BACKGROUNDS,
  BLOCK_LABELS,
  type Block,
  IMAGE_SIZES,
  PADDINGS,
} from "@/lib/blocks";

const alignOptions = ALIGNMENTS.map((a) => ({ value: a, label: a === "left" ? "Left" : "Center" }));
const bgOptions = BACKGROUNDS.map((b) => ({
  value: b,
  label: { default: "White", muted: "Light gray", primary: "Brand color", dark: "Dark" }[b],
}));
const padOptions = PADDINGS.map((p) => ({
  value: p,
  label: { sm: "Small", md: "Medium", lg: "Large" }[p],
}));
const sizeOptions = IMAGE_SIZES.map((s) => ({
  value: s,
  label: { normal: "Normal", wide: "Wide", full: "Full width" }[s],
}));

export function BlockInspector({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  // Merge a partial update into the current block.
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Editing
        </p>
        <h3 className="text-base font-semibold">{BLOCK_LABELS[block.type]}</h3>
      </div>

      <div className="space-y-4">{renderFields(block, set)}</div>

      <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
        <SelectField
          label="Background"
          value={block.background ?? "default"}
          options={bgOptions}
          onChange={(background) => set({ background })}
        />
        <SelectField
          label="Spacing"
          value={block.padding ?? "lg"}
          options={padOptions}
          onChange={(padding) => set({ padding })}
        />
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
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Subheading"
            value={block.subheading}
            rows={2}
            onChange={(subheading) => set({ subheading })}
          />
          <ImageField
            label="Background image"
            value={block.imageUrl}
            onChange={(imageUrl) => set({ imageUrl })}
          />
          <TextField
            label="Button text"
            value={block.buttonText}
            onChange={(buttonText) => set({ buttonText })}
          />
          <TextField
            label="Button link"
            value={block.buttonUrl}
            onChange={(buttonUrl) => set({ buttonUrl })}
          />
          <SelectField
            label="Alignment"
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
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Body"
            value={block.body}
            rows={6}
            onChange={(body) => set({ body })}
          />
          <SelectField
            label="Alignment"
            value={block.align}
            options={alignOptions}
            onChange={(align) => set({ align })}
          />
        </>
      );

    case "image":
      return (
        <>
          <ImageField label="Image" value={block.url} onChange={(url) => set({ url })} />
          <TextField
            label="Caption"
            value={block.caption}
            onChange={(caption) => set({ caption })}
          />
          <SelectField
            label="Size"
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
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="rounded-md border border-[var(--color-border)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Image {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ImageField
                  label="Image"
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
            <Plus /> Add image
          </Button>
        </>
      );

    case "features":
      return (
        <>
          <TextField
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Item {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, title } : it)) })
                  }
                />
                <TextAreaField
                  label="Description"
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
            <Plus /> Add item
          </Button>
        </>
      );

    case "cta":
      return (
        <>
          <TextField
            label="Heading"
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
            label="Button text"
            value={block.buttonText}
            onChange={(buttonText) => set({ buttonText })}
          />
          <TextField
            label="Button link"
            value={block.buttonUrl}
            onChange={(buttonUrl) => set({ buttonUrl })}
          />
        </>
      );

    case "contact":
      return (
        <>
          <TextField
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextField label="Email" value={block.email} onChange={(email) => set({ email })} />
          <TextField label="Phone" value={block.phone} onChange={(phone) => set({ phone })} />
          <TextField
            label="Address"
            value={block.address}
            onChange={(address) => set({ address })}
          />
        </>
      );

    case "hours":
      return (
        <>
          <TextField
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Row {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Remove row"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Day / label"
                  value={item.label}
                  onChange={(label) =>
                    set({ items: block.items.map((it, j) => (j === i ? { ...it, label } : it)) })
                  }
                />
                <TextField
                  label="Hours / value"
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
            <Plus /> Add row
          </Button>
        </>
      );

    case "faq":
      return (
        <>
          <TextField
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
              <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Question {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                    aria-label="Remove question"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextField
                  label="Question"
                  value={item.question}
                  onChange={(question) =>
                    set({
                      items: block.items.map((it, j) => (j === i ? { ...it, question } : it)),
                    })
                  }
                />
                <TextAreaField
                  label="Answer"
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
            <Plus /> Add question
          </Button>
        </>
      );

    case "testimonial":
      return (
        <>
          <TextAreaField
            label="Quote"
            rows={4}
            value={block.quote}
            onChange={(quote) => set({ quote })}
          />
          <TextField label="Author" value={block.author} onChange={(author) => set({ author })} />
          <TextField label="Role" value={block.role} onChange={(role) => set({ role })} />
        </>
      );

    case "video":
      return (
        <>
          <TextField
            label="Video link (YouTube or Vimeo)"
            placeholder="https://youtube.com/watch?v=..."
            value={block.url}
            onChange={(url) => set({ url })}
          />
          <TextField
            label="Caption"
            value={block.caption}
            onChange={(caption) => set({ caption })}
          />
        </>
      );

    case "map":
      return (
        <>
          <TextField
            label="Heading"
            value={block.heading}
            onChange={(heading) => set({ heading })}
          />
          <TextAreaField
            label="Address"
            rows={2}
            value={block.address}
            onChange={(address) => set({ address })}
          />
        </>
      );

    case "divider":
      return (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          A divider has no content. Adjust its background and spacing below.
        </p>
      );
  }
}
