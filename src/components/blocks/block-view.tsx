import { ImageIcon, Mail, MapPin, Phone } from "lucide-react";
import type { Block } from "@/lib/blocks";
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

/** Renders a single block as it appears on the published site. */
export function BlockView({ block, editing = false }: { block: Block; editing?: boolean }) {
  const onDark = block.background === "primary" || block.background === "dark";

  switch (block.type) {
    case "hero":
      return (
        <Section block={block}>
          <div className={cn("space-y-5", block.align === "center" && "text-center")}>
            {block.heading ? (
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{block.heading}</h1>
            ) : null}
            {block.subheading ? (
              <p className="mx-auto max-w-2xl text-lg opacity-90">{block.subheading}</p>
            ) : null}
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt={block.heading || "Hero"}
                className="mx-auto mt-6 max-h-[420px] w-full rounded-xl object-cover"
              />
            ) : editing ? (
              <div className="mt-6">
                <Placeholder label="Optional hero image" />
              </div>
            ) : null}
            {block.buttonText ? (
              <div className={cn(block.align === "center" ? "flex justify-center" : "")}>
                <a href={block.buttonUrl || "#"} className={buttonClass(onDark)}>
                  {block.buttonText}
                </a>
              </div>
            ) : null}
          </div>
        </Section>
      );

    case "text":
      return (
        <Section block={block}>
          <div className={cn("space-y-4", block.align === "center" && "text-center")}>
            {block.heading ? (
              <h2 className="text-3xl font-semibold tracking-tight">{block.heading}</h2>
            ) : null}
            {block.body ? (
              <p className="mx-auto max-w-3xl whitespace-pre-wrap text-lg leading-relaxed opacity-90">
                {block.body}
              </p>
            ) : null}
          </div>
        </Section>
      );

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
            ) : editing ? (
              <Placeholder label="Add an image" />
            ) : null}
            {block.caption ? (
              <figcaption className="mt-2 text-center text-sm opacity-70">
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        </Section>
      );

    case "gallery":
      return (
        <Section block={block}>
          {block.heading ? (
            <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">
              {block.heading}
            </h2>
          ) : null}
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
              ) : editing ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: gallery items have no stable id
                <Placeholder key={i} label="Image" />
              ) : null,
            )}
          </div>
        </Section>
      );

    case "features":
      return (
        <Section block={block}>
          {block.heading ? (
            <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
              {block.heading}
            </h2>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(block.items ?? []).map((item, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: feature items have no stable id
                key={i}
                className="rounded-xl border border-current/10 bg-current/5 p-6"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm opacity-80">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      );

    case "cta":
      return (
        <Section block={block}>
          <div className="space-y-4 text-center">
            {block.heading ? (
              <h2 className="text-3xl font-semibold tracking-tight">{block.heading}</h2>
            ) : null}
            {block.text ? <p className="text-lg opacity-90">{block.text}</p> : null}
            {block.buttonText ? (
              <div className="flex justify-center pt-2">
                <a href={block.buttonUrl || "#"} className={buttonClass(onDark)}>
                  {block.buttonText}
                </a>
              </div>
            ) : null}
          </div>
        </Section>
      );

    case "contact":
      return (
        <Section block={block}>
          <div id="contact" className="space-y-6 text-center">
            {block.heading ? (
              <h2 className="text-3xl font-semibold tracking-tight">{block.heading}</h2>
            ) : null}
            <div className="flex flex-col items-center gap-3 text-base">
              {block.email ? (
                <a
                  href={`mailto:${block.email}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Mail className="size-4" /> {block.email}
                </a>
              ) : null}
              {block.phone ? (
                <a href={`tel:${block.phone}`} className="flex items-center gap-2 hover:underline">
                  <Phone className="size-4" /> {block.phone}
                </a>
              ) : null}
              {block.address ? (
                <span className="flex items-center gap-2 opacity-80">
                  <MapPin className="size-4" /> {block.address}
                </span>
              ) : null}
            </div>
          </div>
        </Section>
      );

    case "divider":
      return (
        <Section block={block}>
          <hr className="border-current/15" />
        </Section>
      );
  }
}
