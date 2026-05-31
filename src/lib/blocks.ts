import * as v from "valibot";

// A one-page website is an ordered list of blocks. Each block is a section with
// a type and its own fields. This module is the single source of truth for the
// block shapes, their validation, and the defaults used when adding a block.

export const BACKGROUNDS = ["default", "muted", "primary", "dark"] as const;
export const PADDINGS = ["sm", "md", "lg"] as const;
export const ALIGNMENTS = ["left", "center"] as const;
export const IMAGE_SIZES = ["normal", "wide", "full"] as const;

// The free-form canvas is laid out on a fixed design width. Every frame
// coordinate is expressed in pixels relative to this width; the public page
// scales the whole canvas to fit the viewport so what you build is what ships.
export const DESIGN_WIDTH = 1200;
export const DEFAULT_CANVAS_HEIGHT = 1400;
export const GRID = 8;

// Absolute position and size of a block on the canvas.
export const frameSchema = v.object({
  x: v.optional(v.number(), 80),
  y: v.optional(v.number(), 40),
  w: v.optional(v.number(), 1040),
  h: v.optional(v.number(), 240),
  z: v.optional(v.number(), 1),
});

// Per-block visual overrides. Empty string means "inherit from the theme".
export const blockStyleSchema = v.object({
  bg: v.optional(v.string(), ""),
  color: v.optional(v.string(), ""),
  radius: v.optional(v.number(), 0),
  padding: v.optional(v.number(), 24),
  opacity: v.optional(v.number(), 100),
  shadow: v.optional(v.boolean(), false),
  border: v.optional(v.boolean(), false),
});

const styleFields = {
  background: v.optional(v.picklist(BACKGROUNDS), "default"),
  padding: v.optional(v.picklist(PADDINGS), "lg"),
  frame: v.optional(frameSchema),
  style: v.optional(blockStyleSchema),
};

export type Frame = v.InferOutput<typeof frameSchema>;
export type BlockStyle = v.InferOutput<typeof blockStyleSchema>;

const idField = v.pipe(v.string(), v.minLength(1));

export const heroSchema = v.object({
  id: idField,
  type: v.literal("hero"),
  heading: v.optional(v.string(), ""),
  subheading: v.optional(v.string(), ""),
  buttonText: v.optional(v.string(), ""),
  buttonUrl: v.optional(v.string(), ""),
  imageUrl: v.optional(v.string(), ""),
  align: v.optional(v.picklist(ALIGNMENTS), "center"),
  ...styleFields,
});

export const textSchema = v.object({
  id: idField,
  type: v.literal("text"),
  heading: v.optional(v.string(), ""),
  body: v.optional(v.string(), ""),
  align: v.optional(v.picklist(ALIGNMENTS), "left"),
  ...styleFields,
});

export const imageSchema = v.object({
  id: idField,
  type: v.literal("image"),
  url: v.optional(v.string(), ""),
  caption: v.optional(v.string(), ""),
  size: v.optional(v.picklist(IMAGE_SIZES), "wide"),
  ...styleFields,
});

export const galleryItemSchema = v.object({
  url: v.optional(v.string(), ""),
  caption: v.optional(v.string(), ""),
});

export const gallerySchema = v.object({
  id: idField,
  type: v.literal("gallery"),
  heading: v.optional(v.string(), ""),
  items: v.optional(v.array(galleryItemSchema), []),
  ...styleFields,
});

export const featureItemSchema = v.object({
  title: v.optional(v.string(), ""),
  description: v.optional(v.string(), ""),
});

export const featuresSchema = v.object({
  id: idField,
  type: v.literal("features"),
  heading: v.optional(v.string(), ""),
  items: v.optional(v.array(featureItemSchema), []),
  ...styleFields,
});

export const ctaSchema = v.object({
  id: idField,
  type: v.literal("cta"),
  heading: v.optional(v.string(), ""),
  text: v.optional(v.string(), ""),
  buttonText: v.optional(v.string(), ""),
  buttonUrl: v.optional(v.string(), ""),
  ...styleFields,
});

export const contactSchema = v.object({
  id: idField,
  type: v.literal("contact"),
  heading: v.optional(v.string(), ""),
  email: v.optional(v.string(), ""),
  phone: v.optional(v.string(), ""),
  address: v.optional(v.string(), ""),
  ...styleFields,
});

export const hoursItemSchema = v.object({
  label: v.optional(v.string(), ""),
  value: v.optional(v.string(), ""),
});

export const hoursSchema = v.object({
  id: idField,
  type: v.literal("hours"),
  heading: v.optional(v.string(), ""),
  items: v.optional(v.array(hoursItemSchema), []),
  ...styleFields,
});

export const faqItemSchema = v.object({
  question: v.optional(v.string(), ""),
  answer: v.optional(v.string(), ""),
});

export const faqSchema = v.object({
  id: idField,
  type: v.literal("faq"),
  heading: v.optional(v.string(), ""),
  items: v.optional(v.array(faqItemSchema), []),
  ...styleFields,
});

export const testimonialSchema = v.object({
  id: idField,
  type: v.literal("testimonial"),
  quote: v.optional(v.string(), ""),
  author: v.optional(v.string(), ""),
  role: v.optional(v.string(), ""),
  ...styleFields,
});

export const videoSchema = v.object({
  id: idField,
  type: v.literal("video"),
  url: v.optional(v.string(), ""),
  caption: v.optional(v.string(), ""),
  ...styleFields,
});

export const mapSchema = v.object({
  id: idField,
  type: v.literal("map"),
  heading: v.optional(v.string(), ""),
  address: v.optional(v.string(), ""),
  ...styleFields,
});

export const blockSchema = v.variant("type", [
  heroSchema,
  textSchema,
  imageSchema,
  gallerySchema,
  featuresSchema,
  ctaSchema,
  contactSchema,
  hoursSchema,
  faqSchema,
  testimonialSchema,
  videoSchema,
  mapSchema,
  v.object({ id: idField, type: v.literal("divider"), ...styleFields }),
]);

export const blocksSchema = v.array(blockSchema);

export type Block = v.InferOutput<typeof blockSchema>;
export type BlockType = Block["type"];
export type HeroBlock = v.InferOutput<typeof heroSchema>;
export type TextBlock = v.InferOutput<typeof textSchema>;
export type ImageBlock = v.InferOutput<typeof imageSchema>;
export type GalleryBlock = v.InferOutput<typeof gallerySchema>;
export type FeaturesBlock = v.InferOutput<typeof featuresSchema>;
export type CtaBlock = v.InferOutput<typeof ctaSchema>;
export type ContactBlock = v.InferOutput<typeof contactSchema>;
export type HoursBlock = v.InferOutput<typeof hoursSchema>;
export type FaqBlock = v.InferOutput<typeof faqSchema>;
export type TestimonialBlock = v.InferOutput<typeof testimonialSchema>;
export type VideoBlock = v.InferOutput<typeof videoSchema>;
export type MapBlock = v.InferOutput<typeof mapSchema>;

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Sensible starter content for each block type so a new section looks complete.
export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        heading: "Willkommen auf unserer Website",
        subheading: "Ein kurzer, freundlicher Satz darüber, was ihr macht.",
        buttonText: "Kontakt aufnehmen",
        buttonUrl: "#contact",
        imageUrl: "",
        align: "center",
        background: "primary",
        padding: "lg",
      };
    case "text":
      return {
        id,
        type,
        heading: "Über uns",
        body: "Erzählt euren Besuchern, wer ihr seid und was euch besonders macht. Haltet es warm und einfach.",
        align: "left",
        background: "default",
        padding: "lg",
      };
    case "image":
      return { id, type, url: "", caption: "", size: "wide", background: "default", padding: "md" };
    case "gallery":
      return {
        id,
        type,
        heading: "Galerie",
        items: [
          { url: "", caption: "" },
          { url: "", caption: "" },
          { url: "", caption: "" },
        ],
        background: "default",
        padding: "lg",
      };
    case "features":
      return {
        id,
        type,
        heading: "Was wir bieten",
        items: [
          { title: "Erstes Angebot", description: "Ein Satz dazu." },
          { title: "Zweites Angebot", description: "Ein Satz dazu." },
          { title: "Drittes Angebot", description: "Ein Satz dazu." },
        ],
        background: "muted",
        padding: "lg",
      };
    case "cta":
      return {
        id,
        type,
        heading: "Bereit loszulegen?",
        text: "Meldet euch und wir kommen auf euch zurück.",
        buttonText: "Kontakt",
        buttonUrl: "#contact",
        background: "primary",
        padding: "lg",
      };
    case "contact":
      return {
        id,
        type,
        heading: "Kontakt aufnehmen",
        email: "hallo@beispiel.de",
        phone: "",
        address: "",
        background: "muted",
        padding: "lg",
      };
    case "hours":
      return {
        id,
        type,
        heading: "Öffnungszeiten",
        items: [
          { label: "Montag bis Freitag", value: "9:00 bis 17:00" },
          { label: "Samstag", value: "10:00 bis 14:00" },
          { label: "Sonntag", value: "Geschlossen" },
        ],
        background: "default",
        padding: "lg",
      };
    case "faq":
      return {
        id,
        type,
        heading: "Häufige Fragen",
        items: [
          { question: "Eine häufige Frage?", answer: "Eine klare, hilfreiche Antwort." },
          { question: "Noch eine Frage?", answer: "Eine weitere hilfreiche Antwort." },
        ],
        background: "default",
        padding: "lg",
      };
    case "testimonial":
      return {
        id,
        type,
        quote: "Sie haben großartige Arbeit geleistet und wir könnten nicht zufriedener sein.",
        author: "Ein zufriedenes Mitglied",
        role: "",
        background: "muted",
        padding: "lg",
      };
    case "video":
      return { id, type, url: "", caption: "", background: "default", padding: "lg" };
    case "map":
      return {
        id,
        type,
        heading: "So findet ihr uns",
        address: "",
        background: "default",
        padding: "lg",
      };
    case "divider":
      return { id, type, background: "default", padding: "sm" };
  }
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  text: "Text",
  image: "Bild",
  gallery: "Galerie",
  features: "Funktionen",
  cta: "Handlungsaufruf",
  contact: "Kontakt",
  hours: "Öffnungszeiten",
  faq: "FAQ",
  testimonial: "Stimme",
  video: "Video",
  map: "Karte",
  divider: "Trenner",
};

// Sensible default size (in canvas pixels) for a freshly added block, so it
// lands on the canvas already looking reasonable.
export const DEFAULT_SIZES: Record<BlockType, { w: number; h: number }> = {
  hero: { w: 1040, h: 460 },
  text: { w: 760, h: 220 },
  image: { w: 720, h: 420 },
  gallery: { w: 1040, h: 420 },
  features: { w: 1040, h: 320 },
  cta: { w: 880, h: 260 },
  contact: { w: 640, h: 300 },
  hours: { w: 560, h: 320 },
  faq: { w: 760, h: 360 },
  testimonial: { w: 760, h: 300 },
  video: { w: 880, h: 520 },
  map: { w: 880, h: 480 },
  divider: { w: 1040, h: 40 },
};

// Compute a frame for a new block, dropping it below whatever is already on the
// canvas so blocks do not pile up on top of each other.
export function placeNewBlock(type: BlockType, existing: Block[]): Frame {
  const size = DEFAULT_SIZES[type];
  const bottom = existing.reduce((max, b) => {
    const f = b.frame;
    return f ? Math.max(max, f.y + f.h) : max;
  }, 0);
  const x = Math.max(0, Math.round((DESIGN_WIDTH - size.w) / 2));
  const y = existing.length === 0 ? 40 : bottom + GRID * 3;
  const z = existing.reduce((max, b) => Math.max(max, b.frame?.z ?? 1), 0) + 1;
  return { x, y, w: size.w, h: size.h, z };
}

// Snap a value to the editing grid.
export function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

// Convert a YouTube or Vimeo watch URL into an embeddable URL.
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
