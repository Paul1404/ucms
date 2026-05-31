import * as v from "valibot";
import { type Block, blocksSchema } from "./blocks";

// A tiny clipboard for editor blocks. It holds one or more blocks (so a whole
// multi-selection can be copied at once), keeps an in-memory copy so copy/paste
// works reliably within the session, and mirrors to localStorage so blocks can
// be pasted after a reload or into a different site in another tab. Anything
// read back from storage is validated against the block schema before use, so a
// stale or hand-edited entry can never crash the editor.

const KEY = "ucms:clipboard:blocks";

let memory: Block[] = [];

export function writeClipboard(blocks: Block[]): void {
  memory = blocks;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(blocks));
    }
  } catch {
    // Private mode or quota errors are fine; the in-memory copy still works.
  }
}

export function readClipboard(): Block[] {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = v.safeParse(blocksSchema, JSON.parse(raw));
        if (parsed.success && parsed.output.length > 0) return parsed.output;
      }
    }
  } catch {
    // Fall back to the in-memory copy below.
  }
  return memory;
}

export function hasClipboard(): boolean {
  return readClipboard().length > 0;
}
