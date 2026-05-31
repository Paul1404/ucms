import { describe, expect, it } from "vitest";
import { type Block, createBlock } from "./blocks";
import { hasClipboard, readClipboard, writeClipboard } from "./clipboard";

describe("editor clipboard", () => {
  it("round-trips a block through copy and read", () => {
    const block = { ...createBlock("hero"), heading: "Kopiermich" } as Block;
    writeClipboard(block);
    const back = readClipboard();
    expect(back).not.toBeNull();
    expect(back?.id).toBe(block.id);
    if (back?.type === "hero") expect(back.heading).toBe("Kopiermich");
  });

  it("reports a non-empty clipboard after a write", () => {
    writeClipboard(createBlock("text") as Block);
    expect(hasClipboard()).toBe(true);
  });

  it("returns the most recently copied block", () => {
    const first = { ...createBlock("text"), heading: "Erst" } as Block;
    const second = { ...createBlock("text"), heading: "Zweit" } as Block;
    writeClipboard(first);
    writeClipboard(second);
    expect(readClipboard()?.id).toBe(second.id);
  });
});
