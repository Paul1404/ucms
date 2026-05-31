import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  BLOCK_LABELS,
  type Block,
  type BlockType,
  blockSchema,
  blocksSchema,
  createBlock,
  DESIGN_WIDTH,
  GRID,
  placeNewBlock,
  snap,
  toEmbedUrl,
} from "./blocks";

const ALL_TYPES: BlockType[] = [
  "hero",
  "text",
  "image",
  "gallery",
  "features",
  "cta",
  "contact",
  "hours",
  "faq",
  "testimonial",
  "video",
  "map",
  "divider",
];

describe("createBlock", () => {
  it("produces a valid block for every type", () => {
    for (const type of ALL_TYPES) {
      const block = createBlock(type);
      expect(block.type).toBe(type);
      expect(block.id).toBeTruthy();
      const result = v.safeParse(blockSchema, block);
      expect(result.success).toBe(true);
    }
  });

  it("gives each block a unique id", () => {
    const a = createBlock("hero");
    const b = createBlock("hero");
    expect(a.id).not.toBe(b.id);
  });

  it("has a label for every block type", () => {
    for (const type of ALL_TYPES) {
      expect(BLOCK_LABELS[type]).toBeTruthy();
    }
  });
});

describe("blocksSchema", () => {
  it("accepts an array of blocks", () => {
    const blocks = [createBlock("hero"), createBlock("text"), createBlock("contact")];
    expect(v.safeParse(blocksSchema, blocks).success).toBe(true);
  });

  it("rejects an unknown block type", () => {
    expect(v.safeParse(blocksSchema, [{ id: "1", type: "banana" }]).success).toBe(false);
  });

  it("rejects a block without an id", () => {
    expect(v.safeParse(blockSchema, { type: "divider" }).success).toBe(false);
  });

  it("applies defaults for optional style fields", () => {
    const parsed = v.parse(blockSchema, { id: "x", type: "text" });
    expect(parsed.background).toBe("default");
    expect(parsed.padding).toBe("lg");
  });
});

describe("placeNewBlock", () => {
  it("centers the first block horizontally on the design canvas", () => {
    const frame = placeNewBlock("text", []);
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.w).toBeLessThanOrEqual(DESIGN_WIDTH);
    expect(frame.y).toBe(40);
    expect(frame.z).toBe(1);
  });

  it("drops a new block below existing ones with a higher z-index", () => {
    const first = { ...createBlock("hero"), frame: placeNewBlock("hero", []) } as Block;
    const second = placeNewBlock("text", [first]);
    const firstBottom = (first.frame?.y ?? 0) + (first.frame?.h ?? 0);
    expect(second.y).toBeGreaterThan(firstBottom);
    expect(second.z).toBeGreaterThan(first.frame?.z ?? 1);
  });
});

describe("snap", () => {
  it("rounds to the editing grid", () => {
    expect(snap(0)).toBe(0);
    expect(snap(GRID + 1)).toBe(GRID);
    expect(snap(GRID * 2 - 1)).toBe(GRID * 2);
  });
});

describe("frame and style on blocks", () => {
  it("accepts a block with a frame and style overrides", () => {
    const block = {
      ...createBlock("text"),
      frame: { x: 10, y: 20, w: 300, h: 150, z: 2 },
      style: {
        bg: "#ffffff",
        color: "#000000",
        radius: 8,
        padding: 16,
        opacity: 90,
        shadow: true,
        border: false,
      },
    };
    expect(v.safeParse(blockSchema, block).success).toBe(true);
  });
});

describe("toEmbedUrl", () => {
  it("converts YouTube links", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts Vimeo links", () => {
    expect(toEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871",
    );
  });

  it("returns null for unsupported or empty input", () => {
    expect(toEmbedUrl("")).toBeNull();
    expect(toEmbedUrl("https://example.com/video")).toBeNull();
  });
});
