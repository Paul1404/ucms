import * as v from "valibot";
import { type Block, blockSchema } from "./blocks";

// A tiny clipboard for editor blocks. It keeps an in-memory copy so copy/paste
// works reliably within the session, and mirrors to localStorage so a block can
// be pasted after a reload or into a different site in another tab. Anything
// read back from storage is validated against the block schema before use, so a
// stale or hand-edited entry can never crash the editor.

const KEY = "ucms:clipboard:block";

let memory: Block | null = null;

export function writeClipboard(block: Block): void {
  memory = block;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(block));
    }
  } catch {
    // Private mode or quota errors are fine; the in-memory copy still works.
  }
}

export function readClipboard(): Block | null {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = v.safeParse(blockSchema, JSON.parse(raw));
        if (parsed.success) return parsed.output;
      }
    }
  } catch {
    // Fall back to the in-memory copy below.
  }
  return memory;
}

export function hasClipboard(): boolean {
  return readClipboard() !== null;
}
