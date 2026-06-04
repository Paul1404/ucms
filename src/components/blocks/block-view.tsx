import {
  ArrowRight,
  CalendarDays,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Quote,
  User,
  Video,
} from "lucide-react";
import { createContext, createElement, useContext } from "react";
import { InlineText } from "@/components/editor/inline-text";
import { type Block, type SocialPlatform, toEmbedUrl } from "@/lib/blocks";
import { cn } from "@/lib/utils";

// Brand glyph paths (24x24 viewBox, from simple-icons). lucide-react dropped its
// brand icons, so the social marks are inlined here. Website and email reuse
// lucide outline icons and are handled separately in SocialIcon.
const BRAND_PATHS: Partial<Record<SocialPlatform, string>> = {
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  twitter:
    "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  website: "Webseite",
  email: "E-Mail",
};

function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  if (platform === "website") return <Globe className={className} />;
  if (platform === "email") return <Mail className={className} />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label={SOCIAL_LABELS[platform]}
    >
      <path d={BRAND_PATHS[platform] ?? ""} />
    </svg>
  );
}

// A social link points at a mailto: for the email platform, otherwise straight
// at the given URL.
function socialHref(platform: SocialPlatform, url: string): string {
  if (!url) return "#";
  if (platform === "email") return url.startsWith("mailto:") ? url : `mailto:${url}`;
  return url;
}

// When true, blocks render to fill their absolute frame on the canvas instead
// of as full-width stacked sections. Set by the canvas renderers.
export const CanvasModeContext = createContext(false);

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

// In canvas mode (`bare`) the block fills its frame and the surrounding frame
// wrapper supplies background, padding, and radius. In stack mode it renders as
// a full-width section with the classic background/spacing presets.
function Section({ block, children }: { block: Block; children: React.ReactNode }) {
  const bare = useContext(CanvasModeContext);
  if (bare) {
    return <div className="flex h-full w-full flex-col justify-center">{children}</div>;
  }
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

    case "events": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-8 text-center text-3xl font-semibold tracking-tight"
            placeholder="Termine"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <ul className="mx-auto max-w-2xl divide-y divide-current/10">
            {(block.items ?? []).map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
              <li key={i} className="flex items-start gap-4 py-4">
                <CalendarDays className="mt-1 size-5 shrink-0 opacity-50" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium opacity-70">
                    <Txt
                      editable={editable}
                      as="span"
                      placeholder="Tag"
                      value={item.date}
                      onChange={(date) => setItem(i, { date })}
                    />
                    <Txt
                      editable={editable}
                      as="span"
                      placeholder="Uhrzeit"
                      value={item.time}
                      onChange={(time) => setItem(i, { time })}
                    />
                  </div>
                  <Txt
                    editable={editable}
                    as="p"
                    className="text-lg font-semibold leading-snug"
                    placeholder="Titel des Termins"
                    value={item.title}
                    onChange={(title) => setItem(i, { title })}
                  />
                  <Txt
                    editable={editable}
                    as="p"
                    className="text-sm opacity-70"
                    placeholder="Ort (optional)"
                    value={item.location}
                    onChange={(location) => setItem(i, { location })}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case "team": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-10 text-center text-3xl font-semibold tracking-tight"
            placeholder="Unser Team"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(block.items ?? []).map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: cards have no stable id
              <div key={i} className="flex flex-col items-center text-center">
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.name || "Foto"}
                    className="size-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-28 items-center justify-center rounded-full bg-current/10">
                    <User className="size-10 opacity-40" />
                  </div>
                )}
                <Txt
                  editable={editable}
                  as="h3"
                  className="mt-4 text-lg font-semibold"
                  placeholder="Name"
                  value={item.name}
                  onChange={(name) => setItem(i, { name })}
                />
                <Txt
                  editable={editable}
                  as="p"
                  className="text-sm opacity-70"
                  placeholder="Rolle"
                  value={item.role}
                  onChange={(role) => setItem(i, { role })}
                />
                {editable ? (
                  <div className="mt-2 flex flex-col items-center gap-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      <InlineText
                        value={item.email}
                        placeholder="E-Mail (optional)"
                        onChange={(email) => setItem(i, { email })}
                      />
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      <InlineText
                        value={item.phone}
                        placeholder="Telefon (optional)"
                        onChange={(phone) => setItem(i, { phone })}
                      />
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col items-center gap-1 text-sm">
                    {item.email ? (
                      <a
                        href={`mailto:${item.email}`}
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        <Mail className="size-3.5" /> {item.email}
                      </a>
                    ) : null}
                    {item.phone ? (
                      <a
                        href={`tel:${item.phone}`}
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        <Phone className="size-3.5" /> {item.phone}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "news": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const setItem = (idx: number, patch: Partial<(typeof block.items)[number]>) =>
        up({ items: block.items.map((it, j) => (j === idx ? { ...it, ...patch } : it)) });
      return (
        <Section block={block}>
          <Txt
            editable={editable}
            as="h2"
            className="mb-10 text-center text-3xl font-semibold tracking-tight"
            placeholder="Aktuelles"
            value={block.heading}
            onChange={(heading) => up({ heading })}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(block.items ?? []).map((item, i) => (
              <article
                // biome-ignore lint/suspicious/noArrayIndexKey: cards have no stable id
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-current/10 bg-current/5"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title || ""}
                    className="aspect-video w-full object-cover"
                  />
                ) : editable ? (
                  <div className="aspect-video w-full">
                    <Placeholder label="Bild (optional)" />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <Txt
                    editable={editable}
                    as="p"
                    className="text-xs font-medium uppercase tracking-wide opacity-60"
                    placeholder="Datum"
                    value={item.date}
                    onChange={(date) => setItem(i, { date })}
                  />
                  <Txt
                    editable={editable}
                    as="h3"
                    className="mt-1 text-lg font-semibold leading-snug"
                    placeholder="Titel"
                    value={item.title}
                    onChange={(title) => setItem(i, { title })}
                  />
                  <Txt
                    editable={editable}
                    as="p"
                    className="mt-2 flex-1 text-sm opacity-80"
                    placeholder="Kurzer Anrisstext"
                    multiline
                    value={item.text}
                    onChange={(text) => setItem(i, { text })}
                  />
                  {editable ? (
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                      <InlineText
                        value={item.linkText}
                        placeholder="Link-Text"
                        onChange={(linkText) => setItem(i, { linkText })}
                      />
                      <ArrowRight className="size-4" />
                    </span>
                  ) : item.linkUrl && item.linkText ? (
                    <a
                      href={item.linkUrl}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {item.linkText} <ArrowRight className="size-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    }

    case "button": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      const cls = cn(
        "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-opacity hover:opacity-90",
        block.variant === "outline"
          ? "border border-current"
          : "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
      );
      return (
        <Section block={block}>
          <div
            className={cn("flex", block.align === "center" ? "justify-center" : "justify-start")}
          >
            {editable ? (
              <span className={cls}>
                <InlineText
                  value={block.text}
                  placeholder="Button-Text"
                  onChange={(text) => up({ text })}
                />
              </span>
            ) : block.text ? (
              <a href={block.url || "#"} className={cls}>
                {block.text}
              </a>
            ) : null}
          </div>
        </Section>
      );
    }

    case "socials": {
      const up = (patch: Partial<typeof block>) => edit?.onChange({ ...block, ...patch });
      return (
        <Section block={block}>
          <div className="text-center">
            <Txt
              editable={editable}
              as="h2"
              className="mb-6 text-2xl font-semibold tracking-tight"
              placeholder="Folgt uns"
              value={block.heading}
              onChange={(heading) => up({ heading })}
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(block.items ?? []).map((item, i) => {
                const platform = item.platform ?? "website";
                if (editable) {
                  return (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
                      key={i}
                      className="flex size-11 items-center justify-center rounded-full border border-current/15"
                      title={SOCIAL_LABELS[platform]}
                    >
                      <SocialIcon platform={platform} className="size-5" />
                    </span>
                  );
                }
                if (!item.url) return null;
                return (
                  <a
                    // biome-ignore lint/suspicious/noArrayIndexKey: list edited by position
                    key={i}
                    href={socialHref(platform, item.url)}
                    target={platform === "email" ? undefined : "_blank"}
                    rel="noreferrer"
                    aria-label={SOCIAL_LABELS[platform]}
                    className="flex size-11 items-center justify-center rounded-full border border-current/15 transition-colors hover:bg-current/10"
                  >
                    <SocialIcon platform={platform} className="size-5" />
                  </a>
                );
              })}
            </div>
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
