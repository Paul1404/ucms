import { createElement, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Tag = "span" | "div" | "h1" | "h2" | "h3" | "p";

interface InlineTextProps {
  value: string;
  onChange: (value: string) => void;
  as?: Tag;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Click-to-edit text rendered directly on the canvas. The element is
 * contentEditable; edits are pushed up on input and blur. To avoid the caret
 * jumping, React never re-renders the text node while the field is focused;
 * external updates (e.g. from the side panel) are synced only when not editing.
 */
export function InlineText({
  value,
  onChange,
  as = "span",
  className,
  placeholder,
  multiline = false,
}: InlineTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const initial = useRef(value);
  const focused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !focused.current && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return createElement(
    as,
    {
      ref,
      contentEditable: true,
      suppressContentEditableWarning: true,
      role: "textbox",
      "aria-label": placeholder,
      "data-placeholder": placeholder,
      spellCheck: true,
      className: cn("inline-editable", className),
      onFocus: () => {
        focused.current = true;
      },
      onBlur: () => {
        focused.current = false;
        onChange(ref.current?.textContent ?? "");
      },
      onInput: () => onChange(ref.current?.textContent ?? ""),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      },
      // Stop a click on the text from also toggling block selection state in
      // a way that steals focus; selection still happens via the container.
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
    initial.current,
  );
}
