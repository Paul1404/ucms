import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  type Block,
  BREAKPOINTS,
  DEFAULT_FRAME,
  type Device,
  type Frame,
  getFrame,
} from "@/lib/blocks";
import { BlockView, CanvasModeContext } from "./block-view";

// Position styles for a block's frame wrapper.
export function framePosition(frame: Frame | undefined): CSSProperties {
  const f = frame ?? DEFAULT_FRAME;
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
  const [width, setWidth] = useState(0);
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

// Read-only canvas for the public site at a single breakpoint. Renders the
// breakpoint's fixed-width design and scales it to fit the container, so the
// layout matches the editor and text keeps its size on smaller screens.
export function CanvasView({
  blocks,
  device,
  height,
}: {
  blocks: Block[];
  device: Device;
  height: number;
}) {
  const designWidth = BREAKPOINTS[device].width;
  const { ref, width } = useElementWidth<HTMLDivElement>();
  // Before measurement (e.g. SSR) assume the design width so there is no flash.
  const scale = width === 0 ? 1 : Math.min(1, width / designWidth);
  const visible = blocks.filter((b) => !b.style?.hidden);

  return (
    <div ref={ref} style={{ width: "100%", height: height * scale, overflow: "hidden" }}>
      <div
        style={{
          width: designWidth,
          height,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CanvasModeContext.Provider value={true}>
          {[...visible]
            .sort((a, b) => (getFrame(a, device).z ?? 1) - (getFrame(b, device).z ?? 1))
            .map((block) => (
              <div
                key={block.id}
                style={{ ...framePosition(getFrame(block, device)), ...frameVisual(block) }}
              >
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
