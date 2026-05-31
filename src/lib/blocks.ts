import * as v from "valibot";

// A one-page website is an ordered list of blocks. Each block is a section with
// a type and its own fields. This module is the single source of truth for the
// block shapes, their validation, and the defaults used when adding a block.

export const BACKGROUNDS = ["default", "muted", "primary", "dark"] as const;
export const PADDINGS = ["sm", "md", "lg"] as const;
export const ALIGNMENTS = ["left", "center"] as const;
export const IMAGE_SIZES = ["normal", "wide", "full"] as const;

const styleFields = {
  background: v.optional(v.picklist(BACKGROUNDS), "default"),
  padding: v.optional(v.picklist(PADDINGS), "lg"),
};

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
        heading: "Welcome to our website",
        subheading: "A short, friendly sentence about what you do.",
        buttonText: "Get in touch",
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
        heading: "About us",
        body: "Tell your visitors who you are and what makes you special. Keep it warm and simple.",
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
        heading: "Gallery",
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
        heading: "What we offer",
        items: [
          { title: "First thing", description: "A sentence about it." },
          { title: "Second thing", description: "A sentence about it." },
          { title: "Third thing", description: "A sentence about it." },
        ],
        background: "muted",
        padding: "lg",
      };
    case "cta":
      return {
        id,
        type,
        heading: "Ready to start?",
        text: "Reach out and we will get back to you.",
        buttonText: "Contact us",
        buttonUrl: "#contact",
        background: "primary",
        padding: "lg",
      };
    case "contact":
      return {
        id,
        type,
        heading: "Get in touch",
        email: "hello@example.com",
        phone: "",
        address: "",
        background: "muted",
        padding: "lg",
      };
    case "hours":
      return {
        id,
        type,
        heading: "Opening hours",
        items: [
          { label: "Monday – Friday", value: "9:00 – 17:00" },
          { label: "Saturday", value: "10:00 – 14:00" },
          { label: "Sunday", value: "Closed" },
        ],
        background: "default",
        padding: "lg",
      };
    case "faq":
      return {
        id,
        type,
        heading: "Frequently asked questions",
        items: [
          { question: "A common question?", answer: "A clear, helpful answer." },
          { question: "Another question?", answer: "Another helpful answer." },
        ],
        background: "default",
        padding: "lg",
      };
    case "testimonial":
      return {
        id,
        type,
        quote: "They did a wonderful job and we could not be happier.",
        author: "A happy member",
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
        heading: "Find us",
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
  image: "Image",
  gallery: "Gallery",
  features: "Features",
  cta: "Call to action",
  contact: "Contact",
  hours: "Opening hours",
  faq: "FAQ",
  testimonial: "Testimonial",
  video: "Video",
  map: "Map",
  divider: "Divider",
};

// Convert a YouTube or Vimeo watch URL into an embeddable URL.
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
