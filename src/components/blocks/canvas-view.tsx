import { type CSSProperties, useEffect, useRef, useState } from "react";
import { type Block, DESIGN_WIDTH, type Frame } from "@/lib/blocks";
import { BlockView, CanvasModeContext } from "./block-view";

// Position styles for a block's frame wrapper.
export function framePosition(frame: Frame | undefined): CSSProperties {
  const f = frame ?? { x: 0, y: 0, w: DESIGN_WIDTH, h: 200, z: 1 };
  return {
    position: "absolute",
    left: f.x,
    top: f.y,
    width: f.w,
    height: f.h,
    zIndex: f.z ?? 1,
  };
}

// Visual styles (background, text color, radius, etc.) from a block's style.
export function frameVisual(block: Block): CSSProperties {
  const s = block.style;
  if (!s) return { padding: 24 };
  const style: CSSProperties = {
    padding: s.padding ?? 24,
    borderRadius: s.radius ?? 0,
    opacity: (s.opacity ?? 100) / 100,
  };
  if (s.bg) style.backgroundColor = s.bg;
  if (s.color) style.color = s.color;
  if (s.shadow) style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)";
  if (s.border) style.border = "1px solid rgba(0,0,0,0.1)";
  return style;
}

// Measures the rendered width of an element so the canvas can scale to fit.
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(DESIGN_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, width };
}

// Read-only canvas for the public site. Renders the fixed-width design and
// scales the whole thing to fit the viewport so it matches the editor exactly.
export function CanvasView({ blocks, height }: { blocks: Block[]; height: number }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const scale = Math.min(1, width / DESIGN_WIDTH);

  return (
    <div ref={ref} style={{ width: "100%", height: height * scale, overflow: "hidden" }}>
      <div
        style={{
          width: DESIGN_WIDTH,
          height,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CanvasModeContext.Provider value={true}>
          {[...blocks]
            .sort((a, b) => (a.frame?.z ?? 1) - (b.frame?.z ?? 1))
            .map((block) => (
              <div key={block.id} style={{ ...framePosition(block.frame), ...frameVisual(block) }}>
                <div className="h-full w-full overflow-hidden">
                  <BlockView block={block} />
                </div>
              </div>
            ))}
        </CanvasModeContext.Provider>
      </div>
    </div>
  );
}
