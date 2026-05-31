import type { Frame } from "./blocks";

// Pure geometry for aligning and distributing a set of frames. These operate on
// a flat array of frames (in selection order) and return a new array in the same
// order, so the editor can map the results back onto the right blocks. Keeping
// the math here makes it straightforward to test without the canvas.

export type AlignMode = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";

// Align every frame to the shared edge or center of the selection's bounding
// box. A no-op for fewer than two frames.
export function alignFrames(frames: Frame[], mode: AlignMode): Frame[] {
  if (frames.length < 2) return frames;
  const minX = Math.min(...frames.map((f) => f.x));
  const maxRight = Math.max(...frames.map((f) => f.x + f.w));
  const minY = Math.min(...frames.map((f) => f.y));
  const maxBottom = Math.max(...frames.map((f) => f.y + f.h));
  const centerX = (minX + maxRight) / 2;
  const centerY = (minY + maxBottom) / 2;

  return frames.map((f) => {
    switch (mode) {
      case "left":
        return { ...f, x: minX };
      case "right":
        return { ...f, x: maxRight - f.w };
      case "hcenter":
        return { ...f, x: Math.round(centerX - f.w / 2) };
      case "top":
        return { ...f, y: minY };
      case "bottom":
        return { ...f, y: maxBottom - f.h };
      case "vcenter":
        return { ...f, y: Math.round(centerY - f.h / 2) };
      default:
        return f;
    }
  });
}

// Spread frames so the gaps between them are equal, keeping the two outermost
// frames fixed. Needs at least three frames to have an inner one to move.
export function distributeFrames(frames: Frame[], axis: DistributeAxis): Frame[] {
  if (frames.length < 3) return frames;
  const horizontal = axis === "horizontal";
  const pos = (f: Frame) => (horizontal ? f.x : f.y);
  const size = (f: Frame) => (horizontal ? f.w : f.h);

  const order = frames
    .map((frame, index) => ({ frame, index }))
    .sort((a, b) => pos(a.frame) - pos(b.frame));
  const firstO = order[0];
  const lastO = order[order.length - 1];
  if (!firstO || !lastO) return frames;
  const first = firstO.frame;
  const last = lastO.frame;
  const span = pos(last) + size(last) - pos(first);
  const totalSize = order.reduce((sum, o) => sum + size(o.frame), 0);
  const gap = (span - totalSize) / (order.length - 1);

  const out = frames.slice();
  let cursor = pos(first);
  for (const { frame, index } of order) {
    out[index] = horizontal
      ? { ...frame, x: Math.round(cursor) }
      : { ...frame, y: Math.round(cursor) };
    cursor += size(frame) + gap;
  }
  return out;
}

// A rectangle with no z, e.g. a marquee selection box.
type Box = { x: number; y: number; w: number; h: number };

// True when two rectangles overlap at all. Used by the marquee to decide which
// blocks fall inside the drawn rectangle.
export function framesIntersect(a: Box, b: Box): boolean {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}
