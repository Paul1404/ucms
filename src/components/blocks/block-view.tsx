import { ImageIcon, Mail, MapPin, Phone, Quote, Video } from "lucide-react";
import { createElement } from "react";
import { InlineText } from "@/components/editor/inline-text";
import { type Block, toEmbedUrl } from "@/lib/blocks";
import { cn } from "@/lib/utils";

const BG_CLASS: Record<string, string> = {
  default: "bg-[var(--color-background)] text-[var(--color-foreground)]",
  muted: "bg-[var(--color-muted)] text-[var(--color-foreground)]",
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
  dark: "bg-neutral-900 text-neutral-50",
};

const PAD_CLASS: Record<string, string> = {
  sm: "py-6",
  md: "py-12",
  lg: "py-20",
};

type Tag = "span" | "div" | "h1" | "h2" | "h3" | "p";

export interface EditHandle {
  onChange: (block: Block) => void;
}

function Section({ block, children }: { block: Block; children: React.ReactNode }) {
  return (
    <section
      className={cn(BG_CLASS[block.background ?? "default"], PAD_CLASS[block.padding ?? "lg"])}
    >
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </section>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-current/30 text-sm opacity-60">
      <span className="flex items-center gap-2">
        <ImageIcon className="size-4" /> {label}
      </span>
    </div>
  );
}

function buttonClass(onDark: boolean) {
  return cn(
    "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90",
    onDark
      ? "bg-white text-neutral-900"
      : "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
  );
}

// Renders a text field as inline-editable on the canvas, or as plain markup on
// the published site (omitted entirely when empty).
function Txt({
  editable,
  value,
  onChange,
  as,
  className,
  placeholder,
  multiline,
}: {
  editable: boolean;
  value: string;
  onChange: (value: string) => void;
  as: Tag;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  if (editable) {
    return (
      <InlineText
        as={as}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        multiline={multiline}
      />
    );
  }
  if (!value) return null;
  return createElement(as, { className }, value);
}

/** Renders a single block, either for the public site or the live editor. */
export function BlockView({ block, edit }: { block: Block; edit?: EditHandle }) {
  const editable = Boolean(edit);
  const onDark = block.background === "primary" || block.background === "dark";

  switch (block.type) {
    case "hero": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <div className={cn("space-y-5", block.align === "center" && "text-center")}>
            <Txt
              editable={editable}
              as="h1"
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              placeholder="Your headline"
              value={block.heading}
              onChange={(heading) => up({ heading })}
            />
            <Txt
              editable={editable}
              as="p"
              className="mx-auto max-w-2xl text-lg opacity-90"
              placeholder="A short, friendly subheading"
              multiline
              value={block.subheading}
              onChange={(subheading) => up({ subheading })}
            />
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt={block.heading || "Hero"}
                className="mx-auto mt-6 max-h-[420px] w-full rounded-xl object-cover"
              />
            ) : editable ? (
              <div className="mt-6">
                <Placeholder label="Optional hero image (set in the panel)" />
              </div>
            ) : null}
            {editable ? (
              <div className={block.align === "center" ? "flex justify-center" : ""}>
                <span className={buttonClass(onDark)}>
                  <InlineText
                    value={block.buttonText}
                    placeholder="Button text"
                    onChange={(buttonText) => up({ buttonText })}
                  />
                </span>
              </div>
            ) : block.buttonText ? (
              <div className={block.align === "center" ? "flex justify-center" : ""}>
                <a href={block.buttonUrl || "#"} className={buttonClass(onDark)}>
                  {block.buttonText}
                </a>
              </div>
            ) : null}
          </div>
        </Section>
      );
    }

    case "text": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <div className={cn("space-y-4", block.align === "center" && "text-center")}>
            <Txt
              editable={editable}
              as="h2"
              className="text-3xl font-semibold tracking-tight"
              placeholder="Section heading"
              value={block.heading}
              onChange={(heading) => up({ heading })}
            />
            <Txt
              editable={editable}
              as="p"
              className="mx-auto max-w-3xl whitespace-pre-wrap text-lg leading-relaxed opacity-90"
              placeholder="Write something about your organization..."
              multiline
              value={block.body}
              onChange={(body) => up({ body })}
            />
          </div>
        </Section>
      );
    }

    case "image":
      return (
        <Section block={block}>
          <figure
            className={cn(
              "mx-auto",
              block.size === "normal" && "max-w-2xl",
              block.size === "wide" && "max-w-4xl",
              block.size === "full" && "max-w-full",
            )}
          >
            {block.url ? (
              <img src={block.url} alt={block.caption || ""} className="w-full rounded-xl" />
            ) : editable ? (
              <Placeholder label="Add an image (set in the panel)" />
            ) : null}
            <Txt
              editable={editable}
              as="p"
              className="mt-2 text-center text-sm opacity-70"
              placeholder="Caption (optional)"
              value={block.caption}
              onChange={(caption) => edit?.onChange({ ...block, caption })}
            />
          </figure>
        </Section>
      );

    case "gallery": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-8 text-center text-3xl font-semibold tracking-tight"
            placeholder="Gallery"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(block.items ?? []).map((item, i) =>
              item.url ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: gallery items have no stable id
                <figure key={i} className="overflow-hidden rounded-lg">
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="aspect-square w-full object-cover"
                  />
                </figure>
              ) : editable ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: gallery items have no stable id
                <Placeholder key={i} label="Image" />
              ) : null,
            )}
          </div>
        </Section>
      );
    }

    case "features": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-10 text-center text-3xl font-semibold tracking-tight"
            placeholder="What we offer"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(block.items ?? []).map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: feature items have no stable id
              <div key={i} className="rounded-xl border border-current/10 bg-current/5 p-6">
                <Txt
                  editable={editable}
                  as="h3"
                  className="text-lg font-semibold"
                  placeholder="Title"
                  value={item.title}
                  onChange={(title) => setItem(i, { title })}
                />
                <Txt
                  editable={editable}
                  as="p"
                  className="mt-2 text-sm opacity-80"
                  placeholder="Description"
                  multiline
                  value={item.description}
                  onChange={(description) => setItem(i, { description })}
                />
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "cta": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <div className="space-y-4 text-center">
            <Txt
              editable={editable}
              as="h2"
              className="text-3xl font-semibold tracking-tight"
              placeholder="Ready to start?"
              value={block.heading}
              onChange={(heading) => up({ heading })}
            />
            <Txt
              editable={editable}
              as="p"
              className="text-lg opacity-90"
              placeholder="A line of encouragement"
              multiline
              value={block.text}
              onChange={(text) => up({ text })}
            />
            {editable ? (
              <div className="flex justify-center pt-2">
                <span className={buttonClass(onDark)}>
                  <InlineText
                    value={block.buttonText}
                    placeholder="Button text"
                    onChange={(buttonText) => up({ buttonText })}
                  />
                </span>
              </div>
            ) : block.buttonText ? (
              <div className="flex justify-center pt-2">
                <a href={block.buttonUrl || "#"} className={buttonClass(onDark)}>
                  {block.buttonText}
                </a>
              </div>
            ) : null}
          </div>
        </Section>
      );
    }

    case "contact": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <div id="contact" className="space-y-6 text-center">
            <Txt
              editable={editable}
              as="h2"
              className="text-3xl font-semibold tracking-tight"
              placeholder="Get in touch"
              value={block.heading}
              onChange={(heading) => up({ heading })}
            />
            <div className="flex flex-col items-center gap-3 text-base">
              {editable ? (
                <>
                  <span className="flex items-center gap-2">
                    <Mail className="size-4" />
                    <InlineText
                      value={block.email}
                      placeholder="email@example.com"
                      onChange={(email) => up({ email })}
                    />
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="size-4" />
                    <InlineText
                      value={block.phone}
                      placeholder="Phone (optional)"
                      onChange={(phone) => up({ phone })}
                    />
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <InlineText
                      value={block.address}
                      placeholder="Address (optional)"
                      onChange={(address) => up({ address })}
                    />
                  </span>
                </>
              ) : (
                <>
                  {block.email ? (
                    <a
                      href={`mailto:${block.email}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Mail className="size-4" /> {block.email}
                    </a>
                  ) : null}
                  {block.phone ? (
                    <a
                      href={`tel:${block.phone}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Phone className="size-4" /> {block.phone}
                    </a>
                  ) : null}
                  {block.address ? (
                    <span className="flex items-center gap-2 opacity-80">
                      <MapPin className="size-4" /> {block.address}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </Section>
      );
    }

    case "hours": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-8 text-center text-3xl font-semibold tracking-tight"
            placeholder="Opening hours"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <dl className="mx-auto max-w-md divide-y divide-current/10">
            {(block.items ?? []).map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <Txt
                  editable={editable}
                  as="span"
                  className="font-medium"
                  placeholder="Day"
                  value={item.label}
                  onChange={(label) => setItem(i, { label })}
                />
                <Txt
                  editable={editable}
                  as="span"
                  className="opacity-80"
                  placeholder="Hours"
                  value={item.value}
                  onChange={(value) => setItem(i, { value })}
                />
              </div>
            ))}
          </dl>
        </Section>
      );
    }

    case "faq": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-8 text-center text-3xl font-semibold tracking-tight"
            placeholder="Frequently asked questions"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="mx-auto max-w-2xl space-y-3">
            {(block.items ?? []).map((item, i) =>
              editable ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
                <div key={i} className="rounded-lg border border-current/10 p-4">
                  <InlineText
                    as="p"
                    className="font-medium"
                    placeholder="Question"
                    value={item.question}
                    onChange={(question) => setItem(i, { question })}
                  />
                  <InlineText
                    as="p"
                    className="mt-1 text-sm opacity-80"
                    placeholder="Answer"
                    multiline
                    value={item.answer}
                    onChange={(answer) => setItem(i, { answer })}
                  />
                </div>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
                <details key={i} className="group rounded-lg border border-current/10 p-4">
                  <summary className="cursor-pointer font-medium">{item.question}</summary>
                  {item.answer ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm opacity-80">{item.answer}</p>
                  ) : null}
                </details>
              ),
            )}
          </div>
        </Section>
      );
    }

    case "testimonial": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <figure className="mx-auto max-w-2xl text-center">
            <Quote className="mx-auto mb-4 size-8 opacity-40" />
            <Txt
              editable={editable}
              as="p"
              className="text-2xl font-medium leading-snug"
              placeholder="A kind word from someone you helped"
              multiline
              value={block.quote}
              onChange={(quote) => up({ quote })}
            />
            <figcaption className="mt-4 text-sm opacity-70">
              <Txt
                editable={editable}
                as="span"
                className="font-semibold"
                placeholder="Name"
                value={block.author}
                onChange={(author) => up({ author })}
              />
              {editable || block.role ? <span className="opacity-60"> · </span> : null}
              <Txt
                editable={editable}
                as="span"
                placeholder="Role (optional)"
                value={block.role}
                onChange={(role) => up({ role })}
              />
            </figcaption>
          </figure>
        </Section>
      );
    }

    case "video": {
      const embed = toEmbedUrl(block.url);
      return (
        <Section block={block}>
          <div className="mx-auto max-w-3xl">
            {embed ? (
              <div className="aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={embed}
                  title={block.caption || "Video"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : editable ? (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-current/30 text-sm opacity-60">
                <span className="flex items-center gap-2">
                  <Video className="size-4" /> Paste a YouTube or Vimeo link in the panel
                </span>
              </div>
            ) : null}
            <Txt
              editable={editable}
              as="p"
              className="mt-2 text-center text-sm opacity-70"
              placeholder="Caption (optional)"
              value={block.caption}
              onChange={(caption) => edit?.onChange({ ...block, caption })}
            />
          </div>
        </Section>
      );
    }

    case "map": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const src = block.address
        ? `https://maps.google.com/maps?q=${encodeURIComponent(block.address)}&output=embed`
        : null;
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-8 text-center text-3xl font-semibold tracking-tight"
            placeholder="Find us"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="mx-auto max-w-3xl">
            {src ? (
              <div className="aspect-video overflow-hidden rounded-xl border border-current/10">
                <iframe src={src} title="Map" className="h-full w-full" loading="lazy" />
              </div>
            ) : editable ? (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-current/30 text-sm opacity-60">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" /> Enter an address in the panel
                </span>
              </div>
            ) : null}
          </div>
        </Section>
      );
    }

    case "divider":
      return (
        <Section block={block}>
          <hr className="border-current/15" />
        </Section>
      );
  }
}
