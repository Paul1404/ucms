import { expect, test } from "@playwright/experimental-ct-react";
import type { Block } from "@/lib/blocks";
import { EditorHarness } from "./editor-harness";

// Three text blocks laid out in a row at known design coordinates. The harness
// renders the canvas at scale 1, so design coordinates map straight to client
// pixels once offset by the canvas origin.
type Rect = { x: number; y: number; w: number; h: number };
const A: Rect = { x: 120, y: 120, w: 200, h: 120 };
const B: Rect = { x: 420, y: 120, w: 200, h: 120 };
const C: Rect = { x: 720, y: 120, w: 200, h: 120 };

function block(id: string, r: Rect, heading: string): Block {
  return {
    id,
    type: "text",
    heading,
    body: "",
    align: "left",
    background: "default",
    padding: "lg",
    frame: { ...r, z: 1 },
  } as Block;
}

const blocks = (): Block[] => [
  block("a", A, "Alpha"),
  block("b", B, "Beta"),
  block("c", C, "Gamma"),
];

type Origin = { x: number; y: number };

async function origin(locator: Awaited<ReturnType<typeof getWrap>>): Promise<Origin> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("canvas-wrap not visible");
  return { x: box.x, y: box.y };
}

function getWrap(page: import("@playwright/test").Page) {
  return page.getByTestId("canvas-wrap");
}

const center = (o: Origin, r: Rect) => ({ x: o.x + r.x + r.w / 2, y: o.y + r.y + r.h / 2 });

async function selected(page: import("@playwright/test").Page): Promise<string | null> {
  return page.getByTestId("selected").textContent();
}

async function frameOf(page: import("@playwright/test").Page, id: string) {
  const li = page.locator(`[data-block="${id}"]`);
  return {
    x: Number(await li.getAttribute("data-x")),
    y: Number(await li.getAttribute("data-y")),
    w: Number(await li.getAttribute("data-w")),
    h: Number(await li.getAttribute("data-h")),
    group: (await li.getAttribute("data-group")) ?? "",
  };
}

test("plain click selects one block; clicking another replaces the selection", async ({
  mount,
  page,
}) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);
  const o = await origin(getWrap(page));

  await page.mouse.click(center(o, A).x, center(o, A).y);
  await expect(page.getByTestId("count")).toHaveText("1");
  expect(await selected(page)).toBe("a");

  await page.mouse.click(center(o, C).x, center(o, C).y);
  await expect(page.getByTestId("count")).toHaveText("1");
  expect(await selected(page)).toBe("c");
});

test("shift-click adds, and shift-clicking again toggles back off", async ({ mount, page }) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);
  const o = await origin(getWrap(page));

  await page.mouse.click(center(o, A).x, center(o, A).y);
  await expect(page.getByTestId("count")).toHaveText("1");

  await page.keyboard.down("Shift");
  await page.mouse.click(center(o, B).x, center(o, B).y);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("count")).toHaveText("2");
  expect(await selected(page)).toBe("a,b");

  // Toggling the same block off must not cancel out into a no-op.
  await page.keyboard.down("Shift");
  await page.mouse.click(center(o, B).x, center(o, B).y);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("count")).toHaveText("1");
  expect(await selected(page)).toBe("a");
});

test("rubber-band marquee selects every block it covers", async ({ mount, page }) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);
  const o = await origin(getWrap(page));

  await page.mouse.move(o.x + 10, o.y + 10);
  await page.mouse.down();
  await page.mouse.move(o.x + 950, o.y + 320, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("count")).toHaveText("3");
});

test("clicking a grouped block expands the selection to the whole group", async ({
  mount,
  page,
}) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);
  const o = await origin(getWrap(page));

  // Select b + c, then group them.
  await page.mouse.click(center(o, B).x, center(o, B).y);
  await page.keyboard.down("Shift");
  await page.mouse.click(center(o, C).x, center(o, C).y);
  await page.keyboard.up("Shift");
  await page.getByTestId("group").click();

  // Deselect by clicking empty canvas.
  await page.mouse.click(o.x + 10, o.y + 10);
  await expect(page.getByTestId("count")).toHaveText("0");

  // Clicking one member selects the whole group.
  await page.mouse.click(center(o, B).x, center(o, B).y);
  await expect(page.getByTestId("count")).toHaveText("2");
  expect(await selected(page)).toBe("b,c");

  const fb = await frameOf(page, "b");
  const fc = await frameOf(page, "c");
  expect(fb.group).not.toBe("");
  expect(fb.group).toBe(fc.group);
});

test("dragging one of several selected blocks moves them all by the same delta", async ({
  mount,
  page,
}) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);
  const o = await origin(getWrap(page));

  await page.getByTestId("select-all").click();
  await expect(page.getByTestId("count")).toHaveText("3");

  const before = {
    a: await frameOf(page, "a"),
    b: await frameOf(page, "b"),
    c: await frameOf(page, "c"),
  };

  const from = center(o, A);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 80, from.y + 40, { steps: 10 });
  await page.mouse.up();

  const after = {
    a: await frameOf(page, "a"),
    b: await frameOf(page, "b"),
    c: await frameOf(page, "c"),
  };

  for (const id of ["a", "b", "c"] as const) {
    expect(after[id].x - before[id].x).toBe(80);
    expect(after[id].y - before[id].y).toBe(40);
  }
});

test("align left snaps every selected block to the leftmost edge", async ({ mount, page }) => {
  await mount(<EditorHarness initialBlocks={blocks()} />);

  await page.getByTestId("select-all").click();
  await page.getByTestId("align-left").click();

  for (const id of ["a", "b", "c"] as const) {
    expect((await frameOf(page, id)).x).toBe(A.x);
  }
});
