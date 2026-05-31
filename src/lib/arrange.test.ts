import { describe, expect, it } from "vitest";
import { alignFrames, distributeFrames, framesIntersect } from "./arrange";
import type { Frame } from "./blocks";

const f = (x: number, y: number, w: number, h: number): Frame => ({ x, y, w, h, z: 1 });

describe("alignFrames", () => {
  it("aligns all frames to the left edge of the bounding box", () => {
    const out = alignFrames([f(100, 0, 50, 20), f(40, 0, 80, 20), f(70, 0, 30, 20)], "left");
    expect(out.map((r) => r.x)).toEqual([40, 40, 40]);
  });

  it("aligns to the right edge using each frame's own width", () => {
    const out = alignFrames([f(0, 0, 50, 20), f(0, 0, 80, 20)], "right");
    // bounding right edge is 80; each frame's x = right - its width
    expect(out.map((r) => r.x)).toEqual([30, 0]);
  });

  it("centers horizontally on the bounding box center", () => {
    const out = alignFrames([f(0, 0, 40, 20), f(60, 0, 40, 20)], "hcenter");
    // bounds 0..100, center 50, each width 40 -> x = 30
    expect(out.map((r) => r.x)).toEqual([30, 30]);
  });

  it("aligns to top and bottom", () => {
    const top = alignFrames([f(0, 10, 20, 20), f(0, 50, 20, 40)], "top");
    expect(top.map((r) => r.y)).toEqual([10, 10]);
    const bottom = alignFrames([f(0, 10, 20, 20), f(0, 50, 20, 40)], "bottom");
    // bounds bottom is 90; y = 90 - height
    expect(bottom.map((r) => r.y)).toEqual([70, 50]);
  });

  it("is a no-op for a single frame", () => {
    const one = [f(5, 5, 10, 10)];
    expect(alignFrames(one, "left")).toEqual(one);
  });
});

describe("distributeFrames", () => {
  it("spreads three frames to equal horizontal gaps, keeping the ends fixed", () => {
    const out = distributeFrames(
      [f(0, 0, 10, 10), f(20, 0, 10, 10), f(100, 0, 10, 10)],
      "horizontal",
    );
    // ends fixed at 0 and 100; span = 110, total width = 30, gap = (110-30)/2 = 40
    // positions: 0, 0+10+40=50, 50+10+40=100
    expect(out.map((r) => r.x)).toEqual([0, 50, 100]);
  });

  it("distributes regardless of input order", () => {
    const out = distributeFrames(
      [f(100, 0, 10, 10), f(0, 0, 10, 10), f(20, 0, 10, 10)],
      "horizontal",
    );
    // same set, returned in original order: the x=20 frame moves to 50
    expect(out.map((r) => r.x)).toEqual([100, 0, 50]);
  });

  it("spreads vertically", () => {
    const out = distributeFrames([f(0, 0, 10, 10), f(0, 5, 10, 10), f(0, 100, 10, 10)], "vertical");
    expect(out.map((r) => r.y)).toEqual([0, 50, 100]);
  });

  it("is a no-op for fewer than three frames", () => {
    const two = [f(0, 0, 10, 10), f(50, 0, 10, 10)];
    expect(distributeFrames(two, "horizontal")).toEqual(two);
  });
});

describe("framesIntersect", () => {
  it("detects overlap", () => {
    expect(framesIntersect(f(0, 0, 50, 50), f(40, 40, 50, 50))).toBe(true);
  });

  it("detects separation", () => {
    expect(framesIntersect(f(0, 0, 10, 10), f(100, 100, 10, 10))).toBe(false);
  });
});
