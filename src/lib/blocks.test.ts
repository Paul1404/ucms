import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { BLOCK_LABELS, type BlockType, blockSchema, blocksSchema, createBlock } from "./blocks";

const ALL_TYPES: BlockType[] = [
  "hero",
  "text",
  "image",
  "gallery",
  "features",
  "cta",
  "contact",
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
