import { describe, expect, it } from "vitest";
import { type Block, createBlock } from "./blocks";
import { hasClipboard, readClipboard, writeClipboard } from "./clipboard";

describe("editor clipboard", () => {
  it("round-trips a single block through copy and read", () => {
    const block = { ...createBlock("hero"), heading: "Kopiermich" } as Block;
    writeClipboard([block]);
    const back = readClipboard();
    expect(back).toHaveLength(1);
    expect(back[0]?.id).toBe(block.id);
    if (back[0]?.type === "hero") expect(back[0].heading).toBe("Kopiermich");
  });

  it("round-trips several blocks at once", () => {
    const blocks = [createBlock("text"), createBlock("image"), createBlock("cta")] as Block[];
    writeClipboard(blocks);
    expect(readClipboard().map((b) => b.id)).toEqual(blocks.map((b) => b.id));
  });

  it("reports a non-empty clipboard after a write", () => {
    writeClipboard([createBlock("text") as Block]);
    expect(hasClipboard()).toBe(true);
  });

  it("returns the most recently copied selection", () => {
    const first = { ...createBlock("text"), heading: "Erst" } as Block;
    const second = { ...createBlock("text"), heading: "Zweit" } as Block;
    writeClipboard([first]);
    writeClipboard([second]);
    expect(readClipboard()[0]?.id).toBe(second.id);
  });
});
