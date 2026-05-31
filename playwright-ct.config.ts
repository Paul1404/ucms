import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/experimental-ct-react";

// Component tests mount the real editor canvas in Chromium without the backend,
// so the pointer-driven behaviour (selection, marquee, multi-drag, arrange) is
// exercised exactly as it runs in the browser. Pure geometry stays in Vitest.
const srcAlias = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  testDir: "./tests/ct",
  timeout: 15_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    trace: "on-first-retry",
    ctViteConfig: {
      resolve: { alias: { "@": srcAlias } },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 960 } },
    },
  ],
});
