import { type Block, type BlockType, createBlock } from "@/lib/blocks";

// Builds a block of the given type and overrides some of its fields, keeping
// the generated id and defaults for everything else.
function block<T extends BlockType>(type: T, overrides: Record<string, unknown>): Block {
  return { ...createBlock(type), ...overrides } as Block;
}

export interface Template {
  id: string;
  label: string;
  description: string;
  themeColor: string;
  build: () => Block[];
}

export const TEMPLATES: Template[] = [
  {
    id: "club",
    label: "Club or society",
    description: "Hero, about, activities, and contact.",
    themeColor: "#059669",
    build: () => [
      block("hero", {
        heading: "Riverside Running Club",
        subheading: "Group runs every week for all abilities. New faces always welcome.",
        buttonText: "Join us",
        buttonUrl: "#contact",
        background: "primary",
      }),
      block("text", {
        heading: "About the club",
        body: "We have met every Saturday morning for over ten years. Whether you are training for a marathon or just want to get moving, there is a group for you.",
      }),
      block("features", {
        heading: "What we do",
        items: [
          { title: "Weekly runs", description: "Saturdays at 9am from the boathouse." },
          { title: "All abilities", description: "Beginner, social, and faster groups." },
          { title: "Social events", description: "Monthly meet-ups and an annual dinner." },
        ],
        background: "muted",
      }),
      block("hours", { heading: "When we meet" }),
      block("contact", { heading: "Get in touch", email: "hello@riverside.example" }),
    ],
  },
  {
    id: "business",
    label: "Local business",
    description: "Hero, services, gallery, hours, and a map.",
    themeColor: "#d97706",
    build: () => [
      block("hero", {
        heading: "Sunrise Bakery",
        subheading: "Fresh bread and pastries baked every morning.",
        buttonText: "Visit the shop",
        buttonUrl: "#contact",
        background: "primary",
      }),
      block("features", {
        heading: "What we bake",
        items: [
          { title: "Sourdough", description: "Slow fermented over two days." },
          { title: "Pastries", description: "All butter, made fresh each morning." },
          { title: "Celebration cakes", description: "Made to order for any occasion." },
        ],
        background: "muted",
      }),
      block("gallery", { heading: "From the kitchen" }),
      block("hours", { heading: "Opening hours" }),
      block("map", { heading: "Find us", address: "" }),
      block("contact", { heading: "Contact us", email: "hello@sunrise.example" }),
    ],
  },
  {
    id: "parish",
    label: "Parish or community",
    description: "Welcome, services, news, and contact.",
    themeColor: "#4338ca",
    build: () => [
      block("hero", {
        heading: "St. Mary's Parish",
        subheading: "A warm and welcoming community in the heart of the village.",
        buttonText: "Service times",
        buttonUrl: "#contact",
        background: "primary",
      }),
      block("text", {
        heading: "Welcome",
        body: "All are welcome here. Join us for worship, fellowship, and community events throughout the week.",
      }),
      block("hours", {
        heading: "Service times",
        items: [
          { label: "Sunday", value: "8:00 & 10:30" },
          { label: "Wednesday", value: "18:00" },
          { label: "Office hours", value: "Mon–Fri 9:00–13:00" },
        ],
      }),
      block("faq", { heading: "Common questions" }),
      block("contact", { heading: "Contact the office", email: "office@stmarys.example" }),
    ],
  },
];
