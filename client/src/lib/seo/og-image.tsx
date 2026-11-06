import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BOWL, markOutline, STROKE } from "@/components/brand/spiral-geometry";
import { SITE } from "@/lib/constants/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const BACKGROUND = "#0a0c0b";
const SIGNAL = "#16ff00";

function seeded(start: number) {
  let value = start;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/** The hero's particle @, frozen: the same shape, scattered the same way. */
function particleMark() {
  const random = seeded(20260611);
  const outline = markOutline();
  const dots: string[] = [];
  for (let i = 0; i < 5200; i++) {
    const [x, y] = outline[Math.floor(random() * outline.length)];
    const spread = random() < 0.12 ? 5 : 1.5;
    const px = x + (random() + random() + random() - 1.5) * spread;
    const py = y + (random() + random() + random() - 1.5) * spread;
    const lit = random() > 0.84;
    dots.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${(0.12 + random() * 0.2).toFixed(2)}" fill="${lit ? SIGNAL : "#c4cec7"}" opacity="${(0.45 + random() * 0.55).toFixed(2)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${dots.join("")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** The logo itself, solid, as it appears in the site header. */
function solidMark() {
  const { cx, cy, rx, ry } = BOWL;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${SIGNAL}" stroke-width="7" stroke-linejoin="round"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><path d="${STROKE}" stroke-linecap="square"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function font(file: string) {
  return readFile(join(process.cwd(), "node_modules/geist/dist/fonts", file));
}

/** One card layout for the site; each page supplies its own line. */
export async function renderOgImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  const [medium, mono] = await Promise.all([font("geist-sans/Geist-Medium.ttf"), font("geist-mono/GeistMono-Regular.ttf")]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: BACKGROUND, padding: 72, fontFamily: "Geist" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={particleMark()} alt="" width={640} height={640} style={{ position: "absolute", right: -130, top: -5 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 590 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 38, letterSpacing: -1, color: "#f2f5f1" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={solidMark()} alt="" width={42} height={42} style={{ marginRight: 12 }} />
            {SITE.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 20, letterSpacing: 3, color: SIGNAL, textTransform: "uppercase" }}>{eyebrow}</div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 64, lineHeight: 1.06, letterSpacing: -2.5, color: "#f2f5f1" }}>{title}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: medium, weight: 500, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
