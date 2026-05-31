import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

// Generates the full favicon/icon set from public/favicon.svg.
// Run with: bun run icons

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "favicon.svg");

const pngTargets = [
  { file: "favicon-16.png", size: 16 },
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-48.png", size: 48 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

async function main() {
  const svg = await readFile(svgPath);

  for (const { file, size } of pngTargets) {
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(join(publicDir, file));
    console.info(`wrote ${file}`);
  }

  const icoSources = await Promise.all(
    [16, 32, 48].map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()),
  );
  const ico = await pngToIco(icoSources);
  await writeFile(join(publicDir, "favicon.ico"), ico);
  console.info("wrote favicon.ico");

  const manifest = {
    name: "ucms",
    short_name: "ucms",
    description: "Lightweight, self-hostable CMS for small organizations",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4338ca",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  await writeFile(
    join(publicDir, "manifest.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.info("wrote manifest.webmanifest");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
