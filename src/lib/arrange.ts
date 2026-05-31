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

const DEFAULT_SNAP = 6;

function nearest(value: number, candidates: number[], threshold: number): number | null {
  let best: number | null = null;
  for (const c of candidates) {
    const d = c - value;
    if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  }
  return best;
}

export type DimensionSnap = {
  // Shift to apply to the dimension (0 when nothing snapped).
  delta: number;
  // The guide line the moving edge aligned to, or null for a size match.
  line: number | null;
  // True when the snap matched a sibling's size rather than a guide line.
  matched: boolean;
  // Whether any snap applied (the caller grid-snaps when false).
  snapped: boolean;
};

// Decide how a resized dimension should snap. A dimension can either align its
// moving edge to a guide line (a neighbour's edge, the canvas center) or take a
// sibling's exact size, whichever is nearer. Edge alignment draws a guide; a
// size match is reported via `matched` so the UI can flag it.
export function snapDimension(
  value: number,
  edge: number,
  lines: number[],
  sizes: number[],
  threshold = DEFAULT_SNAP,
): DimensionSnap {
  const edgeDelta = nearest(edge, lines, threshold);
  const sizeDelta = nearest(value, sizes, threshold);
  if (edgeDelta !== null && (sizeDelta === null || Math.abs(edgeDelta) <= Math.abs(sizeDelta))) {
    return { delta: edgeDelta, line: edge + edgeDelta, matched: false, snapped: true };
  }
  if (sizeDelta !== null) {
    return { delta: sizeDelta, line: null, matched: true, snapped: true };
  }
  return { delta: 0, line: null, matched: false, snapped: false };
}
