export const FONTS = ["sans", "serif", "rounded", "mono"] as const;
export type FontChoice = (typeof FONTS)[number];

// Font stacks rely on widely available system fonts so there are no network
// requests or licensing concerns.
export const FONT_STACKS: Record<FontChoice, string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  rounded:
    '"SF Pro Rounded", ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  sans: "Sans",
  serif: "Serif",
  rounded: "Rounded",
  mono: "Mono",
};

// Quick-pick brand colors shown as swatches in the editor.
export const COLOR_PRESETS = [
  "#4338ca",
  "#0ea5e9",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#7c3aed",
  "#0f172a",
];

export function fontStack(font: string | null | undefined): string {
  return FONT_STACKS[(font as FontChoice) ?? "sans"] ?? FONT_STACKS.sans;
}
