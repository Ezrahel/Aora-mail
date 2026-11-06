/**
 * Regenerates every favicon and app icon from the shared @ geometry.
 * Run with `npm run icons` after changing the mark.
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BOWL, STROKE } from "../src/components/brand/spiral-geometry.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TILE = "#0a0c0b";
const SIGNAL = "#16ff00";

/** The tile keeps the green legible on light browser tabs as well as dark. */
function iconSvg({ scale, weight, radius }) {
  const { cx, cy, rx, ry } = BOWL;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="${radius}" fill="${TILE}"/><g transform="translate(50 50) scale(${scale}) translate(-50 -50)" fill="none" stroke="${SIGNAL}" stroke-width="${weight}" stroke-linejoin="round"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><path d="${STROKE}" stroke-linecap="square"/></g></svg>`;
}

const STANDARD = iconSvg({ scale: 0.84, weight: 9, radius: 20 });
/** At 16px the standard stroke falls under a pixel and the bowl fills in. */
const TINY = iconSvg({ scale: 0.92, weight: 11.5, radius: 16 });
/** iOS rounds its own corners, so this tile runs to the edge. */
const APPLE = iconSvg({ scale: 0.68, weight: 8, radius: 0 });
/** Android may crop to a circle: the mark has to sit inside the safe zone. */
const MASKABLE = iconSvg({ scale: 0.6, weight: 8, radius: 0 });

const png = (svg, size) => sharp(Buffer.from(svg), { density: 72 * (size / 100) * 2 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Packs PNG images into a .ico container. */
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

const favicon = ico([
  { size: 16, data: await png(TINY, 16) },
  { size: 32, data: await png(STANDARD, 32) },
  { size: 48, data: await png(STANDARD, 48) },
]);

await Promise.all([
  writeFile(join(root, "src/app/favicon.ico"), favicon),
  writeFile(join(root, "src/app/icon.svg"), STANDARD),
  writeFile(join(root, "src/app/apple-icon.png"), await png(APPLE, 180)),
  writeFile(join(root, "public/icons/icon-192.png"), await png(STANDARD, 192)),
  writeFile(join(root, "public/icons/icon-512.png"), await png(STANDARD, 512)),
  writeFile(join(root, "public/icons/maskable-512.png"), await png(MASKABLE, 512)),
]);

console.log("Icons written.");
